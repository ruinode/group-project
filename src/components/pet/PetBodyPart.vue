<template>
  <view v-if="bounds" class="pet-body-part" :style="clipStyle">
    <view class="body-part-copy" :style="copyStyle">
      <PetIllustration :appearance="appearance" :view="view" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import PetIllustration from './PetIllustration.vue'
import {
  wearableBoxStyle,
  bodyPartCopyStyle
} from '../../utils/wearable-fitting.js'

const props = defineProps({
  appearance: { type: Object, required: true },
  view: { type: String, default: 'front' },
  bounds: { type: Object, default: null }
})
const clipStyle = computed(() => ({
  ...wearableBoxStyle(props.bounds),
  borderRadius: props.bounds?.radius || '50%'
}))
const copyStyle = computed(() =>
  props.bounds ? bodyPartCopyStyle(props.bounds) : {}
)
</script>

<style scoped>
.pet-body-part {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}
.body-part-copy {
  position: absolute;
  pointer-events: none;
}
</style>
