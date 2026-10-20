<template>
  <view class="page">
    <DemoNotice />
    <view v-if="error" class="error">{{ error }}</view>
    <view v-if="item" class="panel">
      <text class="tag">{{ contentNames[type] }} · {{ item.status }}</text>
      <view class="title" style="margin-top: 20rpx">{{ item.title }}</view>
      <view
        class="link"
        style="margin-top: 18rpx"
        @tap="openProfile(item.ownerId)"
      >
        {{ item.owner?.nickname }} 的主页 ↗
      </view>
      <view class="muted">{{ item.location }} · {{ item.campusName }}</view>
      <view v-if="type === 'plan'" class="muted">
        {{ formatTime(item.startAt) }} ～ {{ formatTime(item.endAt) }} ·
        {{ item.memberIds.length }}/{{ item.capacity }} 人
      </view>
      <view v-if="type === 'market'" class="section-title">
        <template v-if="item.marketType === 'buy'">
          预算 ¥{{ (item.budgetCents / 100).toFixed(2) }}
        </template>
        <template v-else>¥{{ (item.priceCents / 100).toFixed(2) }}</template>
      </view>
      <view v-if="type === 'market'" class="muted">
        <template v-if="item.marketType === 'sell'">
          成色：{{ item.condition }} · 交接：{{ item.handoverCampus }}
        </template>
        <template v-else>关键词：{{ item.keywords }}</template>
      </view>
      <view v-if="type === 'market'" class="muted">
        参考估价后续提供
      </view>
      <view class="body" style="margin-top: 26rpx">{{ item.body }}</view>
      <view class="actions">
        <image
          v-for="(image, index) in item.images"
          :key="index"
          :src="image"
          mode="aspectFill"
          class="thumb"
          @tap="preview(image)"
        />
      </view>
      <view class="actions">
        <button v-if="!isOwn" class="primary" :disabled="busy" @tap="contact">
          联系发布者
        </button>
        <button
          v-if="isOwn && type === 'plan' && item.status === 'open'"
          class="primary"
          @tap="candidates"
        >
          查看相近计划
        </button>
        <button
          v-if="!isOwn && type === 'market' && item.status === 'active'"
          class="primary"
          :disabled="busy"
          @tap="reserve"
        >
          预约交接
        </button>
        <button class="secondary" :disabled="busy" @tap="toggleFavorite">
          {{ selected ? '取消收藏' : '收藏' }}
        </button>
        <button class="secondary" :disabled="busy" @tap="report">举报</button>
        <button
          v-if="isOwn && type === 'market' && item.status === 'active'"
          class="primary"
          :disabled="busy"
          @tap="complete"
        >
          标记交易完成
        </button>
        <button
          v-if="isOwn && ['open', 'active', 'full'].includes(item.status)"
          class="secondary"
          :disabled="busy"
          @tap="finish"
        >
          {{
            type === 'lost_found'
              ? '确认已归还'
              : type === 'market'
                ? '下架'
                : '标记完成'
          }}
        </button>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import DemoNotice from '../../components/DemoNotice.vue'
import * as api from '../../services/index.js'
import { session } from '../../utils/session.js'
import {
  contentTypes,
  contentNames,
  openProfile,
  formatTime
} from '../../utils/routes.js'
import { errorText } from '../../utils/errors.js'
const type = ref('plan'),
  id = ref(''),
  item = ref(null),
  error = ref(''),
  busy = ref(false),
  selected = ref(false)
const isOwn = computed(() => item.value?.ownerId === session.user?.id)
const service = () =>
  api[type.value === 'lost_found' ? 'lostFound' : type.value]
onLoad((options) => {
  if (contentTypes.includes(options.type)) type.value = options.type
  id.value = options.id || ''
})
async function load() {
  error.value = ''
  try {
    item.value = await service().get({ id: id.value })
    selected.value = false
    let cursor = null
    do {
      const favorites = await api.favorite.list({ pageSize: 50, cursor })
      selected.value = favorites.items.some(
        (f) => f.contentType === type.value && f.contentId === id.value
      )
      cursor = favorites.nextCursor
    } while (cursor && !selected.value)
  } catch (e) {
    error.value = errorText(e)
  }
}
onShow(load)
async function run(fn) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await fn()
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
function contact() {
  run(async () => {
    const c = await api.conversation.open({
      contentType: type.value,
      contentId: id.value,
      peerUserId: item.value.ownerId
    })
    uni.navigateTo({
      url: `/pages/messages/chat?id=${encodeURIComponent(c.id)}`
    })
  })
}
function candidates() {
  uni.navigateTo({
    url: `/pages/partner/candidates?planId=${encodeURIComponent(id.value)}`
  })
}
function reserve() {
  run(async () => {
    await api.market.reserve({ id: id.value })
    uni.showToast({ title: '已提交预约', icon: 'success' })
    load()
  })
}
function complete() {
  uni.showModal({
    title: '确认交易完成',
    content: '确认标记该商品已交易完成？完成后不可再预约或修改。',
    success: (r) => {
      if (r.confirm)
        run(async () => {
          item.value = await api.market.complete({ id: id.value })
        })
    }
  })
}
function toggleFavorite() {
  run(async () => {
    const r = await api.favorite.set({
      contentType: type.value,
      contentId: id.value,
      selected: !selected.value
    })
    selected.value = r.selected
  })
}
function report() {
  uni.showModal({
    title: '举报原因',
    editable: true,
    placeholderText: '请填写具体原因',
    success: (r) => {
      if (r.confirm)
        run(async () => {
          await api.report.create({
            contentType: type.value,
            contentId: id.value,
            reason: r.content || ''
          })
          uni.showToast({ title: '已保存举报', icon: 'none' })
        })
    }
  })
}
function finish() {
  uni.showModal({
    title: '确认操作',
    content: '确认更新这条内容的状态吗？',
    success: (r) => {
      if (r.confirm)
        run(async () => {
          const action =
            type.value === 'lost_found'
              ? 'markReturned'
              : type.value === 'market'
                ? 'close'
                : 'complete'
          item.value = await service()[action]({ id: id.value })
        })
    }
  })
}
function preview(image) {
  uni.previewImage({ current: image, urls: item.value.images })
}
</script>
