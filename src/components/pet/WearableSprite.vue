<template>
  <view
    v-if="art && !failed"
    class="wearable-sprite"
    :class="'item-' + itemId"
    :style="spriteStyle"
  >
    <image
      class="wearable-image"
      :src="art.source"
      :style="imageStyle"
      mode="scaleToFill"
      @error="failed = true"
    />
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { wearableArt } from '../../utils/wearable-art.js'
import { wearableBoxStyle } from '../../utils/wearable-fitting.js'
const props = defineProps({
  itemId: { type: String, default: '' },
  view: { type: String, default: 'front' },
  bounds: { type: Object, default: null },
  half: { type: Number, default: -1 }
})
const failed = ref(false)
const art = computed(() => wearableArt(props.itemId, props.view))
const spriteStyle = computed(() => wearableBoxStyle(props.bounds))
const imageStyle = computed(() => ({
  width: props.half >= 0 ? '200%' : '100%',
  left: props.half === 1 ? '-100%' : '0'
}))
watch(
  () => [props.itemId, props.view],
  () => {
    failed.value = false
  }
)
</script>

<style scoped>
.wearable-sprite {
  position: absolute;
  max-width: none;
  pointer-events: none;
  overflow: hidden;
}
.wearable-image {
  position: absolute;
  top: 0;
  height: 100%;
  max-width: none;
  pointer-events: none;
}
</style>
