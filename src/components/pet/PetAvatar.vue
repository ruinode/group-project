<template>
  <view
    class="pet-avatar"
    :class="[
      'species-' + pet.species,
      'feature-' + pet.feature,
      'accessory-' + pet.accessory,
      'view-' + currentView,
      equippedOrnament ? 'wearing-' + equippedOrnament : '',
      { 'is-walking': walking }
    ]"
    :style="avatarStyle"
    aria-hidden="true"
  >
    <view
      v-if="pet.species !== 'custom' || customSource"
      class="pet-shadow"
    ></view>
    <view class="avatar-bob">
      <WardrobeLayers
        v-if="wearableVisible"
        class="wardrobe-rear"
        layer="rear"
        :equipped="effectiveWardrobe"
        :appearance="pet"
        :illustrated="illustrated"
        :unavailable-fitted="unavailableFitted"
        @fitted-error="fittedFailed"
        :tailored="tailoring"
        :view="currentView"
        :species="pet.species"
        :feature="pet.feature"
      />
      <view class="pet-body-layer">
        <template v-if="pet.species === 'custom'">
          <image
            v-if="customSource"
            class="custom-sprite"
            :src="customSource"
            mode="aspectFit"
          />
        </template>
        <TailoredPetBody
          v-else-if="tailoring"
          :appearance="pet"
          :outfit="effectiveWardrobe.outfit"
          :view="currentView"
          :tailored="tailoring"
          :hide-feet="Boolean(fittedFeet)"
          @error="tailoringFailed = true"
        />
        <PetIllustration
          v-else-if="illustrationFrame && !illustrationFailed"
          :appearance="pet"
          :view="currentView"
          :hide-feet="Boolean(fittedFeet)"
          @error="illustrationFailed = true"
        />
        <template v-else>
          <view class="pet-foot foot-left">
            <view class="shape-fill"></view>
          </view>
          <view class="pet-foot foot-right">
            <view class="shape-fill"></view>
          </view>
          <view class="pet-figure">
            <view v-if="pet.species === 'squirrel'" class="squirrel-tail">
              <view class="shape-fill"></view>
              <view class="tail-curl"></view>
            </view>
            <view v-if="pet.species === 'rabbit'" class="rabbit-pom">
              <view class="shape-fill"></view>
            </view>
            <template v-if="pet.species !== 'mushroom'">
              <view class="pet-ear ear-left">
                <view class="shape-fill"></view>
                <view v-if="currentView === 'front'" class="ear-inner"></view>
              </view>
              <view class="pet-ear ear-right">
                <view class="shape-fill"></view>
                <view v-if="currentView === 'front'" class="ear-inner"></view>
              </view>
            </template>
            <view class="pet-body">
              <view class="shape-fill"></view>
              <view v-if="currentView === 'front'" class="pet-tummy"></view>
            </view>
            <view class="pet-arm arm-left">
              <view class="shape-fill"></view>
            </view>
            <view class="pet-arm arm-right">
              <view class="shape-fill"></view>
            </view>
            <view class="pet-head">
              <view class="shape-fill"></view>
              <template v-if="currentView === 'front'">
                <view class="face-patch"></view>
                <view class="pet-cheek cheek-left"></view>
                <view class="pet-cheek cheek-right"></view>
                <view class="pet-eye eye-left"></view>
                <view class="pet-eye eye-right"></view>
                <view v-if="pet.species === 'capybara'" class="capy-muzzle">
                  <view class="capy-nose">
                    <view class="nostril nostril-left"></view>
                    <view class="nostril nostril-right"></view>
                  </view>
                  <view class="capy-mouth"></view>
                </view>
                <template v-else>
                  <view class="pet-nose"></view>
                  <view class="pet-mouth"></view>
                </template>
              </template>
            </view>
            <view v-if="pet.species === 'mushroom'" class="mushroom-cap">
              <view class="shape-fill"></view>
              <view v-if="currentView === 'front'" class="cap-rim"></view>
              <view class="cap-spot spot-one"></view>
              <view class="cap-spot spot-two"></view>
              <view class="cap-spot spot-three"></view>
            </view>
          </view>
        </template>
      </view>
      <WardrobeLayers
        v-if="wearableVisible"
        class="wardrobe-front"
        layer="front"
        :equipped="effectiveWardrobe"
        :appearance="pet"
        :illustrated="illustrated"
        :unavailable-fitted="unavailableFitted"
        @fitted-error="fittedFailed"
        :tailored="tailoring"
        :view="currentView"
        :species="pet.species"
        :feature="pet.feature"
      />
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { defaultPet, paletteOptions } from '../../utils/pet-appearance.js'
import { artFrameSource } from '../../utils/pet-art.js'
import PetIllustration from './PetIllustration.vue'
import WardrobeLayers from './WardrobeLayers.vue'
import TailoredPetBody from './TailoredPetBody.vue'
import { petIllustration } from '../../utils/pet-illustrations.js'
import { tailoredOutfit } from '../../utils/tailored-outfits.js'
import { fittedWearable } from '../../utils/fitted-wearables.js'

