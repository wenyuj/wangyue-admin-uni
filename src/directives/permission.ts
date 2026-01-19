import type { Directive } from 'vue'
import { watch } from 'vue'
import { useUserStore } from '@/store'

type PermissionValue = string | string[]

/**
 * 用法示例：
 * 1) 单权限：<button v-permission="'system:user:add'">新增</button>
 * 2) 多权限任一满足：<button v-permission="['system:user:add', 'system:user:edit']">操作</button>
 * 说明：无权限时会隐藏元素（display: none），权限变更后会自动更新显示状态。
 */
// 缓存每个元素的监听器，卸载时用于停止监听，避免内存泄漏
const stopMap = new WeakMap<HTMLElement, () => void>()
// 缓存指令绑定的权限码，避免每次重复读取 binding.value
const valueMap = new WeakMap<HTMLElement, PermissionValue | undefined>()
// 记录元素原始 display，便于权限恢复后还原样式
const displayMap = new WeakMap<HTMLElement, string>()

// 统一权限码格式为数组，便于后续判定
function normalize(value?: PermissionValue) {
  if (!value)
    return []
  return Array.isArray(value) ? value : [value]
}

// 根据权限判断是否显示元素：无权限则隐藏，有权限恢复原样
function updateVisibility(el: HTMLElement, store: ReturnType<typeof useUserStore>) {
  const codes = normalize(valueMap.get(el))
  const allowed = codes.length ? codes.some(code => store.hasPermission(code)) : false

  if (!allowed) {
    if (!displayMap.has(el)) {
      displayMap.set(el, el.style.display || '')
    }
    el.style.display = 'none'
    return
  }

  if (displayMap.has(el)) {
    el.style.display = displayMap.get(el) || ''
    displayMap.delete(el)
  }
}

export const permissionDirective: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    const store = useUserStore()
    // 保存当前元素绑定的权限码，并初始化显示状态
    valueMap.set(el, binding.value)
    updateVisibility(el, store)
    // 监听权限列表变化，动态更新元素显示状态
    const stop = watch(
      () => store.permissions,
      () => updateVisibility(el, store),
      { deep: true },
    )
    stopMap.set(el, stop)
  },
  updated(el, binding) {
    const store = useUserStore()
    // 当绑定值变更时，重新判定显示状态
    valueMap.set(el, binding.value)
    updateVisibility(el, store)
  },
  beforeUnmount(el) {
    const stop = stopMap.get(el)
    if (stop) {
      stop()
    }
    // 清理缓存，避免残留状态
    stopMap.delete(el)
    valueMap.delete(el)
    displayMap.delete(el)
  },
}
