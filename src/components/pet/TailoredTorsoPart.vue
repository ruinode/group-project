<template>
  <view
    v-if="tailoring && bounds"
    class="tailored-torso-part"
    :style="partStyle"
  >
    <image
      class="tailored-torso-copy"
      :src="tailoring.source"
      :style="copyStyle"
      mode="scaleToFill"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { tailoredOutfit } from '../../utils/tailored-outfits.js'
import { petIllustrationFilter } from '../../utils/pet-illustrations.js'
import { wearableBoxStyle } from '../../utils/wearable-fitting.js'

const props = defineProps({
  appearance: { type: Object, required: true },
  outfit: { type: String, required: true },
  view: { type: String, default: 'front' },
  bounds: { type: Object, default: null },
  tailored: { type: Object, default: null },
  tinted: { type: Boolean, default: true }
})
const tailoring = computed(
  () =>
    props.tailored ||
    tailoredOutfit(
      props.appearance.species,
      props.appearance.feature,
      props.outfit,
      props.view
    )
)
const partStyle = computed(() => ({
  ...wearableBoxStyle(props.bounds),
  borderRadius: props.bounds?.radius || '50%'
}))
const copyStyle = computed(() => {
  if (!props.bounds || !tailoring.value) return {}
  const source = tailoring.value.bounds
  const part = props.bounds
  return {
    left: `${((source.x - part.x) / part.width) * 100}%`,
    top: `${((source.y - part.y) / part.height) * 100}%`,
    width: `${(source.width / part.width) * 100}%`,
    height: `${(source.height / part.height) * 100}%`,
    filter: props.tinted
      ? petIllustrationFilter(props.appearance.palette)
      : 'none'
  }
})
</script>

<style scoped>
.tailored-torso-part {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}
.tailored-torso-copy {
  position: absolute;
  max-width: none;
  pointer-events: none;
}
</style>
