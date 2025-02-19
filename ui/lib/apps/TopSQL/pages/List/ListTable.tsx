import React, { useMemo } from 'react'
import { Tooltip } from 'antd'
import { getValueFormat } from '@baurine/grafana-value-formats'
import { useTranslation } from 'react-i18next'
import { SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { QuestionCircleOutlined } from '@ant-design/icons'

import { TopsqlSummaryItem } from '@lib/client'
import {
  Card,
  CardTable,
  Bar,
  TextWrap,
  HighlightSQL,
  AppearAnimate,
} from '@lib/components'

import { useRecordSelection } from '../../utils/useRecordSelection'
import { ListDetail } from './ListDetail'

interface ListTableProps {
  data: TopsqlSummaryItem[]
  topN: number
}

export type SQLRecord = TopsqlSummaryItem & {
  cpuTime: number
}

const canSelect = (r: SQLRecord): boolean => {
  return !!r.sql_digest && !r.is_other
}

export function ListTable({ data, topN }: ListTableProps) {
  const { t } = useTranslation()
  const { data: tableRecords, capacity } = useTableData(data)
  const tableColumns = useMemo(
    () => [
      {
        name: 'CPU',
        key: 'cpuTime',
        minWidth: 150,
        maxWidth: 250,
        onRender: (rec: SQLRecord) => (
          <Bar textWidth={80} value={rec.cpuTime!} capacity={capacity}>
            {getValueFormat('ms')(rec.cpuTime, 2)}
          </Bar>
        ),
      },
      {
        name: 'Query',
        key: 'query',
        minWidth: 250,
        maxWidth: 550,
        onRender: (rec: SQLRecord) => {
          const text = rec.sql_text || t('topsql.table.others')!
          return rec.is_other ? (
            <Tooltip
              title={t('topsql.table.others_tooltip', { topN })}
              placement="right"
            >
              <span
                style={{
                  verticalAlign: 'middle',
                  fontStyle: 'italic',
                  color: '#aaa',
                }}
              >
                {text} <QuestionCircleOutlined />
              </span>
            </Tooltip>
          ) : (
            <Tooltip
              title={<HighlightSQL sql={text} theme="dark" />}
              placement="right"
            >
              <TextWrap>
                <HighlightSQL sql={text} compact />
              </TextWrap>
            </Tooltip>
          )
        },
      },
    ],
    [capacity]
  )

  const { selectedRecord, selection } = useRecordSelection<SQLRecord>({
    localStorageKey: 'topsql.list_table_selected_key',
    selections: tableRecords,
    getKey: (r) => r.sql_digest!,
    disableSelection: (r) => !canSelect(r),
  })

  return (
    <>
      <Card noMarginBottom noMarginTop>
        <p className="ant-form-item-extra">
          {t('topsql.table.description', { topN })}
        </p>
      </Card>
      <CardTable
        cardNoMarginTop
        cardNoMarginBottom
        getKey={(r: SQLRecord) => r.sql_digest!}
        items={tableRecords || []}
        columns={tableColumns}
        selection={selection}
        selectionMode={SelectionMode.single}
        selectionPreservedOnEmptyClick
        onRowClicked={() => {}}
      />
      <AppearAnimate motionName="contentAnimation">
        {selectedRecord && (
          <ListDetail record={selectedRecord} capacity={capacity} />
        )}
      </AppearAnimate>
    </>
  )
}

function useTableData(records: TopsqlSummaryItem[]) {
  const tableData: { data: SQLRecord[]; capacity: number } = useMemo(() => {
    if (!records) {
      return { data: [], capacity: 0 }
    }
    let capacity = 0
    const d = records
      .map((r) => {
        let cpuTime = 0
        r.plans?.forEach((plan) => {
          plan.timestamp_sec?.forEach((t, i) => {
            cpuTime += plan.cpu_time_ms![i]
          })
        })

        if (capacity < cpuTime) {
          capacity = cpuTime
        }

        return {
          ...r,
          cpuTime,
          plans: r.plans || [],
        }
      })
      .filter((r) => !!r.cpuTime)
      .sort((a, b) => b.cpuTime - a.cpuTime)
      .sort((a, b) => (b.is_other ? -1 : 0))
    return { data: d, capacity }
  }, [records])

  return tableData
}
