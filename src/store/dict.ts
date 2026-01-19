import type { DictData } from '@/api/types/dict'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDictData } from '@/api/methods/dict'

function normalizeDictList(payload: DictData[] | Record<string, any> | null | undefined) {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data as DictData[]
  }
  if (payload && Array.isArray(payload.list)) {
    return payload.list as DictData[]
  }
  return [] as DictData[]
}

export const useDictStore = defineStore(
  'dict',
  () => {
    const dictMap = ref<Record<string, DictData[]>>({})
    const loadingMap = ref<Record<string, boolean>>({})

    const loadDict = async (dictType: string) => {
      if (!dictType)
        return []
      if (dictMap.value[dictType]?.length)
        return dictMap.value[dictType]
      if (loadingMap.value[dictType])
        return dictMap.value[dictType] || []

      loadingMap.value[dictType] = true
      try {
        const res = await getDictData(dictType)
        const list = normalizeDictList(res)
        dictMap.value[dictType] = list
        return list
      }
      finally {
        loadingMap.value[dictType] = false
      }
    }

    const ensureDicts = async (dictTypes: string[]) => {
      const types = Array.from(new Set(dictTypes)).filter(Boolean)
      await Promise.all(types.map(type => loadDict(type)))
    }

    const getDictItem = (dictType: string, value?: string | number | null) => {
      const list = dictMap.value[dictType] || []
      if (value === undefined || value === null)
        return undefined
      return list.find(item => item.dictValue === String(value))
    }

    const getDictLabel = (dictType: string, value?: string | number | null) => {
      return getDictItem(dictType, value)?.dictLabel || ''
    }

    const clear = () => {
      dictMap.value = {}
      loadingMap.value = {}
    }

    return {
      dictMap,
      loadDict,
      ensureDicts,
      getDictItem,
      getDictLabel,
      clear,
    }
  },
  {
    persist: true,
  },
)
