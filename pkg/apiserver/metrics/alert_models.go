package metrics

import (
	"crypto/tls"
	"database/sql/driver"
	"encoding/json"
	"strings"
	"time"

	"github.com/aliyun/alibaba-cloud-sdk-go/services/dysmsapi"
	"github.com/go-resty/resty/v2"
	"github.com/jeremywohl/flatten"
	"github.com/valyala/fasttemplate"
	"gopkg.in/gomail.v2"

	"github.com/pingcap-incubator/tidb-dashboard/pkg/dbstore"
)

type AlertChannelType string

type AlertHandler interface {
	HandleAlert(alert *PrometheusPostAlert) error
}

const (
	AlertChannelTypeWebHook    AlertChannelType = "web_hook"
	AlertChannelTypeEmail      AlertChannelType = "email"
	AlertChannelTypeAliyunSMS  AlertChannelType = "aliyun_sms"
	AlertChannelTypeWechatWork AlertChannelType = "wechat_work"
)

type ChannelWebHookOptions struct {
	URL string `json:"url"`
}

func (c *ChannelWebHookOptions) HandleAlert(alert *PrometheusPostAlert) error {
	client := resty.New()
	client.SetTimeout(time.Second * 10)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	_, err := client.R().
		SetHeader("Via", "tidb-dashboard").
		SetBody(alert).
		Post(c.URL)

	return err
}

type ChannelEmailOptions struct {
	From string `json:"from"`
	To   string `json:"to"`

	SMTPHost string `json:"smtp_host"`
	SMTPPort int    `json:"smtp_port"`
	SMTPUser string `json:"smtp_user"`
	SMTPPass string `json:"smtp_pass"`

	FireSubjectTemplate    string `json:"fire_subject_template"`
	FireBodyTemplate       string `json:"fire_body_template"`
	ResolveSubjectTemplate string `json:"resolve_subject_template"`
	ResolveBodyTemplate    string `json:"resolve_body_template"`
}

func formatTemplate(template string, values map[string]interface{}) string {
	t := fasttemplate.New(template, "{{", "}}")
	return t.ExecuteString(values)
}

func (c *ChannelEmailOptions) HandleValues(values map[string]interface{}) error {
	m := gomail.NewMessage()
	m.SetHeader("From", c.From)
	m.SetHeader("To", strings.Split(c.To, ",")...)

	var subject string
	var body string
	if values["status"] == "firing" {
		subject = formatTemplate(c.FireSubjectTemplate, values)
		body = formatTemplate(c.FireBodyTemplate, values)
	} else if values["status"] == "resolved" {
		subject = formatTemplate(c.ResolveSubjectTemplate, values)
		body = formatTemplate(c.ResolveBodyTemplate, values)
	} else {
		return nil
	}

	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	d := gomail.NewDialer(c.SMTPHost, c.SMTPPort, c.SMTPUser, c.SMTPPass)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	return d.DialAndSend(m)
}

type ChannelAliyunSMSOptions struct {
	AccessKeyId         string `json:"access_key_id"`
	AccessSecret        string `json:"access_secret"`
	PhoneNumbers        string `json:"phone_numbers"` // Separated by ","
	SignName            string `json:"sign_name"`
	FireTemplateCode    string `json:"fire_template_code"`
	ResolveTemplateCode string `json:"resolve_template_code"`
}

func (c *ChannelAliyunSMSOptions) HandleValues(values map[string]interface{}) error {
	client, err := dysmsapi.NewClientWithAccessKey("cn-hangzhou", c.AccessKeyId, c.AccessSecret)
	if err != nil {
		return err
	}
	client.SetConnectTimeout(time.Second * 10)
	client.SetReadTimeout(time.Second * 30)

	request := dysmsapi.CreateSendSmsRequest()
	request.Scheme = "https"
	request.PhoneNumbers = c.PhoneNumbers
	request.SignName = c.SignName
	if values["status"] == "firing" {
		request.TemplateCode = c.FireTemplateCode
	} else if values["status"] == "resolved" {
		request.TemplateCode = c.ResolveTemplateCode
	} else {
		return nil
	}
	paramJSON, err := json.Marshal(&values)
	if err != nil {
		return err
	}
	request.TemplateParam = string(paramJSON)
	_, err = client.SendSms(request)
	return err
}

type ChannelWechatWorkOptions struct {
	WebHookURL             string `json:"web_hook_url"`
	MentionAll             bool   `json:"mention_all"`
	FireContentTemplate    string `json:"fire_content_template"`
	ResolveContentTemplate string `json:"resolve_content_template"`
}

