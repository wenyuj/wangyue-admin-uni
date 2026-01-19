import type { DictData } from '../types/dict'
import { alova } from '@/http/alova'

export function getDictData(dictType: string) {
  return alova.Get<DictData[]>(`/common/dict/${dictType}`)
}
