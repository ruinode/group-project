<template>
  <view v-if="tailoring" class="tailored-pet-body">
    <view
      v-if="tailoring.tailArt && view !== 'back'"
      class="tailored-part-window"
    >
      <image
        class="tailored-part-sheet"
        :src="tailoring.tailArt.source"
        :style="tailStyle"
        mode="scaleToFill"
        @error="emit('error')"
      />
    </view>
    <template v-else-if="!tailoring.tailArt">
      <PetBodyPart
        v-for="(part, index) in tailoring.tailParts || []"
        :key="'tail-' + index"
        :appearance="appearance"
        :view="view"
        :bounds="part"
      />
    </template>
    <PetBodyPart
      v-for="(part, index) in tailoring.jointParts || []"
      :key="'joint-' + index"
      :appearance="appearance"
      :view="view"
      :bounds="part"
    />
    <image
      class="tailored-torso"
      :src="tailoring.source"
      :style="torsoStyle"
      mode="scaleToFill"
      @error="emit('error')"
    />
    <TailoredTorsoPart
      v-for="(part, index) in tailoring.furParts || []"
      :key="'fur-' + index"
      :appearance="appearance"
      :outfit="outfit"
      :view="view"
      :bounds="part"
      :tailored="tailoring"
    />
    <image
      v-if="tailoring.furSource"
      class="tailored-torso"
      :src="tailoring.furSource"
      :style="{
        ...torsoStyle,
        filter: petIllustrationFilter(appearance.palette)
      }"
      mode="scaleToFill"
    />
    <template v-if="!hideFeet">
      <PetBodyPart
        v-for="(part, index) in tailoring.feetParts || []"
        :key="'foot-' + index"
        :appearance="appearance"
        :view="view"
        :bounds="part"
      />
    </template>
    <view
      v-if="tailoring.tailArt && view === 'back'"
      class="tailored-part-window"
    >
      <image
        class="tailored-part-sheet"
        :src="tailoring.tailArt.source"
        :style="tailStyle"
        mode="scaleToFill"
        @error="emit('error')"
      />
    </view>
    <view
      v-if="tailoring.headArt"
      class="tailored-head-window"
      :style="headWindowStyle"
    >
      <image
        class="tailored-head-sheet"
        :src="tailoring.headArt.source"
        :style="headStyle"
        mode="scaleToFill"
        @error="emit('error')"
      />
    </view>
    <template v-else>
      <PetBodyPart
        v-for="(part, index) in tailoring.headParts || []"
        :key="'head-' + index"
        :appearance="appearance"
        :view="view"
        :bounds="part"
      />
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import PetBodyPart from './PetBodyPart.vue'
import TailoredTorsoPart from './TailoredTorsoPart.vue'
import { tailoredOutfit } from '../../utils/tailored-outfits.js'
import { wearableBoxStyle } from '../../utils/wearable-fitting.js'
import { petIllustrationFilter } from '../../utils/pet-illustrations.js'

const props = defineProps({
  appearance: { type: Object, required: true },
  outfit: { type: String, required: true },
  view: { type: String, default: 'front' },
  tailored: { type: Object, default: null },
  hideFeet: { type: Boolean, default: false }
})
const emit = defineEmits(['error'])
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
const torsoStyle = computed(() => wearableBoxStyle(tailoring.value?.bounds))
const visibleHeadWidth = computed(() =>
  props.appearance.species === 'mushroom' &&
  props.appearance.feature === 'round-cap'
    ? 0.896
    : 1
)
const headWindowStyle = computed(() => ({
  right: `${(1 - visibleHeadWidth.value) * 100}%`
}))
const headStyle = computed(() => {
  const frame = tailoring.value?.headArt
  if (!frame) return {}
  return {
    width: `${(frame.columns * 100) / visibleHeadWidth.value}%`,
    height: `${frame.rows * 100}%`,
    left: `${(-frame.column * 100) / visibleHeadWidth.value}%`,
    top: `${-frame.row * 100}%`,
    filter: petIllustrationFilter(props.appearance.palette)
  }
})
const tailStyle = computed(() => {
  const frame = tailoring.value?.tailArt
  if (!frame) return {}
  return {
    width: `${frame.columns * 100}%`,
    height: `${frame.rows * 100}%`,
    left: `${-frame.column * 100}%`,
    top: `${-frame.row * 100}%`,
    filter: petIllustrationFilter(props.appearance.palette)
  }
})
</script>

<style scoped>
.tailored-pet-body {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tailored-torso {
  position: absolute;
  pointer-events: none;
}
.tailored-head-window {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}
.tailored-head-sheet {
  position: absolute;
  max-width: none;
  pointer-events: none;
}
.tailored-part-window {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.tailored-part-sheet {
  position: absolute;
  max-width: none;
  pointer-events: none;
}
</style>
