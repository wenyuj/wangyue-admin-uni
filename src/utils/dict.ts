import type { DictData } from '@/api/types/dict'

type TagTheme = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger'

const TAG_THEME_MAP: Record<string, TagTheme> = {
  default: 'secondary',
  error: 'danger',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'secondary',
}

export function resolveTagTheme(listClass?: string) {
  if (!listClass)
    return 'info' as TagTheme
  const key = String(listClass).toLowerCase()
  return TAG_THEME_MAP[key] || 'info'
}

export function buildDictTag(item: DictData | undefined, fallbackLabel: string) {
  return {
    label: item?.dictLabel || fallbackLabel,
    theme: resolveTagTheme(item?.listClass),
  }
}