const props = defineProps({
  appearance: { type: Object, default: () => defaultPet() },
  walking: { type: Boolean, default: false },
  facing: { type: Number, default: 1 },
  view: { type: String, default: 'front' },
  ornament: { type: String, default: '' },
  wardrobe: { type: Object, default: null }
})

const pet = computed(() => ({ ...defaultPet(), ...props.appearance }))
const currentView = computed(() => (props.view === 'back' ? 'back' : 'front'))
const illustrationFailed = ref(false)
const illustrationFrame = computed(() =>
  petIllustration(pet.value.species, pet.value.feature, currentView.value)
)
watch(
  () => pet.value.species,
  () => {
    illustrationFailed.value = false
  }
)
const equippedOrnament = computed(() =>
  ['lily-pad', 'reed-bow', 'bubble-star'].includes(props.ornament)
    ? props.ornament
    : ''
)
const customSource = computed(() => {
  if (pet.value.species !== 'custom') return ''
  const frame = pet.value.art?.[currentView.value]
  return frame ? artFrameSource(frame) : ''
})
const illustrated = computed(() =>
  Boolean(illustrationFrame.value && !illustrationFailed.value)
)
const tailoringFailed = ref(false)
const effectiveWardrobe = computed(() => {
  const equipped = { ...(props.wardrobe || {}) }
  if (pet.value.species !== 'custom') {
    if (!equipped.bag && pet.value.accessory === 'satchel')
      equipped.bag = 'legacy-satchel'
    if (!equipped.head && pet.value.accessory === 'flower')
      equipped.head = 'legacy-flower'
    if (!equipped.outfit && pet.value.accessory === 'scarf')
      equipped.outfit = 'legacy-scarf'
  }
  if (props.wardrobe === null && equippedOrnament.value) {
    equipped[equippedOrnament.value === 'bubble-star' ? 'charm' : 'head'] =
      equippedOrnament.value
  }
  return equipped
})
const tailoring = computed(() =>
  illustrated.value && !tailoringFailed.value
    ? tailoredOutfit(
        pet.value.species,
        pet.value.feature,
        effectiveWardrobe.value.outfit,
        currentView.value
      )
    : null
)
const fittedFeet = computed(() =>
  illustrated.value &&
  !unavailableFitted.value.includes(effectiveWardrobe.value.feet)
    ? fittedWearable(
        pet.value.species,
        pet.value.feature,
        effectiveWardrobe.value.feet,
        currentView.value
      )
    : null
)
const unavailableFitted = ref([])
function fittedFailed(itemId) {
  if (!unavailableFitted.value.includes(itemId))
    unavailableFitted.value = [...unavailableFitted.value, itemId]
}
watch(
  () => [pet.value.species, pet.value.feature, currentView.value],
  () => {
    unavailableFitted.value = []
  }
)
watch(
  () => [
    pet.value.species,
    pet.value.feature,
    effectiveWardrobe.value.outfit,
    currentView.value
  ],
  () => {
    tailoringFailed.value = false
  }
)
const wearableVisible = computed(
  () =>
    (pet.value.species !== 'custom' || Boolean(customSource.value)) &&
    Object.values(effectiveWardrobe.value).some(Boolean)
)
const avatarStyle = computed(() => {
  const palette =
    paletteOptions.find((item) => item.id === pet.value.palette) ||
    paletteOptions[0]
  return {
    '--pet-color': palette.color,
    '--pet-shade': palette.shade,
    '--pet-ink': palette.ink,
    '--pet-inner': palette.inner,
    transform: `scaleX(${props.facing < 0 ? -1 : 1})`
  }
})
</script>

