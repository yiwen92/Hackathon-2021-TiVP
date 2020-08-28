import {
  Form,
  Space,
  Input,
  Tooltip,
  InputNumber,
  Switch,
  Radio,
  Button,
} from 'antd'
import { useTranslation } from 'react-i18next'
import React, { useCallback, useState } from 'react'
import { FormInstance } from 'antd/lib/form'
import { QuestionCircleOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { MetricsAlertChannel } from '@lib/client'
import { useForm } from 'antd/lib/form/Form'
import { useMount } from 'react-use'

const TYPES = ['web_hook', 'email', 'aliyun_sms', 'wechat_work']

const SubForm = ({ form }: { form: FormInstance }) => {
  const { t } = useTranslation()
  switch (form.getFieldValue('type')) {
    case 'web_hook':
      return (
        <div>
          <Form.Item
            name={['options', 'web_hook', 'url']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.web_hook.url')}
          >
            <Input
              style={{ maxWidth: 500 }}
              placeholder="http://example.com/alert_endpoint"
              suffix={
                <Tooltip title={t('alerts.channel_form.web_hook.url_tooltip')}>
                  <QuestionCircleOutlined />
                </Tooltip>
              }
            />
          </Form.Item>
        </div>
      )
    case 'email':
      return (
        <div>
          <Form.Item
            name={['options', 'email', 'smtp_host']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.smtp_host')}
          >
            <Input style={{ maxWidth: 300 }} placeholder="smtp.example.com" />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'smtp_port']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.smtp_port')}
          >
            <InputNumber
              style={{ maxWidth: 300 }}
              placeholder="25"
              precision={0}
            />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'smtp_user']}
            label={t('alerts.channel_form.email.smtp_user')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'smtp_pass']}
            label={t('alerts.channel_form.email.smtp_pass')}
          >
            <Input style={{ maxWidth: 300 }} type="password" />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'from']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.from')}
          >
            <Input style={{ maxWidth: 300 }} placeholder="alex@example.com" />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'to']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.to')}
          >
            <Input
              style={{ maxWidth: 300 }}
              placeholder="bob@example.com, cora@example.com"
              suffix={
                <Tooltip title={t('alerts.channel_form.email.to_tooltip')}>
                  <QuestionCircleOutlined />
                </Tooltip>
              }
            />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'fire_subject_template']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.fire_subject_template')}
          >
            <Input style={{ maxWidth: 500 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'email', 'fire_body_template']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.email.fire_body_template')}
          >
            <Input.TextArea style={{ maxWidth: 500, height: 100 }} />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, next) =>
              prev.trigger_at_resolve !== next.trigger_at_resolve
            }
          >
            {(form) => (
              <>
                <Form.Item
                  name={['options', 'email', 'resolve_subject_template']}
                  label={t(
                    'alerts.channel_form.email.resolve_subject_template'
                  )}
                  rules={[
                    { required: form.getFieldValue('trigger_at_resolve') },
                  ]}
                >
                  <Input style={{ maxWidth: 500 }} />
                </Form.Item>
                <Form.Item
                  name={['options', 'email', 'resolve_body_template']}
                  label={t('alerts.channel_form.email.resolve_body_template')}
                  rules={[
                    { required: form.getFieldValue('trigger_at_resolve') },
                  ]}
                >
                  <Input.TextArea style={{ maxWidth: 500, height: 100 }} />
                </Form.Item>
              </>
            )}
          </Form.Item>
        </div>
      )
    case 'aliyun_sms':
      return (
        <div>
          <Form.Item>
            <ReactMarkdown
              source={t('alerts.channel_form.aliyun_sms.help')}
              linkTarget={() => '_blank'}
            />
          </Form.Item>
          <Form.Item
            name={['options', 'aliyun_sms', 'access_key_id']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.aliyun_sms.access_key_id')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'aliyun_sms', 'access_secret']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.aliyun_sms.access_secret')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'aliyun_sms', 'phone_numbers']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.aliyun_sms.phone_numbers')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'aliyun_sms', 'sign_name']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.aliyun_sms.sign_name')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            name={['options', 'aliyun_sms', 'fire_template_code']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.aliyun_sms.fire_template_code')}
          >
            <Input style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, next) =>
              prev.trigger_at_resolve !== next.trigger_at_resolve
            }
          >
            {(form) => (
              <Form.Item
                name={['options', 'aliyun_sms', 'resolve_template_code']}
                label={t(
                  'alerts.channel_form.aliyun_sms.resolve_template_code'
                )}
                rules={[{ required: form.getFieldValue('trigger_at_resolve') }]}
              >
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
            )}
          </Form.Item>
        </div>
      )
    case 'wechat_work':
      return (
        <div>
          <Form.Item>
            <ReactMarkdown
              source={t('alerts.channel_form.wechat_work.help')}
              linkTarget={() => '_blank'}
            />
          </Form.Item>
          <Form.Item
            name={['options', 'wechat_work', 'web_hook_url']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.wechat_work.web_hook_url')}
          >
            <Input
              style={{ maxWidth: 500 }}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...."
            />
          </Form.Item>
          <Form.Item
            name={['options', 'wechat_work', 'fire_content_template']}
            rules={[{ required: true }]}
            label={t('alerts.channel_form.wechat_work.fire_content_template')}
          >
            <Input.TextArea style={{ maxWidth: 500, height: 100 }} />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, next) =>
              prev.trigger_at_resolve !== next.trigger_at_resolve
            }
          >
            {(form) => (
              <Form.Item
                name={['options', 'wechat_work', 'resolve_content_template']}
                label={t(
                  'alerts.channel_form.wechat_work.resolve_content_template'
                )}
                rules={[{ required: form.getFieldValue('trigger_at_resolve') }]}
              >
                <Input.TextArea style={{ maxWidth: 500, height: 100 }} />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item
            name={['options', 'wechat_work', 'mention_all']}
            label={t('alerts.channel_form.wechat_work.mention_all')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>
      )
  }
  return null
}

