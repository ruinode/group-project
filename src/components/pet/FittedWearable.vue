<template>
  <view
    v-if="art"
    class="fitted-wearable"
    :class="'item-' + itemId"
    :style="wearableBoxStyle(art.bounds)"
  >
    <image
      class="fitted-wearable-image"
      :src="art.source"
      mode="scaleToFill"
      @error="emit('error', itemId)"
    />
  </view>
</template>
<script setup>
import { wearableBoxStyle } from '../../utils/wearable-fitting.js'
defineProps({
  art: { type: Object, default: null },
  itemId: { type: String, default: '' }
})
const emit = defineEmits(['error'])
</script>
<style scoped>
.fitted-wearable {
  position: absolute;
  pointer-events: none;
}
.fitted-wearable-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
