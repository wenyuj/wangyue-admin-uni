<script lang="ts" setup>
import type { PropType } from 'vue'
import { useDictStore } from '@/store'
import { buildDictTag } from '@/utils/dict'

const props = defineProps({
  dictType: { type: String, required: true },
  value: { type: [String, Number, null] as PropType<string | number | null>, default: null },
  size: { type: String, default: 'small' },
})

const dictStore = useDictStore()
const dictItem = computed(() => dictStore.getDictItem(props.dictType, props.value))
const tag = computed(() => buildDictTag(dictItem.value, ''))
const theme = computed(() => tag.value.theme)
const visible = computed(() => Boolean(tag.value.label))
</script>

<template>
  <sar-tag v-if="visible" :size="props.size" :theme="theme">
    {{ tag.label }}
  </sar-tag>
</template>
