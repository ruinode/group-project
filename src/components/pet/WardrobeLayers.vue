<template>
  <view
    class="wardrobe-layers"
    :class="['layer-' + layer, 'view-' + view, 'species-' + species]"
    aria-hidden="true"
  >
    <template v-if="layer === 'rear'">
      <WearableSprite
        v-if="equipped.outfit === 'moss-cape' && !tailored"
        :item-id="equipped.outfit"
        :bounds="fit.outfit"
        view="back"
      />
      <WearableSprite
        v-if="equipped.hair && view !== 'back' && !fittedHair"
        :item-id="equipped.hair"
        :bounds="fit.hair"
        view="back"
      />
    </template>
    <template v-else>
      <WearableSprite
        v-if="equipped.outfit && !tailored"
        :item-id="equipped.outfit"
        :bounds="itemBox(equipped.outfit)"
        :view="view"
      />
      <template v-if="equipped.feet">
        <template v-if="fittedFeet">
          <FittedWearable
            v-for="(part, index) in fittedFeet.parts"
            :key="'fitted-shoe-' + index"
            :art="part"
            :item-id="equipped.feet"
            @error="emit('fitted-error', $event)"
          />
        </template>
        <template v-else>
          <WearableSprite
            v-for="(shoe, index) in fit.shoes"
            :key="'shoe-' + index"
            :item-id="equipped.feet"
            :bounds="wearableShoeBox(equipped.feet, fit, index)"
            :view="view"
            :half="index"
          />
          <template v-if="canRestoreBody">
            <PetBodyPart
              v-for="(ankle, index) in fit.ankles"
              :key="'ankle-' + index"
              :appearance="appearance"
              :view="view"
              :bounds="wearableAnkleBox(equipped.feet, fit, index)"
            />
          </template>
        </template>
      </template>
      <PetBodyPart
        v-if="canRestoreBody && !tailored && equipped.outfit && fit.chin"
        :appearance="appearance"
        :view="view"
        :bounds="fit.chin"
      />
      <PetBodyPart
        v-if="
          canRestoreBody &&
          !tailored &&
          equipped.outfit &&
          equipped.outfit !== 'legacy-scarf' &&
          fit.neck
        "
        :appearance="appearance"
        :view="view"
        :bounds="fit.neck"
      />
      <PetBodyPart
        v-if="
          canRestoreBody &&
          !tailored &&
          view === 'back' &&
          species === 'squirrel' &&
          equipped.outfit
        "
        :appearance="appearance"
        :view="view"
        :bounds="fit.tail"
      />
      <view
        v-if="equipped.bag"
        class="bag-attachment"
        :class="['bag-' + equipped.bag, view === 'back' ? 'back-straps' : '']"
        :style="strapStyle"
      >
        <view
          v-if="equipped.bag === 'leaf-backpack'"
          class="shoulder-ribbon ribbon-left"
        ></view>
        <view
          v-if="equipped.bag === 'leaf-backpack'"
          class="shoulder-ribbon ribbon-right"
        ></view>
        <view v-else class="crossbody-ribbon">
          <view class="ribbon-highlight"></view>
        </view>
      </view>
      <WearableSprite
        v-if="
          equipped.bag && (equipped.bag !== 'leaf-backpack' || view === 'back')
        "
        :item-id="equipped.bag"
        :bounds="itemBox(equipped.bag)"
        :view="equipped.bag === 'leaf-backpack' ? 'front' : view"
      />
      <WearableSprite
        v-if="equipped.hand"
        :item-id="equipped.hand"
        :bounds="itemBox(equipped.hand)"
        :view="view"
      />
      <template
        v-if="
          canRestoreBody &&
          !tailored &&
          view !== 'back' &&
          (equipped.outfit || equipped.bag || equipped.hand)
        "
      >
        <PetBodyPart
          v-for="(part, index) in fit.paws"
          :key="'paw-' + index"
          :appearance="appearance"
          :view="view"
          :bounds="part"
        />
      </template>
      <template v-if="canRestoreBody && tailored && view !== 'back'">
        <TailoredTorsoPart
          v-for="(part, index) in tailored.paws || []"
          :key="'tailored-paw-' + index"
          :appearance="appearance"
          :outfit="equipped.outfit"
          :view="view"
          :bounds="part"
          :tailored="tailored"
        />
      </template>
      <template v-if="fittedHair">
        <FittedWearable
          v-for="(part, index) in fittedHair.parts"
          :key="'fitted-hair-' + index"
          :art="part"
          :item-id="equipped.hair"
          @error="emit('fitted-error', $event)"
        />
      </template>
      <WearableSprite
        v-else-if="equipped.hair"
        :item-id="equipped.hair"
        :bounds="itemBox(equipped.hair)"
        :view="view"
      />
      <PetBodyPart
        v-if="canRestoreBody && equipped.hair && !fittedHair && fit.hairBrim"
        :appearance="appearance"
        :view="view"
        :bounds="fit.hairBrim"
      />
      <WearableSprite
        v-if="equipped.head"
        :item-id="equipped.head"
        :bounds="itemBox(equipped.head)"
        :view="view"
      />
      <template
        v-if="
          canRestoreBody &&
          !fittedHair &&
          (equipped.hair ||
            ['straw-hat', 'shell-crown'].includes(equipped.head))
        "
      >
        <PetBodyPart
          v-for="(part, index) in fit.ears"
          :key="'ear-' + index"
          :appearance="appearance"
          :view="view"
          :bounds="part"
        />
      </template>
      <WearableSprite
        v-if="equipped.charm && view !== 'back'"
        :item-id="equipped.charm"
        :bounds="itemBox(equipped.charm)"
        :view="view"
      />
    </template>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import WearableSprite from './WearableSprite.vue'