<style scoped>
.pet-body-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.wardrobe-rear {
  z-index: 0;
}
.wardrobe-front {
  z-index: 2;
}

.pet-avatar {
  position: relative;
  width: 100%;
  height: 100%;
  --pet-color: #f4dfb5;
  --pet-shade: #d6b88c;
  --pet-ink: #7a5b43;
  --pet-inner: #efb79a;
  --pet-cream: #fff1d4;
  --pet-face-ink: #49392e;
}
.pet-shadow {
  position: absolute;
  left: 17%;
  bottom: 1%;
  width: 68%;
  height: 9%;
  background: #50462c26;
  border-radius: 50%;
}
.pet-figure {
  position: absolute;
  inset: 0;
}
.avatar-bob,
.legacy-accessories {
  position: absolute;
  inset: 0;
}
.legacy-accessories {
  pointer-events: none;
}
.custom-sprite {
  position: absolute;
  left: 5%;
  top: 2%;
  width: 90%;
  height: 94%;
  image-rendering: pixelated;
}
.pet-body,
.pet-head,
.pet-arm,
.pet-ear,
.pet-foot,
.mushroom-cap,
.squirrel-tail,
.rabbit-pom {
  position: absolute;
  background: var(--pet-ink);
}
.shape-fill {
  position: absolute;
  inset: 3%;
  overflow: hidden;
  border-radius: inherit;
  background: var(--pet-color);
}
.shape-fill::before,
.shape-fill::after {
  content: '';
  position: absolute;
}
.shape-fill::before {
  left: 16%;
  top: 10%;
  width: 24%;
  height: 10%;
  border-radius: 25%;
  background: #fff9e873;
}
.shape-fill::after {
  right: 0;
  bottom: 0;
  width: 73%;
  height: 17%;
  border-radius: 55% 0 0 0;
  background: var(--pet-shade);
}
.pet-body {
  left: 29%;
  top: 59%;
  width: 48%;
  height: 34%;
  border-radius: 40% 45% 35% 37%;
}
.pet-tummy {
  position: absolute;
  left: 23%;
  bottom: 12%;
  width: 57%;
  height: 62%;
  background: var(--pet-cream);
  border-radius: 50% 50% 40% 40%;
}
.pet-head {
  left: 21%;
  top: 32%;
  width: 65%;
  height: 45%;
  border-radius: 49% 50% 44% 45%;
}
.face-patch {
  position: absolute;
  left: 9%;
  top: 39%;
  width: 82%;
  height: 53%;
  background: var(--pet-cream);
  border-radius: 46% 46% 42% 42%;
}
.pet-arm {
  top: 69%;
  width: 17%;
  height: 18%;
  border-radius: 50% 50% 45% 45%;
  transform-origin: 50% 15%;
}
.pet-arm .shape-fill {
  inset: 5%;
}
.arm-left {
  left: 22%;
  transform: rotate(-15deg);
}
.arm-right {
  left: 70%;
  transform: rotate(14deg);
}
.pet-foot {
  bottom: 3%;
  width: 20%;
  height: 11%;
  border-radius: 45% 45% 30% 30%;
  transform-origin: 50% 10%;
}
.pet-foot .shape-fill {
  inset: 7%;
  background: var(--pet-shade);
}
.pet-foot .shape-fill::before {
  left: 16%;
  top: 27%;
  width: 36%;
  height: 17%;
}
.foot-left {
  left: 28%;
}
.foot-right {
  left: 59%;
}
.pet-eye {
  position: absolute;
  top: 37%;
  width: 9%;
  height: 18%;
  background: var(--pet-face-ink);
  border-radius: 45%;
}
.pet-eye::after {
  content: '';
  position: absolute;
  left: 15%;
  top: 11%;
  width: 35%;
  height: 29%;
  border-radius: 25%;
  background: #fff8e8;
}
.eye-left {
  left: 26%;
}
.eye-right {
  right: 24%;
}
.pet-cheek {
  position: absolute;
  top: 57%;
  width: 17%;
  height: 12%;
  border-radius: 50%;
  background: #e9a58c9e;
}
.cheek-left {
  left: 13%;
}
.cheek-right {
  right: 11%;
}
.pet-nose {
  position: absolute;
  left: 47%;
  top: 56%;
  width: 7%;
  height: 5%;
  border-radius: 35% 35% 50% 50%;
  background: #b57a66;
}
.pet-mouth {
  position: absolute;
  left: 44%;
  top: 63%;
  width: 13%;
  height: 7%;
  border-radius: 0 0 50% 50%;
  background: var(--pet-face-ink);
}
.pet-mouth::after {
  content: '';
  position: absolute;
  left: 12%;
  top: -5%;
  width: 76%;
  height: 73%;
  border-radius: 0 0 50% 50%;
  background: var(--pet-cream);
}
.pet-ear .shape-fill {
  inset: 5%;
}
.ear-inner {
  position: absolute;
  left: 25%;
  top: 17%;
  width: 50%;
  height: 64%;
  border-radius: inherit;
  background: var(--pet-inner);
}

