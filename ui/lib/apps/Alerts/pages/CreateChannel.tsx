import React, { useCallback } from 'react'
import { Root, Card, Head, Pre } from '@lib/components'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import client from '@lib/client'
import ChannelForm from './ChannelForm'

export default function () {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleCreateSubmit = useCallback(async (data) => {
    try {
      await client.getInstance().metricsCreateAlertChannel(data)
      Modal.success({
        title: t('alerts.channel_create_page.create_success'),
        onOk: () => navigate(`/alerts/channels`),
      })
    } catch (e) {
      // TODO: Extract to a common component
      Modal.error({
        content: <Pre>{e?.response?.data?.message ?? e.message}</Pre>,
      })
    }
  }, [])

  return (
    <Root>
      <Head
        title={t('alerts.channel_create_page.nav.title')}
        back={
          <Link to={`/alerts/channels`}>
            <ArrowLeftOutlined /> {t('alerts.channel_create_page.nav.back')}
          </Link>
        }
      />
      <Card>
        <ChannelForm onCreateSubmit={handleCreateSubmit} />
      </Card>
    </Root>
  )
}
