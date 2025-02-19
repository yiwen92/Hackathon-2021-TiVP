import React, { useEffect, useMemo } from 'react'
import { Select } from 'antd'

import client, { TopsqlInstanceItem } from '@lib/client'

import commonStyles from './common.module.less'
import { useClientRequest } from '@lib/utils/useClientRequest'
import { calcTimeRange, TimeRange } from '@lib/components'

interface InstanceGroup {
  name: string
  instances: TopsqlInstanceItem[]
}

export interface InstanceSelectProps {
  value: TopsqlInstanceItem
  onChange: (instance: TopsqlInstanceItem) => void
  timeRange: TimeRange
  disabled?: boolean
}

const splitter = ' - '

const combineSelectValue = (item: TopsqlInstanceItem) => {
  if (!item) {
    return ''
  }
  return `${item.instance_type}${splitter}${item.instance}`
}

const splitSelectValue = (v: string): TopsqlInstanceItem => {
  const [instance_type, instance] = v.split(splitter)
  return { instance, instance_type }
}

export function InstanceSelect({
  value,
  onChange,
  timeRange,
  disabled = false,
}: InstanceSelectProps) {
  const { data, isLoading, sendRequest } = useClientRequest(() => {
    const [start, end] = calcTimeRange(timeRange)
    return client.getInstance().topsqlInstancesGet(String(end), String(start))
  })

  useEffect(() => {
    sendRequest()
  }, [timeRange])

  const instances = data?.data
  const instanceGroups: InstanceGroup[] = useMemo(() => {
    if (!instances) {
      return []
    }

    instances.sort((a, b) => {
      const localCompare = a.instance_type!.localeCompare(b.instance_type!)
      if (localCompare === 0) {
        return a.instance!.localeCompare(b.instance!)
      }
      return localCompare
    })

    // Depend on the ordered instances
    return instances.reduce((prev, instance) => {
      const lastGroup = prev[prev.length - 1]
      if (!lastGroup || lastGroup.name !== instance.instance_type) {
        prev.push({ name: instance.instance_type!, instances: [instance] })
        return prev
      }

      lastGroup.instances.push(instance)
      return prev
    }, [] as InstanceGroup[])
  }, [instances])

  useEffect(() => {
    if (!!value) {
      return
    }

    const firstInstance = instanceGroups[0]?.instances[0]
    if (firstInstance) {
      onChange(firstInstance)
    }
  }, [instanceGroups])

  return (
    <Select
      style={{ width: 200 }}
      placeholder="Select Instance"
      value={combineSelectValue(value)}
      onChange={(value) => {
        const instance = splitSelectValue(value)
        onChange(instance)
      }}
      loading={isLoading}
      disabled={disabled}
    >
      {instanceGroups.map((instanceGroup) => (
        <Select.OptGroup label={instanceGroup.name} key={instanceGroup.name}>
          {instanceGroup.instances.map((item) => (
            <Select.Option
              className={commonStyles.select_option}
              value={combineSelectValue(item)}
              key={item.instance}
            >
              <span className={commonStyles.hide}>{instanceGroup.name} - </span>
              {item.instance}
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  )
}