import PetBodyPart from './PetBodyPart.vue'
import TailoredTorsoPart from './TailoredTorsoPart.vue'
import FittedWearable from './FittedWearable.vue'
import { fittedWearable } from '../../utils/fitted-wearables.js'
import {
  wearableFitting,
  wearableBox,
  wearableBoxStyle,
  wearableShoeBox,
  wearableAnkleBox
} from '../../utils/wearable-fitting.js'
import { wearableArt } from '../../utils/wearable-art.js'
const props = defineProps({
  equipped: { type: Object, default: () => ({}) },
  species: { type: String, default: 'rabbit' },
  feature: { type: String, default: '' },
  view: { type: String, default: 'front' },
  appearance: { type: Object, default: null },
  illustrated: { type: Boolean, default: false },
  unavailableFitted: { type: Array, default: () => [] },
  tailored: { type: Object, default: null },
  layer: { type: String, default: 'front' }
})
const emit = defineEmits(['fitted-error'])
const fit = computed(() => {
  const fitting = wearableFitting(props.species, props.feature, props.view)
  return props.tailored
    ? { ...fitting, paws: props.tailored.paws || [] }
    : fitting
})
const fittedHair = computed(() =>
  props.illustrated && !props.unavailableFitted.includes(props.equipped.hair)
    ? fittedWearable(
        props.species,
        props.feature,
        props.equipped.hair,
        props.view
      )
    : null
)
const fittedFeet = computed(() =>
  props.illustrated && !props.unavailableFitted.includes(props.equipped.feet)
    ? fittedWearable(
        props.species,
        props.feature,
        props.equipped.feet,
        props.view
      )
    : null
)
const canRestoreBody = computed(
  () => props.illustrated && !!props.appearance && props.species !== 'custom'
)
const itemBox = (id) =>
  wearableBox(id, fit.value, props.view, wearableArt(id, props.view))
const strapStyle = computed(() => wearableBoxStyle(fit.value.straps))
</script>

<style scoped>
.wardrobe-layers {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.bag-attachment {
  position: absolute;
  pointer-events: none;
  --ribbon-ink: #5f6847;
  --ribbon-edge: #7e8e59;
  --ribbon-light: #c0cd92;
}
.shoulder-ribbon {
  position: absolute;
  top: 0;
  width: 8%;
  height: 68%;
  border: 1px solid var(--ribbon-ink);
  border-radius: 45% 45% 38% 38%;
  box-sizing: border-box;
  background: linear-gradient(
    90deg,
    var(--ribbon-edge),
    var(--ribbon-light) 38%,
    #9dab73 64%,
    var(--ribbon-edge)
  );
}
.ribbon-left {
  left: 7%;
  transform: rotate(-11deg);
  transform-origin: 50% 8%;
}
.ribbon-right {
  right: 3%;
  transform: rotate(13deg);
  transform-origin: 50% 8%;
}
.crossbody-ribbon {
  position: absolute;
  left: 26%;
  top: 1%;
  width: 8%;
  height: 102%;
  border: 1px solid var(--ribbon-ink);
  border-radius: 45%;
  box-sizing: border-box;
  background: linear-gradient(90deg, #8d7a55, #ccb78c 40%, #a69268 80%);
  transform: rotate(-43deg);
  transform-origin: 50% 3%;
}
.ribbon-highlight {
  position: absolute;
  top: 9%;
  bottom: 7%;
  left: 27%;
  border-left: 1px dotted #ecddb8;
}
.bag-shell-pouch {
  --ribbon-ink: #98755d;
}
.bag-bottle-bag {
  --ribbon-ink: #717d65;
}
.back-straps .shoulder-ribbon {
  width: 10%;
  height: 67%;
}
.back-straps .ribbon-left {
  left: 14%;
}
.back-straps .ribbon-right {
  right: 11%;
}
</style>