export interface IChannelFormProps {
  initialValues?: MetricsAlertChannel
  onCreateSubmit?: (form: object) => Promise<void>
  onUpdateSubmit?: (form: object) => Promise<void>
  onDeleteSubmit?: () => Promise<void>
  onCancel?: () => void
}

export default function ({
  initialValues,
  onCreateSubmit,
  onUpdateSubmit,
  onDeleteSubmit,
  onCancel,
}: IChannelFormProps) {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = {
    enabled: true,
    trigger_at_resolve: true,
    options: {
      email: {
        smtp_port: 25,
        fire_subject_template: t(
          'alerts.channel_form.email.default_fire_subject_template',
          { skipInterpolation: true }
        ),
        fire_body_template: t(
          'alerts.channel_form.email.default_fire_body_template',
          { skipInterpolation: true }
        ),
        resolve_subject_template: t(
          'alerts.channel_form.email.default_resolve_subject_template',
          { skipInterpolation: true }
        ),
        resolve_body_template: t(
          'alerts.channel_form.email.default_resolve_body_template',
          { skipInterpolation: true }
        ),
      },
      wechat_work: {
        fire_content_template: t(
          'alerts.channel_form.wechat_work.default_fire_content_template',
          { skipInterpolation: true }
        ),
        resolve_content_template: t(
          'alerts.channel_form.wechat_work.default_resolve_content_template',
          { skipInterpolation: true }
        ),
        mention_all: true,
      },
    },
  }

  const handleFinish = useCallback(
    async (data) => {
      setIsSubmitting(true)
      if (!initialValues?.id) {
        if (onCreateSubmit) {
          await onCreateSubmit(data)
        }
      } else {
        if (onUpdateSubmit) {
          await onUpdateSubmit(data)
        }
      }
      setIsSubmitting(false)
    },
    [initialValues, onCreateSubmit, onUpdateSubmit]
  )

  const handleDelete = useCallback(async () => {
    setIsSubmitting(true)
    if (initialValues?.id && onDeleteSubmit) {
      await onDeleteSubmit()
    }
    setIsSubmitting(false)
  }, [initialValues, onDeleteSubmit])

  const [form] = useForm()

  const handleReset = useCallback(() => {
    form.setFieldsValue(defaultValues)
  }, [form])

  useMount(() => {
    if (initialValues) {
      form.resetFields()
      form.setFieldsValue(initialValues)
    }
  })

  return (
    <Form
      layout="vertical"
      onFinish={handleFinish}
      initialValues={defaultValues}
      form={form}
    >
      <Form.Item
        name="name"
        rules={[{ required: true }]}
        label={t('alerts.channel_form.name')}
      >
        <Input style={{ maxWidth: 300 }} />
      </Form.Item>
      <Form.Item
        name="enabled"
        label={t('alerts.channel_form.enabled')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="trigger_at_resolve"
        label={t('alerts.channel_form.trigger_at_resolve')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="type"
        rules={[{ required: true }]}
        label={t('alerts.channel_form.type')}
      >
        <Radio.Group>
          {TYPES.map((type) => (
            <Radio.Button value={type} key={type}>
              {t(`alerts.channel_form.type_values.${type}`)}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Form.Item>
      <Form.Item shouldUpdate={(prev, next) => prev.type !== next.type}>
        {(form) => <SubForm form={form as FormInstance} />}
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" disabled={isSubmitting}>
            {initialValues?.id
              ? t('alerts.channel_form.update')
              : t('alerts.channel_form.create')}
          </Button>
          {initialValues?.id && (
            <Button danger disabled={isSubmitting} onClick={handleDelete}>
              {t('alerts.channel_form.delete')}
            </Button>
          )}
          {initialValues?.id && (
            <Button onClick={handleReset}>
              {t('alerts.channel_form.reset')}
            </Button>
          )}
          {initialValues?.id && (
            <Button disabled={isSubmitting} onClick={onCancel}>
              {t('alerts.channel_form.cancel')}
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  )
}
