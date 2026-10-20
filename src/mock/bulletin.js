// 以下校园活动全部虚构，只展示公告流程；不代表真实活动或真实报名。
const activityTemplates = [
  {
    id: 'demo_activity_photo',
    title: '校园影像散步',
    body: '沿树荫步道收集傍晚的光，和喜欢摄影的同学一起，给校园留一张秋日照片。',
    day: 1,
    start: '17:00',
    end: '18:00',
    location: '示例校区 · 中心广场',
    organizer: '虚构摄影兴趣小组',
    participation:
      '演示参与方式：带上手机或相机，在集合点碰面。本页不开放真实报名。'
  },
  {
    id: 'demo_activity_books',
    title: '旧书交换小集',
    body: '带一本喜欢的旧书，讲讲书里的故事，再把它交给下一位读者。',
    day: 2,
    start: '12:00',
    end: '14:00',
    location: '示例校区 · 图书馆前步道',
    organizer: '虚构阅读社',
    participation:
      '演示参与方式：准备一本想分享的旧书，到小集交换阅读感受。本页不开放真实报名。'
  },
  {
    id: 'demo_activity_music',
    title: '草坪音乐小聚',
    body: '在夕阳下听几首歌，认识喜欢音乐的小伙伴。欢迎带乐器，也欢迎安静地当听众。',
    day: 3,
    start: '17:30',
    end: '19:00',
    location: '示例校区 · 北侧草坪',
    organizer: '虚构音乐兴趣小组',
    participation:
      '演示参与方式：可带乐器，或作为听众在草坪相聚。本页不开放真实报名。'
  }
]

export function listDemoBulletins(now = new Date()) {
  const timestamp = now.getTime()
  const beijingOffset = 8 * 60 * 60 * 1000
  return activityTemplates
    .map((activity) => {
      const day = new Date(timestamp + beijingOffset + activity.day * 86400000)
        .toISOString()
        .slice(0, 10)
      return {
        id: activity.id,
        title: activity.title,
        body: activity.body,
        createdAt: now.toISOString(),
        demo: true,
        kind: 'campus-activity',
        startAt: `${day}T${activity.start}:00+08:00`,
        endAt: `${day}T${activity.end}:00+08:00`,
        location: activity.location,
        organizer: activity.organizer,
        participation: activity.participation
      }
    })
    .filter((activity) => Date.parse(activity.endAt) > timestamp)
}

// 兼容旧调用；实时列表使用 listDemoBulletins，避免固定在构建或启动日期。
export const demoBulletins = listDemoBulletins()