/* The long upright ear and low folded ear give the rabbit its own silhouette. */
.species-rabbit .ear-left {
  left: 26%;
  top: 2%;
  width: 18%;
  height: 43%;
  border-radius: 55% 55% 38% 38%;
  transform: rotate(-18deg);
}
.species-rabbit .ear-right {
  left: 66%;
  top: 26%;
  width: 19%;
  height: 34%;
  border-radius: 48% 48% 45% 45%;
  transform: rotate(-46deg);
  transform-origin: 50% 8%;
}
.species-rabbit.feature-upright .ear-right {
  left: 63%;
  top: 3%;
  height: 42%;
  transform: rotate(18deg);
}
.species-rabbit.feature-short .pet-ear {
  top: 16%;
  height: 25%;
}
.species-rabbit.feature-short .ear-right {
  left: 63%;
  transform: rotate(16deg);
}
.rabbit-pom {
  left: 16%;
  top: 75%;
  width: 19%;
  height: 17%;
  border-radius: 47%;
}
.rabbit-pom .shape-fill {
  background: var(--pet-cream);
}

/* A broad cap, scallop-like cream rim and tiny stem replace animal ears. */
.species-mushroom .pet-head {
  left: 26%;
  top: 45%;
  width: 50%;
  height: 38%;
  border-radius: 49% 49% 46% 46%;
}
.species-mushroom .pet-head .shape-fill,
.species-mushroom .pet-body .shape-fill,
.species-mushroom .pet-arm .shape-fill {
  background: var(--pet-cream);
}
.species-mushroom .pet-body {
  left: 30%;
  top: 67%;
  width: 43%;
  height: 26%;
}
.species-mushroom .pet-arm {
  top: 72%;
  width: 15%;
  height: 15%;
}
.species-mushroom .arm-left {
  left: 23%;
}
.species-mushroom .arm-right {
  left: 65%;
}
.species-mushroom .foot-left {
  left: 29%;
}
.species-mushroom .foot-right {
  left: 56%;
}
.species-mushroom .pet-eye {
  top: 39%;
  height: 18%;
  width: 10%;
}
.species-mushroom .pet-nose {
  top: 58%;
}
.species-mushroom .pet-mouth {
  top: 66%;
}
.mushroom-cap {
  left: 9%;
  top: 14%;
  width: 84%;
  height: 41%;
  border-radius: 52% 52% 20% 20%;
  transform: rotate(-3deg);
}
.mushroom-cap .shape-fill {
  inset: 3%;
}
.cap-rim {
  position: absolute;
  left: 4%;
  bottom: 5%;
  width: 92%;
  height: 21%;
  border-radius: 48% 48% 36% 36%;
  background: #e3c39a;
}
.cap-rim::after {
  content: '';
  position: absolute;
  inset: 0 0 37%;
  border-radius: 45%;
  background: var(--pet-cream);
}
.cap-spot {
  position: absolute;
  background: #ffedbd;
  border-radius: 42%;
  transform: rotate(-18deg);
}
.spot-one {
  left: 23%;
  top: 28%;
  width: 20%;
  height: 22%;
}
.spot-two {
  left: 61%;
  top: 19%;
  width: 13%;
  height: 17%;
}
.spot-three {
  left: 57%;
  top: 55%;
  width: 9%;
  height: 12%;
}
.feature-wide-cap .mushroom-cap {
  left: 3%;
  top: 20%;
  width: 94%;
  height: 35%;
  border-radius: 50% 50% 19% 19%;
}

