<template>
  <view class="page" :class="{ 'feed-page-filtered': showFilters }">
    <DemoNotice />
    <view class="row">
      <view>
        <view class="title">{{ title }}</view>
        <view class="subtitle">{{ subtitle }}</view>
      </view>
      <button class="primary" @tap="publish">发布</button>
    </view>
    <view v-if="showFilters" class="content-switcher">
      <button
        class="content-tab"
        :class="{ selected: type === 'plan' }"
        :disabled="type === 'plan'"
        @tap="switchContent('plan')"
      >
        找搭子
      </button>
      <button
        class="content-tab"
        :class="{ selected: type === 'help' }"
        :disabled="type === 'help'"
        @tap="switchContent('help')"
      >
        技能求助
      </button>
    </view>
    <view class="panel">
      <input
        class="input"
        v-model="keyword"
        placeholder="搜索标题或说明"
        confirm-type="search"
        @confirm="load(true)"
      />
      <template v-if="showFilters">
        <view class="filter-shortcuts">
          <button
            class="filter-chip"
            :class="{ selected: !category }"
            @tap="chooseCategory('')"
          >
            全部{{ type === 'help' ? '技能' : '类别' }}
          </button>
          <button
            v-for="option in categoryOptions"
            :key="option"
            class="filter-chip"
            :class="{ selected: category === option }"
            @tap="chooseCategory(option)"
          >
            {{ option }}
          </button>
        </view>
        <view class="filter-fields">
          <view class="category-field">
            <text class="filter-label">
              {{ type === 'help' ? '所需技能' : '活动类别' }}
            </text>
            <input
              class="input"
              v-model="category"
              placeholder="也可输入完整类别"
              confirm-type="search"
              @confirm="load(true)"
            />
          </view>
          <view class="status-field">
            <text class="filter-label">发布状态</text>
            <picker
              :range="statusOptions"
              range-key="label"
              :value="statusIndex"
              @change="chooseStatus"
            >
              <view class="input status-value">
                {{ statusOptions[statusIndex]?.label || '全部状态' }}
                <text>⌄</text>
              </view>
            </picker>
          </view>
        </view>
      </template>
      <view class="actions">
        <button class="secondary" @tap="load(true)">搜索</button>
        <button class="secondary" @tap="clear">
          {{ showFilters ? '重置筛选' : '清空' }}
        </button>
        <button
          v-if="type === 'plan' && !showFilters"
          class="secondary"
          @tap="openHelp"
        >
          技能互助 →
        </button>
      </view>
    </view>
    <view v-if="showFilters && !loading && !error" class="filter-result">
      已加载 {{ items.length }} 条{{
        type === 'help' ? '技能求助' : '搭子计划'
      }}
    </view>
    <view v-if="error" class="error">{{ error }}</view>
    <view v-if="loading" class="muted">正在读取…</view>
    <ContentCard v-for="item in items" :key="item.id" :item="item" />
    <EmptyState
      v-if="!loading && !error && !items.length"
      :description="
        showFilters
          ? '换个类别、状态或关键词试试，也可以发布一条新内容。'
          : undefined
      "
    />
    <button
      v-if="cursor"
      class="secondary"
      :disabled="loading"
      @tap="load(false)"
    >
      加载更多
    </button>
  </view>
</template>
<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import * as api from '../services/index.js'
import { errorText } from '../utils/errors.js'
import DemoNotice from './DemoNotice.vue'
import ContentCard from './ContentCard.vue'
import EmptyState from './EmptyState.vue'
const props = defineProps({
  type: { required: true },
  title: { required: true },
  subtitle: { default: '' },
  showFilters: { type: Boolean, default: false },
  categoryOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] }
})
const items = ref([]),
  keyword = ref(''),
  error = ref(''),
  loading = ref(false),
  cursor = ref(null),
  category = ref(''),
  status = ref('')
const statusIndex = computed(() =>
  Math.max(
    0,
    props.statusOptions.findIndex((option) => option.value === status.value)
  )
)
let revision = 0
let appliedFilters = {}
const service = () =>
  api[props.type === 'lost_found' ? 'lostFound' : props.type]
async function load(reset) {
  if (!reset && loading.value) return
  const current = ++revision
  loading.value = true
  error.value = ''
  if (reset) {
    items.value = []
    cursor.value = null
    appliedFilters = {
      keyword: keyword.value.trim(),
      ...(props.showFilters
        ? { category: category.value.trim(), status: status.value }
        : {})
    }
  }
  try {
    const page = await service().list({
      ...appliedFilters,
      cursor: reset ? null : cursor.value
    })
    if (current !== revision) return
    items.value = reset ? page.items : [...items.value, ...page.items]
    cursor.value = page.nextCursor
  } catch (e) {
    if (current === revision) error.value = errorText(e)
  } finally {
    if (current === revision) loading.value = false
  }
}
function publish() {
  uni.navigateTo({ url: `/pages/content/publish?type=${props.type}` })
}
function clear() {
  keyword.value = ''
  category.value = ''
  status.value = ''
  load(true)
}
function chooseCategory(value) {
  category.value = value
  load(true)
}
function chooseStatus(event) {
  status.value = props.statusOptions[Number(event.detail.value)]?.value || ''
  load(true)
}
function switchContent(type) {
  uni.redirectTo({
    url: type === 'help' ? '/pages/help/index' : '/pages/partner/index'
  })
}
function openHelp() {
  uni.navigateTo({ url: '/pages/help/index' })
}
onShow(() => load(true))
onUnmounted(() => {
  revision++
})
</script>

<style scoped>
.content-switcher {
  display: flex;
  gap: 8rpx;
  padding: 6rpx;
  margin-top: 28rpx;
  background: #e8eddf;
  border-radius: 16rpx;
}
.content-switcher button {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  background: transparent;
  color: #65765f;
  font-size: 26rpx;
  line-height: 1.4;
}
.content-switcher button.selected {
  background: #fffef8;
  color: #304a3a;
  font-weight: 650;
}
.filter-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}
.filter-shortcuts button {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-size: 24rpx;
  padding: 8rpx 15rpx;
  background: #edf0e5;
  color: #52664f;
  border: 2rpx solid transparent;
  line-height: 1.4;
}
.content-tab::after,
.filter-chip::after {
  border: 0;
}
.feed-page-filtered .primary,
.feed-page-filtered .secondary {
  font-size: 26rpx;
  line-height: 1.5;
  border-radius: 12rpx;
}
.feed-page-filtered .primary::after,
.feed-page-filtered .secondary::after {
  border: 0;
}
.filter-shortcuts button.selected {
  background: #e2ecd7;
  border-color: #7a9b67;
  color: #304a3a;
}
.filter-fields {
  display: flex;
  gap: 16rpx;
  margin-top: 10rpx;
}
.category-field {
  flex: 1;
  min-width: 0;
}
.status-field {
  width: 38%;
  min-width: 0;
}
.filter-label {
  display: block;
  font-size: 23rpx;
  color: #65765f;
  padding: 16rpx 0 10rpx;
}
.feed-page-filtered .input {
  min-height: 44px;
}
.status-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4rpx;
  font-size: 25rpx;
}
.feed-page-filtered .actions button {
  flex: 1;
  min-height: 44px;
}
.filter-result {
  font-size: 24rpx;
  color: #65765f;
  margin: 16rpx 0;
}
</style>
