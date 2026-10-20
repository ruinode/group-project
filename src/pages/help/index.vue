<template>
  <FeedList
    type="help"
    title="技能求助"
    subtitle="说说需要哪种帮助，也分享一点你会的"
    show-filters
    :category-options="['摄影', '设计', '英语', 'Python', '吉他']"
    :status-options="statuses"
  />
</template>
<script setup>
import FeedList from '../../components/FeedList.vue'
const statuses = [
  { label: '全部状态', value: '' },
  { label: '求助中', value: 'open' },
  { label: '已完成', value: 'completed' },
  { label: '已关闭', value: 'closed' }
]
</script>
