<template>
  <view
    class="pet-ornament"
    :class="['ornament-' + id, 'species-' + species, 'view-' + view]"
    aria-hidden="true"
  >
    <view v-if="id === 'lily-pad'" class="ornament-art lily-pad">
      <view class="lily-surface"></view>
      <view class="lily-vein"></view>
      <view class="lily-dew"></view>
    </view>
    <view v-else-if="id === 'reed-bow'" class="ornament-art reed-bow">
      <view class="reed-loop loop-left"></view>
      <view class="reed-loop loop-right"></view>
      <view class="reed-end"></view>
      <view class="reed-knot"></view>
    </view>
    <view v-else-if="id === 'bubble-star'" class="ornament-art bubble-star">
      <view class="bubble-surface"></view>
      <view class="bubble-glint"></view>
      <view class="bubble-spark"></view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  species: { type: String, default: 'rabbit' },
  view: { type: String, default: 'front' }
})
</script>

<style scoped>
.pet-ornament {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.ornament-art {
  position: absolute;
}
.lily-pad {
  left: 44%;
  top: 27%;
  width: 28%;
  height: 11%;
  border-radius: 50%;
  background: #5b7049;
  transform: rotate(-12deg);
}
.lily-surface {
  position: absolute;
  inset: 9% 4% 13%;
  background: #a9c17b;
  border-radius: inherit;
}
.lily-vein {
  position: absolute;
  left: 46%;
  top: 41%;
  width: 48%;
  height: 10%;
  background: #6f8a54;
  transform: rotate(20deg);
  transform-origin: 0 50%;
}
.lily-dew {
  position: absolute;
  left: 21%;
  top: 20%;
  width: 13%;
  height: 20%;
  background: #f4f6cf;
  border-radius: 50%;
}
.species-mushroom .lily-pad {
  top: 9%;
  left: 43%;
}
.species-capybara .lily-pad {
  top: 20%;
  left: 41%;
}
.species-squirrel .lily-pad {
  top: 25%;
  left: 48%;
}
.species-custom .lily-pad {
  top: 1%;
  left: 55%;
  width: 25%;
}
.reed-bow {
  left: 70%;
  top: 27%;
  width: 25%;
  height: 15%;
  transform: rotate(17deg);
}
.reed-loop {
  position: absolute;
  top: 8%;
  width: 49%;
  height: 68%;
  border-radius: 60% 18% 58% 18%;
  background: #70874f;
}
.reed-loop::after {
  content: '';
  position: absolute;
  inset: 12%;
  border-radius: inherit;
  background: #c3ce8a;
}
.loop-left {
  left: 0;
  transform: rotate(-26deg);
}
.loop-right {
  right: 0;
  transform: rotate(76deg);
}
.reed-knot {
  position: absolute;
  left: 40%;
  top: 30%;
  width: 21%;
  height: 39%;
  border-radius: 25%;
  background: #9caa63;
}
.reed-end {
  position: absolute;
  left: 49%;
  top: 52%;
  width: 24%;
  height: 43%;
  border-radius: 10% 10% 40% 10%;
  background: #a9ba75;
  transform: rotate(-12deg);
}
.species-mushroom .reed-bow {
  top: 25%;
  left: 70%;
}
.species-capybara .reed-bow {
  top: 22%;
  left: 69%;
}
.species-squirrel .reed-bow {
  top: 25%;
  left: 70%;
}
.species-custom .reed-bow {
  top: 5%;
  left: 70%;
  width: 23%;
}
.bubble-star {
  left: 56%;
  top: 77%;
  width: 18%;
  height: 16%;
  border-radius: 50%;
  background: #789d9e;
}
.bubble-surface {
  position: absolute;
  inset: 6%;
  border-radius: inherit;
  background: #c7e1d8;
}
.bubble-glint {
  position: absolute;
  left: 17%;
  top: 17%;
  width: 26%;
  height: 14%;
  border-radius: 50%;
  background: #fffbe7;
  transform: rotate(-35deg);
}
.bubble-spark {
  position: absolute;
  left: 42%;
  top: 31%;
  width: 20%;
  height: 45%;
  border-radius: 45%;
  background: #fff2ae;
  transform: rotate(15deg);
}
.bubble-spark::after {
  content: '';
  position: absolute;
  left: -75%;
  top: 28%;
  width: 250%;
  height: 44%;
  border-radius: 45%;
  background: #fff2ae;
}
.species-mushroom .bubble-star {
  top: 80%;
  left: 52%;
  width: 16%;
  height: 14%;
}
.species-squirrel .bubble-star {
  left: 62%;
}
.species-custom .bubble-star {
  left: 69%;
  top: 72%;
}
.view-back .bubble-star {
  display: none;
}
.view-back .lily-pad {
  transform: rotate(10deg);
}
.view-back .reed-bow {
  transform: rotate(-12deg);
}
</style>
