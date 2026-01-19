export interface DictData {
  dictCode: number
  dictSort: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass: string
  listClass: 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
  [key: string]: any
}
