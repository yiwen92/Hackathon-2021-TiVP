import React, { useCallback } from 'react'
import {
  Root,
  Card,
  Head,
  Pre,
  AnimatedSkeleton,
  ErrorBar,
} from '@lib/components'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Modal } from 'antd'
import client from '@lib/client'
import ChannelForm from './ChannelForm'
import useQueryParams from '@lib/utils/useQueryParams'
import { useClientRequest } from '@lib/utils/useClientRequest'

export default function () {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { id } = useQueryParams()

  const { data, isLoading, error } = useClientRequest((reqConfig) =>
    client.getInstance().metricsGetAlertChannel(id, reqConfig)
  )

  const handleUpdateSubmit = useCallback(
    async (newData) => {
      const dataToSubmit = {
        id: data?.id,
        ...newData,
      }
      try {
        await client.getInstance().metricsUpdateAlertChannel(dataToSubmit)
        Modal.success({
          title: t('alerts.channel_update_page.update_success'),
          onOk: () => navigate(`/alerts/channels`),
        })
      } catch (e) {
        // TODO: Extract to a common component
        Modal.error({
          content: <Pre>{e?.response?.data?.message ?? e.message}</Pre>,
        })
      }
    },
    [data]
  )

  const handleDeleteSubmit = useCallback(async () => {
    const proceed = await new Promise((resolve) => {
      Modal.confirm({
        title: t('alerts.channel_update_page.delete_confirm'),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })

    if (!proceed) {
      return
    }

    try {
      await client
        .getInstance()
        .metricsDeleteAlertChannel(String(data?.id ?? ''))
      Modal.success({
        title: t('alerts.channel_update_page.delete_success'),
        onOk: () => navigate(`/alerts/channels`),
      })
    } catch (e) {
      // TODO: Extract to a common component
      Modal.error({
        content: <Pre>{e?.response?.data?.message ?? e.message}</Pre>,
      })
    }
  }, [data])

  return (
    <Root>
      <Head
        title={t('alerts.channel_update_page.nav.title')}
        back={
          <Link to={`/alerts/channels`}>
            <ArrowLeftOutlined /> {t('alerts.channel_update_page.nav.back')}
          </Link>
        }
      />
      <Card>
        {error && <ErrorBar errors={[error]} />}
        <AnimatedSkeleton showSkeleton={isLoading}>
          {data?.id && (
            <ChannelForm
              onUpdateSubmit={handleUpdateSubmit}
              onDeleteSubmit={handleDeleteSubmit}
              onCancel={() => navigate(`/alerts/channels`)}
              initialValues={data}
            />
          )}
        </AnimatedSkeleton>
      </Card>
    </Root>
  )
}