func (c *ChannelWechatWorkOptions) HandleValues(values map[string]interface{}) error {
	type WechatBodyText struct {
		Content     string   `json:"content"`
		MentionList []string `json:"mentioned_list"`
	}
	type WechatBody struct {
		MsgType string         `json:"msgtype"`
		Text    WechatBodyText `json:"text"`
	}
	var content string
	if values["status"] == "firing" {
		content = formatTemplate(c.FireContentTemplate, values)
	} else if values["status"] == "resolved" {
		content = formatTemplate(c.ResolveContentTemplate, values)
	} else {
		return nil
	}
	mentionList := make([]string, 0)
	if c.MentionAll {
		mentionList = append(mentionList, "@all")
	}
	body := WechatBody{
		MsgType: "text",
		Text: WechatBodyText{
			Content:     content,
			MentionList: mentionList,
		},
	}
	client := resty.New()
	client.SetTimeout(time.Second * 30)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})

	_, err := client.R().
		SetBody(body).
		Post(c.WebHookURL)

	return err
}

type ChannelOptions struct {
	WebHook    *ChannelWebHookOptions    `json:"web_hook,omitempty"`
	Email      *ChannelEmailOptions      `json:"email,omitempty"`
	AliyunSMS  *ChannelAliyunSMSOptions  `json:"aliyun_sms,omitempty"`
	WechatWork *ChannelWechatWorkOptions `json:"wechat_work,omitempty"`
}

func (r *ChannelOptions) Scan(src interface{}) error {
	return json.Unmarshal([]byte(src.(string)), r)
}

func (r *ChannelOptions) Value() (driver.Value, error) {
	val, err := json.Marshal(r)
	return string(val), err
}

type AlertChannel struct {
	ID               uint             `json:"id" gorm:"primary_key"`
	Name             string           `json:"name" gorm:"size:64"`
	Type             AlertChannelType `json:"type" gorm:"size:32"`
	Enabled          *bool            `json:"enabled"`
	TriggerAtResolve *bool            `json:"trigger_at_resolve"` // Whether to trigger when alert is resolved
	Options          *ChannelOptions  `json:"options" gorm:"type:text"`
}

func (c *AlertChannel) Normalize() {
	optBackup := c.Options
	switch c.Type {
	case AlertChannelTypeWebHook:
		c.Options = &ChannelOptions{WebHook: optBackup.WebHook}
	case AlertChannelTypeEmail:
		c.Options = &ChannelOptions{Email: optBackup.Email}
	case AlertChannelTypeAliyunSMS:
		c.Options = &ChannelOptions{AliyunSMS: optBackup.AliyunSMS}
	case AlertChannelTypeWechatWork:
		c.Options = &ChannelOptions{WechatWork: optBackup.WechatWork}
	}
}

func (c *AlertChannel) HandleAlert(alert *PrometheusPostAlert) error {
	if !*c.Enabled {
		return nil
	}
	if alert.Status == "resolved" && !*c.TriggerAtResolve {
		return nil
	}

	f, err := alert.Flatten()
	if err != nil {
		return err
	}

	switch c.Type {
	case AlertChannelTypeWebHook:
		return c.Options.WebHook.HandleAlert(alert)
	case AlertChannelTypeEmail:
		return c.Options.Email.HandleValues(f)
	case AlertChannelTypeAliyunSMS:
		return c.Options.AliyunSMS.HandleValues(f)
	case AlertChannelTypeWechatWork:
		return c.Options.WechatWork.HandleValues(f)
	}
	return nil
}

func autoMigrate(db *dbstore.DB) error {
	return db.AutoMigrate(&AlertChannel{}).
		Error
}

type PrometheusPostAlert struct {
	Status      string            `json:"status"` // resolved|firing
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	StartsAt    string            `json:"startsAt"` // rfc3339
	EndsAt      string            `json:"endsAt"`   // rfc3339
}

func (a *PrometheusPostAlert) Flatten() (map[string]interface{}, error) {
	// Convert to map[string]interface{}
	j, err := json.Marshal(a)
	if err != nil {
		return nil, err
	}
	var nested map[string]interface{}
	err = json.Unmarshal(j, &nested)
	if err != nil {
		return nil, err
	}

	// Flatten it
	return flatten.Flatten(nested, "", flatten.DotStyle)
}

type PrometheusPostContent struct {
	Alerts []PrometheusPostAlert `json:"alerts"`
}
