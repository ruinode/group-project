<template>
  <view class="page">
    <DemoNotice />
    <view class="title">发布{{ contentNames[type] }}</view>
    <view class="panel">
      <text class="label">标题</text>
      <input
        class="input"
        v-model="form.title"
        maxlength="60"
        placeholder="把你的需求说清楚"
      />
      <text class="label">详细说明</text>
      <textarea
        class="input textarea"
        v-model="form.body"
        maxlength="2000"
        placeholder="补充要求、约定和注意事项"
      />
      <text class="label">类别 / 技能</text>
      <input
        class="input"
        v-model="form.category"
        placeholder="如电影、摄影、生活用品；失物填丢失或拾获"
      />
      <text class="label">地点</text>
      <input class="input" v-model="form.location" placeholder="具体地点" />
      <template v-if="type === 'plan'">
        <text class="label">活动日期（北京时间）</text>
        <picker mode="date" :value="date" @change="date = $event.detail.value">
          <view class="input">{{ date || '选择日期' }}</view>
        </picker>
        <text class="label">开始 / 结束时间</text>
        <view class="row">
          <picker
            mode="time"
            :value="startTime"
            @change="startTime = $event.detail.value"
          >
            <view class="input">{{ startTime }}</view>
          </picker>
          <picker
            mode="time"
            :value="endTime"
            @change="endTime = $event.detail.value"
          >
            <view class="input">{{ endTime }}</view>
          </picker>
        </view>
        <text class="label">总人数（含你自己）</text>
        <input class="input" v-model="capacity" type="number" />
      </template>
      <template v-if="type === 'market'">
        <text class="label">价格（元）</text>
        <input
          class="input"
          v-model="price"
          type="digit"
          placeholder="如 35.00"
        />
      </template>
      <text class="label">图片</text>
      <view class="actions">
        <image
          v-for="(image, index) in form.images"
          :key="index"
          :src="image"
          mode="aspectFill"
          class="thumb"
          @tap="removeImage(index)"
        />
        <button class="secondary" @tap="chooseImages">添加图片</button>
      </view>
      <view class="muted">
        演示图片只在本机预览；点图片移除。真实模式待接入公共上传服务。
      </view>
      <view v-if="error" class="error">{{ error }}</view>
      <view class="actions">
        <button class="primary" :disabled="saving" @tap="save">
          {{ saving ? '正在保存…' : '保存发布' }}
        </button>
      </view>
    </view>
  </view>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import DemoNotice from '../../components/DemoNotice.vue'
import * as api from '../../services/index.js'
import {
  contentNames,
  contentTypes,
  contentUrl,
  localToIso
} from '../../utils/routes.js'
import { config } from '../../config/index.js'
import { errorText } from '../../utils/errors.js'
const type = ref('plan'),
  form = reactive({
    title: '',
    body: '',
    category: '',
    location: '',
    images: []
  }),
  date = ref(''),
  startTime = ref('09:00'),
  endTime = ref('12:00'),
  capacity = ref('2'),
  price = ref(''),
  error = ref(''),
  saving = ref(false)
onLoad((options) => {
  if (contentTypes.includes(options.type)) type.value = options.type
  date.value = new Date(Date.now() + 86400000 + 8 * 3600000)
    .toISOString()
    .slice(0, 10)
})
function chooseImages() {
  if (config.apiMode !== 'mock') {
    error.value = '请由 B 接入 upload.create/confirm 和真实存储后启用上传'
    return
  }
  if (form.images.length >= 3) return
  uni.chooseImage({
    count: 3 - form.images.length,
    sizeType: ['compressed'],
    success: (r) => form.images.push(...r.tempFilePaths)
  })
}
function removeImage(index) {
  form.images.splice(index, 1)
}
async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''
  try {
    const params = { ...form, images: [...form.images] }
    if (!form.category.trim()) throw new Error('请填写类别或技能')
    if (['plan', 'help'].includes(type.value))
      params.category = form.category.trim()
    if (type.value === 'plan')
      Object.assign(params, {
        startAt: localToIso(date.value, startTime.value),
        endAt: localToIso(date.value, endTime.value),
        capacity: Number(capacity.value)
      })
    if (type.value === 'market') {
      if (!/^\d+(\.\d{1,2})?$/.test(price.value))
        throw new Error('请填写最多两位小数的非负价格')
      params.priceCents = Math.round(Number(price.value) * 100)
    }
    const service = api[type.value === 'lost_found' ? 'lostFound' : type.value]
    const item = await service.create(params)
    uni.redirectTo({ url: contentUrl(item.type, item.id) })
  } catch (e) {
    error.value = errorText(e)
  } finally {
    saving.value = false
  }
}
</script>
