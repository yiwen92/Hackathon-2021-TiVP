import React, { useMemo, useCallback, useState } from 'react'
import { Root, CardTable, Head, TextWithInfo, Pre } from '@lib/components'
import client from '@lib/client'
import { useClientRequest } from '@lib/utils/useClientRequest'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import {
  LoadingOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  DownOutlined,
} from '@ant-design/icons'
import { Space, Button, Spin, Dropdown, Menu, Modal, notification } from 'antd'
import { ScrollablePane } from 'office-ui-fabric-react/lib/ScrollablePane'
import { Sticky, StickyPositionType } from 'office-ui-fabric-react/lib/Sticky'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import styles from './ListChannels.module.less'
import openLink from '@lib/utils/openLink'

export default function () {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isTriggerInProgress, setIsTriggerInProgress] = useState(false)

  const { data, isLoading, sendRequest } = useClientRequest((reqConfig) => {
    return client.getInstance().metricsListAlertChannels(reqConfig)
  })

  const handleRefresh = useCallback(() => {
    sendRequest()
  }, [sendRequest])

  const columns = useMemo(() => {
    const c: IColumn[] = [
      {
        key: 'id',
        name: (
          <TextWithInfo.TransKey transKey="alerts.channel_list_page.column.id" />
        ) as any,
        minWidth: 100,
        maxWidth: 100,
        fieldName: 'id',
      },
      {
        key: 'type',
        name: (
          <TextWithInfo.TransKey transKey="alerts.channel_list_page.column.type" />
        ) as any,
        minWidth: 150,
        maxWidth: 300,
        onRender: (item) => {
          return t(`alerts.channel_form.type_values.${item.type}`)
        },
      },
      {
        key: 'enabled',
        name: (
          <TextWithInfo.TransKey transKey="alerts.channel_list_page.column.enabled" />
        ) as any,
        minWidth: 100,
        maxWidth: 100,
        onRender: (item) => {
          if (item.enabled) {
            return <CheckCircleFilled className={styles.success} />
          } else {
            return null
          }
        },
      },
      {
        key: 'trigger_at_resolve',
        name: (
          <TextWithInfo.TransKey transKey="alerts.channel_list_page.column.trigger_at_resolve" />
        ) as any,
        minWidth: 100,
        maxWidth: 100,
        onRender: (item) => {
          if (item.trigger_at_resolve) {
            return <CheckCircleFilled className={styles.success} />
          } else {
            return null
          }
        },
      },
      {
        key: 'name',
        name: (
          <TextWithInfo.TransKey transKey="alerts.channel_list_page.column.name" />
        ) as any,
        minWidth: 100,
        maxWidth: 200,
        fieldName: 'name',
      },
    ]
    return c
  }, [])

  const handleRowClick = useCallback(
    (rec, _idx, ev: React.MouseEvent<HTMLElement>) => {
      openLink(`/alerts/channels/update?id=${rec.id}`, ev, navigate)
    },
    []
  )

  const handleTriggerMenuClick = useCallback(async (e) => {
    let body
    switch (e.key) {
      case 'fire':
        body = require('./alertSampleFire.json')
        break
      case 'resolve':
        body = require('./alertSampleResolve.json')
        break
      default:
        return
    }
    setIsTriggerInProgress(true)
    try {
      await client.getInstance().metricsTriggerAlertWebhook(body)
      notification.success({
        message: t('alerts.channel_list_page.toolbar.simulate_alert_success'),
      })
    } catch (e) {
      Modal.error({
        content: <Pre>{e?.response?.data?.message ?? e.message}</Pre>,
      })
    }
    setIsTriggerInProgress(false)
  }, [])

  const simulateAlertMenu = (
    <Menu onClick={handleTriggerMenuClick}>
      <Menu.Item key="fire">
        {t('alerts.channel_list_page.toolbar.simulate_alert_fire')}
      </Menu.Item>
      <Menu.Item key="resolve">
        {t('alerts.channel_list_page.toolbar.simulate_alert_resolve')}
      </Menu.Item>
    </Menu>
  )

  return (
    <Root>
      <ScrollablePane style={{ height: '100vh' }}>
        <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
          <div style={{ display: 'flow-root' }}>
            <Head
              title={t('alerts.channel_list_page.nav.title')}
              back={
                <Link to={`/alerts`}>
                  <ArrowLeftOutlined /> {t('alerts.channel_list_page.nav.back')}
                </Link>
              }
              titleExtra={
                <Space>
                  {isLoading && (
                    <Spin
                      indicator={
                        <LoadingOutlined style={{ fontSize: 24 }} spin />
                      }
                    />
                  )}
                  <Button onClick={() => navigate(`/alerts/channels/create`)}>
                    {t('alerts.channel_list_page.toolbar.create')}
                  </Button>
                  <Button onClick={handleRefresh}>
                    <ReloadOutlined />{' '}
                    {t('alerts.channel_list_page.toolbar.refresh')}
                  </Button>
                  <Dropdown overlay={simulateAlertMenu}>
                    <Button>
                      {isTriggerInProgress && (
                        <span>
                          <LoadingOutlined spin />{' '}
                        </span>
                      )}
                      {t('alerts.channel_list_page.toolbar.simulate_alert')}{' '}
                      <DownOutlined />
                    </Button>
                  </Dropdown>
                </Space>
              }
            />
          </div>
        </Sticky>
        <CardTable
          cardNoMarginTop
          loading={isLoading}
          columns={columns}
          items={data ?? []}
          onRowClicked={handleRowClick}
          extendLastColumn
        />
      </ScrollablePane>
    </Root>
  )
}