/* A low, wide head and big muzzle make the capybara calm and sturdy. */
.species-capybara .pet-head {
  left: 13%;
  top: 23%;
  width: 77%;
  height: 47%;
  border-radius: 43% 44% 40% 41%;
}
.species-capybara .pet-body {
  left: 25%;
  top: 52%;
  width: 55%;
  height: 41%;
}
.species-capybara .pet-tummy {
  left: 32%;
  width: 49%;
  height: 57%;
}
.species-capybara .pet-ear {
  top: 16%;
  width: 18%;
  height: 22%;
  border-radius: 48% 48% 40% 40%;
}
.species-capybara .ear-left {
  left: 21%;
  transform: rotate(-15deg);
}
.species-capybara .ear-right {
  left: 67%;
  transform: rotate(15deg);
}
.species-capybara.feature-perky .pet-ear {
  top: 9%;
  height: 29%;
}
.species-capybara .pet-arm {
  top: 63%;
  width: 17%;
  height: 23%;
}
.species-capybara .arm-left {
  left: 22%;
}
.species-capybara .arm-right {
  left: 70%;
}
.species-capybara .face-patch {
  display: none;
}
.species-capybara .pet-eye {
  top: 34%;
  width: 7%;
  height: 15%;
}
.species-capybara .eye-left {
  left: 23%;
}
.species-capybara .eye-right {
  right: 20%;
}
.species-capybara .pet-cheek {
  top: 56%;
  height: 13%;
}
.species-capybara .cheek-left {
  left: 10%;
}
.species-capybara .cheek-right {
  right: 7%;
}
.capy-muzzle {
  position: absolute;
  left: 31%;
  top: 43%;
  width: 44%;
  height: 45%;
  border-radius: 42% 42% 45% 45%;
  background: var(--pet-cream);
}
.capy-nose {
  position: absolute;
  left: 22%;
  top: 6%;
  width: 61%;
  height: 36%;
  border-radius: 40% 40% 32% 32%;
  background: #9c7355;
}
.nostril {
  position: absolute;
  bottom: 22%;
  width: 13%;
  height: 28%;
  border-radius: 30%;
  background: var(--pet-face-ink);
}
.nostril-left {
  left: 18%;
}
.nostril-right {
  right: 18%;
}
.capy-mouth {
  position: absolute;
  left: 42%;
  top: 53%;
  width: 19%;
  height: 15%;
  background: #8e6951;
  border-radius: 0 0 50% 50%;
}
.capy-mouth::after {
  content: '';
  position: absolute;
  left: 14%;
  top: -10%;
  width: 72%;
  height: 80%;
  border-radius: 0 0 50% 50%;
  background: var(--pet-cream);
}

