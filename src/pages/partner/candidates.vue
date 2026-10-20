<template>
  <view class="page">
    <DemoNotice />
    <view class="title">时间合拍的计划</view>
    <view class="subtitle">
      同一校区、同类活动、同一天且时间重叠。邀请后仍需对方确认。
    </view>
    <view v-if="sent.length" class="panel">
      <view>邀请已发出，等待对方确认。</view>
      <view class="muted">在消息中心查看接受、拒绝或取消后的状态。</view>
      <view class="actions">
        <button class="primary" @tap="openInvitations">查看邀请进度</button>
      </view>
    </view>
    <view v-if="error" class="error">{{ error }}</view>
    <view
      v-for="candidate in items"
      :key="candidate.candidatePlanId"
      class="panel"
    >
      <view class="section-title" style="margin-top: 0">
        {{ candidate.plan.title }}
      </view>
      <view class="link" @tap="openProfile(candidate.ownerId)">
        {{ candidate.owner.nickname }} ↗
      </view>
      <view class="muted">
        可共同安排：{{ formatTime(candidate.overlap.startAt) }} ～
        {{ formatTime(candidate.overlap.endAt) }}
      </view>
      <view class="actions">
        <text class="tag" v-for="reason in candidate.reasons" :key="reason">
          {{ reason }}
        </text>
      </view>
      <view class="actions">
        <button
          class="primary"
          :disabled="busy || sent.includes(candidate.candidatePlanId)"
          @tap="invite(candidate)"
        >
          {{
            sent.includes(candidate.candidatePlanId)
              ? '已邀请'
              : '邀请加入我的计划'
          }}
        </button>
        <button
          class="secondary"
          @tap="openContent('plan', candidate.candidatePlanId)"
        >
          查看详情
        </button>
      </view>
    </view>
    <EmptyState
      v-if="!loading && !items.length && !error"
      title="暂时没有合适计划"
      description="可以换个时间，或等待其他同学发布。"
    />
    <button v-if="cursor" class="secondary" @tap="load(false)">加载更多</button>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { plan, invitation } from '../../services/index.js'
import {
  openContent,
  openProfile,
  formatTime,
  idempotencyKey
} from '../../utils/routes.js'
import { errorText } from '../../utils/errors.js'
import DemoNotice from '../../components/DemoNotice.vue'
import EmptyState from '../../components/EmptyState.vue'
const planId = ref(''),
  items = ref([]),
  sent = ref([]),
  error = ref(''),
  busy = ref(false),
  loading = ref(false),
  cursor = ref(null)
function openInvitations() {
  uni.switchTab({ url: '/pages/messages/index' })
}
onLoad((options) => {
  planId.value = options.planId
  load(true)
})
async function load(reset) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const r = await plan.getCandidates({
      planId: planId.value,
      cursor: reset ? null : cursor.value
    })
    items.value = reset ? r.items : [...items.value, ...r.items]
    cursor.value = r.nextCursor
  } catch (e) {
    error.value = errorText(e)
  } finally {
    loading.value = false
  }
}
async function invite(candidate) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await invitation.create({
      sourcePlanId: candidate.candidatePlanId,
      targetPlanId: planId.value,
      idempotencyKey: idempotencyKey()
    })
    sent.value.push(candidate.candidatePlanId)
    uni.showToast({ title: '邀请已保存', icon: 'none' })
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
</script>
