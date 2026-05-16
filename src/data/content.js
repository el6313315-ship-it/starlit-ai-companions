export const agents = [
  {
    id: 'echo',
    name: '回声镜',
    icon: '回声镜',
    role: '沟通顾问',
    tagline: '话术优化/风险分析',
    description: '沟通前的表达顾问，帮你说得更稳妥、更安全',
    image: '/assets/screens/echo.jpg',
    avatar: '/assets/chat-avatar-echo.png',
    homeImage: '/assets/home/card-echo.png',
    tools: ['判断表达风险', '优化表达方式', '设计后续接法', '识别越界问题'],
    conversation: [
      { from: 'me', text: '我想和同事提意见，但怕她觉得我在挑刺' },
      { from: 'agent', text: '嗯，理解你的顾虑。直说容易让人防御，我们换个更温和又不失分寸的方式。' }
    ],
    prompts: ['更委婉的表达方式', '给出后续接法', '换个角度提建议'],
    reply: '可以先肯定对方目标，再把问题落在方案而不是人身上。'
  },
  {
    id: 'boss',
    name: '你的上司',
    icon: '你的上司',
    role: '任务推进',
    tagline: '任务复盘/职场建议',
    description: '帮你拆解任务、汇报、复盘、推进执行',
    image: '/assets/screens/boss.jpg',
    avatar: '/assets/chat-avatar-boss.png',
    homeImage: '/assets/home/card-boss.png',
    tools: ['任务拆解', '汇报优化', '今日打卡', '复盘反馈'],
    conversation: [
      { from: 'me', text: '市场方案复盘明天要交，我现在有点乱' },
      { from: 'agent', text: '别慌，先理清优先级。我们一步一步来，今晚也能稳住节奏。' }
    ],
    prompts: ['帮我拆任务', '润色汇报开头', '给我一个今晚计划'],
    reply: '先列目标、数据、问题、下一步四块，今晚只完成可交付骨架。'
  },
  {
    id: 'evening',
    name: '晚星伴',
    icon: '晚星伴',
    role: '晚安治愈',
    tagline: '共情陪伴/晚安治愈',
    description: '共情陪伴，给你温柔的晚安治愈',
    image: '/assets/screens/evening.jpg',
    avatar: '/assets/chat-avatar-evening.png',
    homeImage: '/assets/home/card-evening.png',
    tools: ['共情陪伴', '晚安治愈', '图片共情', '温柔提醒'],
    conversation: [
      { from: 'me', text: '今天好累，看到这张照片突然有点想哭' },
      { from: 'agent', text: '这张照片好温柔呢。累了想哭，是因为你已经很努力地撑住了很久。' }
    ],
    prompts: ['继续说说', '我想被安慰', '陪我做个晚安仪式'],
    reply: '先把肩膀放下来，今晚不急着证明什么，只把自己照顾好。'
  },
  {
    id: 'clarity',
    name: '人间清醒',
    icon: '人间清醒',
    role: '关系分析',
    tagline: '点醒内耗/关系分析',
    description: '清醒犀利，但有边界的关系分析，帮你减少内耗',
    image: '/assets/screens/clarity.jpg',
    avatar: '/assets/chat-avatar-clarity.png',
    homeImage: '/assets/home/card-clarity.png',
    tools: ['点破内耗', '关系照妖镜', '回怼文案', '清醒动作'],
    conversation: [
      { from: 'me', text: '他总是忽冷忽热，我是不是太敏感了？' },
      { from: 'agent', text: '先说结论：你不是敏感，他的行为确实不稳定。别再自我归因。' }
    ],
    prompts: ['继续拆解', '给我一句回怼', '下一步怎么做'],
    reply: '看行动的一致性，不要只看情绪高峰时的承诺。'
  }
];

export const quickFinds = [
  { title: '每日一句', text: '温柔的话，陪你前行', icon: '魔法', image: '/assets/home/find-quote.png' },
  { title: '灵感提示', text: 'AI为你点亮思路', icon: '灯泡', image: '/assets/home/find-idea-figma.png' },
  { title: '最近对话', text: '继续未完的故事', icon: '消息', image: '/assets/home/find-chat-figma.png' }
];

export const messages = [
  { id: 1, agentId: 'evening', title: '晚星伴', type: '智能体消息', text: '今天辛苦啦，记得好好对自己说一句晚安', time: '21:35', badge: 2, badgeTone: 'purple', icon: '月亮', color: '#8b5cf6' },
  { id: 2, agentId: 'boss', title: '你的上司', type: '智能体消息', text: '关于「市场方案复盘」的任务提醒，请查看...', time: '20:12', badge: 1, badgeTone: 'purple', color: '#6d5cf6' },
  { id: 3, agentId: 'echo', title: '回声镜', type: '智能体消息', text: '我为你优化了一段表达，试试看会不会更好~', time: '19:48', color: '#9c6dff' },
  { id: 4, title: '今日状态小测已生成报告', type: '系统通知', text: '你的情绪状态良好，压力中等，继续保持哦!', time: '19:20', icon: '任务', indicator: true, color: '#7c3aed' },
  { id: 5, title: '星芒值+20', type: '系统通知', text: '你通过每日小测获得了20点星芒值', time: '18:05', icon: '星', color: '#a78bfa' },
  { id: 6, title: '有人点赞了你的动态', type: '社交通知', text: '「星辰与你」赞了你的动态', time: '17:32', badge: 3, badgeTone: 'red', icon: '晚星伴', color: '#ef6f92' },
  { id: 7, title: '新评论', type: '社交通知', text: '「星辰与你」评论了你的动态：说得太好了!', time: '16:18', badge: 1, badgeTone: 'red', icon: '消息', color: '#8b5cf6' }
];

export const profileRows = {
  user: [
    { icon: '我的', label: '头像昵称', value: '林初' },
    { icon: '星', label: '性别设置', value: '女' },
    { icon: '复制', label: '身份描述', value: '未完善，去编辑' }
  ]
};