/* The spiral tail remains behind the body, with clear pointed cheeky ears. */
.squirrel-tail {
  left: 5%;
  top: 37%;
  width: 41%;
  height: 52%;
  border-radius: 68% 65% 60% 65%;
  transform: rotate(-10deg);
}
.squirrel-tail .shape-fill {
  inset: 4%;
  background: var(--pet-shade);
}
.tail-curl {
  position: absolute;
  left: 17%;
  top: 15%;
  width: 69%;
  height: 63%;
  border-radius: 50%;
  background: var(--pet-cream);
}
.tail-curl::before {
  content: '';
  position: absolute;
  left: 18%;
  top: 17%;
  width: 67%;
  height: 67%;
  border-radius: 50%;
  background: var(--pet-color);
}
.tail-curl::after {
  content: '';
  position: absolute;
  left: 27%;
  top: 49%;
  width: 40%;
  height: 40%;
  border-radius: 50% 50% 25% 50%;
  background: var(--pet-cream);
}
.species-squirrel .pet-head {
  left: 29%;
  top: 28%;
  width: 63%;
  height: 46%;
  border-radius: 48% 48% 45% 45%;
}
.species-squirrel .pet-body {
  left: 37%;
  top: 62%;
  width: 44%;
  height: 30%;
}
.species-squirrel .pet-ear {
  top: 17%;
  width: 20%;
  height: 24%;
  border-radius: 2% 70% 22% 30%;
}
.species-squirrel .ear-left {
  left: 34%;
  transform: rotate(-13deg);
}
.species-squirrel .ear-right {
  left: 65%;
  transform: rotate(30deg);
}
.species-squirrel.feature-round .pet-ear {
  top: 18%;
  height: 22%;
  border-radius: 48%;
}
.species-squirrel .arm-left {
  left: 30%;
}
.species-squirrel .arm-right {
  left: 72%;
}
.species-squirrel .foot-left {
  left: 37%;
}
.species-squirrel .foot-right {
  left: 65%;
}
.species-squirrel .face-patch {
  left: 6%;
  top: 36%;
  width: 88%;
  height: 57%;
  border-radius: 50% 50% 40% 40%;
}
.species-squirrel .face-patch::before {
  content: '';
  position: absolute;
  left: 35%;
  top: -18%;
  width: 30%;
  height: 44%;
  border-radius: 50% 50% 0 0;
  background: var(--pet-cream);
}

/* Accessories are attached to the figure so they bob with the animal. */
.pet-scarf {
  position: absolute;
  left: 32%;
  top: 69%;
  width: 45%;
  height: 9%;
  border-radius: 16% 20% 45% 40%;
  background: #60754c;
  transform: rotate(5deg);
}
.scarf-band {
  position: absolute;
  inset: 12% 5% 24%;
  border-radius: inherit;
  background: #9eb57d;
}
.scarf-end {
  position: absolute;
  left: 64%;
  top: 55%;
  width: 26%;
  height: 156%;
  border-radius: 10% 10% 24% 10%;
  background: #60754c;
  transform: rotate(-12deg);
}
.scarf-end .shape-fill {
  inset: 10%;
  background: #8da76f;
}
.scarf-end .shape-fill::before,
.scarf-end .shape-fill::after {
  display: none;
}
.species-mushroom .pet-scarf {
  left: 30%;
  top: 76%;
  width: 43%;
}
.species-capybara .pet-scarf {
  left: 24%;
  top: 62%;
  width: 56%;
}
.species-squirrel .pet-scarf {
  left: 37%;
  top: 69%;
  width: 44%;
}
.pet-satchel {
  position: absolute;
  left: 22%;
  top: 65%;
  width: 57%;
  height: 28%;
}
.bag-strap {
  position: absolute;
  left: 12%;
  top: 28%;
  width: 87%;
  height: 11%;
  border-radius: 12%;
  background: #68794f;
  transform: rotate(-33deg);
}
.bag-body {
  position: absolute;
  left: 0;
  bottom: 3%;
  width: 49%;
  height: 58%;
  border-radius: 13% 16% 23% 23%;
  background: #657447;
}
.bag-body .shape-fill {
  inset: 7%;
  background: #91a96c;
}
.bag-body .shape-fill::after {
  background: #7c965c;
}
.bag-flap {
  position: absolute;
  left: 7%;
  top: 7%;
  width: 86%;
  height: 39%;
  border-radius: 5% 5% 35% 35%;
  background: #a7b67d;
}
.bag-button {
  position: absolute;
  left: 44%;
  top: 38%;
  width: 14%;
  height: 18%;
  border-radius: 20%;
  background: #f4d28a;
}
.species-mushroom .pet-satchel {
  left: 25%;
  top: 70%;
  width: 49%;
  height: 23%;
}
.species-squirrel .pet-satchel {
  left: 33%;
}
.pet-flower {
  position: absolute;
  left: 70%;
  top: 33%;
  width: 20%;
  height: 18%;
  transform: rotate(15deg);
}
.flower-leaf {
  position: absolute;
  right: -9%;
  bottom: 0;
  width: 55%;
  height: 45%;
  border-radius: 60% 10% 65% 10%;
  background: #7f985f;
  transform: rotate(8deg);
}
.flower-petal {
  position: absolute;
  left: 32%;
  top: 0;
  width: 36%;
  height: 100%;
  border-radius: 48%;
  background: #f9da91;
}
.petal-two {
  transform: rotate(60deg);
}
.petal-three {
  transform: rotate(120deg);
}
.flower-center {
  position: absolute;
  left: 35%;
  top: 35%;
  width: 30%;
  height: 30%;
  border-radius: 38%;
  background: #b48750;
}
.species-mushroom .pet-flower {
  left: 72%;
  top: 21%;
}
.species-capybara .pet-flower {
  left: 71%;
  top: 23%;
}
.species-squirrel .pet-flower {
  left: 74%;
  top: 32%;
}

