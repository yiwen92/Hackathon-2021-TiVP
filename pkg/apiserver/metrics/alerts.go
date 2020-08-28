package metrics

import (
	"crypto/tls"
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/jeremywohl/flatten"

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
	From string   `json:"from"`
	To   []string `json:"to"`
	CC   []string `json:"cc"`

	SMTPHost string `json:"smtp_host"`
	SMTPPort int    `json:"smtp_port"`
	SMTPUser string `json:"smtp_user"`
	SMTPPass string `json:"smtp_pass"`
}

func (c *ChannelEmailOptions) HandleValues(values map[string]interface{}) error {
	return nil
}

type ChannelAliyunSMSOptions struct {
	AccessKeyId  string `json:"access_key_id"`
	AccessSecret string `json:"access_secret"`
	PhoneNumbers string `json:"phone_numbers"` // Separated by ","
	SignName     string `json:"sign_name"`
	TemplateCode string `json:"template_code"`
}

func (c *ChannelAliyunSMSOptions) HandleValues(values map[string]interface{}) error {
	return nil
}

type ChannelWechatWorkOptions struct {
	WebHookURL string `json:"web_hook_url"`
}

func (c *ChannelWechatWorkOptions) HandleValues(values map[string]interface{}) error {
	return nil
}

type ChannelOptions struct {
	WebHook    ChannelWebHookOptions    `json:"web_hook"`
	Email      ChannelEmailOptions      `json:"email"`
	AliyunSMS  ChannelAliyunSMSOptions  `json:"aliyun_sms"`
	WechatWork ChannelWechatWorkOptions `json:"wechat_work"`
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
	Type             AlertChannelType `json:"type" gorm:"size:32"`
	Enabled          bool             `json:"enabled"`
	TriggerAtResolve bool             `json:"trigger_at_resolve"` // Whether to trigger when alert is resolved
	Options          *ChannelOptions  `json:"options"`
}

func (c *AlertChannel) HandleAlert(alert *PrometheusPostAlert) error {
	if !c.Enabled {
		return nil
	}
	if alert.Status == "resolved" && !c.TriggerAtResolve {
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
	Alerts []PrometheusPostAlert
}