/* A back is a separate view: no muzzle, pink inner ears or front bib. */
.view-back .pet-head {
  border-radius: 48% 48% 45% 45%;
}
.view-back .pet-head > .shape-fill::before {
  left: 29%;
  width: 32%;
  height: 8%;
}
.view-back .pet-arm {
  top: 71%;
  height: 17%;
}
.view-back .rabbit-pom {
  left: 43%;
  top: 78%;
  width: 23%;
  height: 18%;
  z-index: 3;
}
.view-back .rabbit-pom .shape-fill {
  inset: 5%;
  background: var(--pet-cream);
}
.view-back .rabbit-pom .shape-fill::after {
  height: 13%;
  background: #e6d4b4;
}
.view-back.species-mushroom .mushroom-cap {
  border-radius: 52% 52% 31% 31%;
}
.view-back.species-mushroom .spot-one {
  left: 17%;
  top: 41%;
  width: 16%;
}
.view-back.species-mushroom .spot-two {
  left: 55%;
  top: 22%;
  width: 20%;
  height: 24%;
}
.view-back.species-mushroom .spot-three {
  left: 73%;
  top: 59%;
}
.view-back.species-squirrel .squirrel-tail {
  left: 13%;
  top: 47%;
  width: 56%;
  height: 46%;
  z-index: 2;
  transform: rotate(8deg);
}
.view-back .pet-satchel {
  left: 25%;
  z-index: 3;
}
.view-back .bag-strap {
  top: 25%;
  transform: rotate(33deg);
}
.view-back .bag-body {
  left: auto;
  right: 0;
}
.view-back .bag-flap,
.view-back .bag-button {
  display: none;
}
.view-back.species-squirrel .pet-satchel {
  left: 33%;
}
.view-back .pet-scarf {
  z-index: 3;
}
.view-back .scarf-end {
  left: 43%;
  transform: rotate(9deg);
}
.view-back .pet-scarf::after {
  content: '';
  position: absolute;
  left: 37%;
  top: 31%;
  width: 25%;
  height: 68%;
  border-radius: 34%;
  background: #839e66;
}
.view-back .pet-flower {
  transform: rotate(-12deg);
}
.is-walking .avatar-bob {
  animation: pet-bob 0.38s ease-in-out infinite alternate;
}
.is-walking .foot-left {
  animation: pet-step-left 0.38s ease-in-out infinite alternate;
}
.is-walking .foot-right {
  animation: pet-step-right 0.38s ease-in-out infinite alternate;
}
.species-custom.is-walking .avatar-bob {
  animation-duration: 0.48s;
}
@keyframes pet-bob {
  to {
    transform: translateY(-1.2%);
  }
}
@keyframes pet-step-left {
  from {
    transform: rotate(-6deg) translateY(4%);
  }
  to {
    transform: rotate(6deg) translateY(-3%);
  }
}
@keyframes pet-step-right {
  from {
    transform: rotate(6deg) translateY(-3%);
  }
  to {
    transform: rotate(-6deg) translateY(4%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pet-avatar .pet-figure,
  .pet-avatar .avatar-bob,
  .pet-avatar .pet-foot,
  .pet-avatar .custom-sprite,
  .pet-avatar .pet-ornament {
    animation: none !important;
  }
}
</style>
