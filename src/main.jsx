import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Copy,
  Crown,
  Heart,
  Home,
  Image as ImageIcon,
  Lightbulb,
  Menu,
  MessageCircle,
  Mic,
  Moon,
  MoreHorizontal,
  PenLine,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Volume2,
  WandSparkles,
  X,
  Zap
} from 'lucide-react';
import { agents, messages, profileRows, quickFinds } from './data/content.js';
import './styles.css';

const iconMap = {
  首页: Home,
  消息: MessageCircle,
  我的: User,
  回声镜: ShieldCheck,
  你的上司: ClipboardCheck,
  晚星伴: Heart,
  人间清醒: Zap,
  情绪: Sparkles,
  压力: Zap,
  任务: ClipboardCheck,
  灯泡: Lightbulb,
  图片: ImageIcon,
  笔: PenLine,
  搜索: Search,
  星: Star,
  月亮: Moon,
  皇冠: Crown,
  设置: Settings,
  音量: Volume2,
  复制: Copy,
  魔法: WandSparkles,
  更多: MoreHorizontal,
  返回: ArrowLeft,
  发送: Send,
  麦克风: Mic,
  菜单: Menu,
  关闭: X
};

function getHashView() {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  return raw || 'home';
}

function Icon({ name, size = 22, strokeWidth = 2 }) {
  const Component = iconMap[name] || Sparkles;
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

function App() {
  const [view, setView] = useState(getHashView);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState('全部');
  const [voiceOn, setVoiceOn] = useState(true);
  const [chatDraft, setChatDraft] = useState('');

  useEffect(() => {
    const onHash = () => setView(getHashView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const knownViews = ['home', 'messages', 'profile', 'status-test'];
  const currentAgent = agents.find((agent) => agent.id === view);
  const currentMessage = view.startsWith('message-')
    ? messages.find((item) => `message-${item.id}` === view)
    : null;
  const currentPlaceholder = view.startsWith('placeholder-')
    ? decodeURIComponent(view.replace('placeholder-', ''))
    : null;
  const isKnownView = knownViews.includes(view) || currentAgent || currentMessage || currentPlaceholder;
  const activeView = isKnownView ? view : 'home';

  const navigate = (next) => {
    window.location.hash = next === 'home' ? '' : next;
    setView(next);
    setMenuOpen(false);
  };

  const notify = (text) => setToast(text);

  return (
    <div className="workspace">
      <aside className={`desktop-nav ${menuOpen ? 'is-open' : ''}`} aria-label="项目导航">
        <div className="brand">
          <span className="brand-mark"><Icon name="星" size={18} /></span>
          <div>
            <strong>星夜智能体</strong>
            <small>统一前端项目</small>
          </div>
        </div>
        <NavButton id="home" active={activeView === 'home'} onClick={navigate} icon="首页" label="首页" />
        <NavButton id="messages" active={activeView === 'messages'} onClick={navigate} icon="消息" label="消息" />
        <NavButton id="profile" active={activeView === 'profile'} onClick={navigate} icon="我的" label="我的" />
        <div className="nav-group-label">智能体入口</div>
        {agents.map((agent) => (
          <NavButton key={agent.id} id={agent.id} active={activeView === agent.id} onClick={navigate} icon={agent.icon} label={agent.name} />
        ))}
      </aside>

      <main className="stage" aria-live="polite">
        <button className="mobile-menu" type="button" aria-label="展开菜单" onClick={() => setMenuOpen(true)}>
          <Icon name="菜单" />
        </button>
        <PhoneFrame>
          {activeView === 'home' && <HomePage navigate={navigate} notify={notify} />}
          {activeView === 'messages' && <MessagesPage navigate={navigate} filter={filter} setFilter={setFilter} />}
          {activeView === 'profile' && <ProfilePage voiceOn={voiceOn} setVoiceOn={setVoiceOn} navigate={navigate} notify={notify} />}
          {activeView === 'status-test' && <StatusTestPage navigate={navigate} notify={notify} />}
          {currentMessage && <MessageDetailPage message={currentMessage} navigate={navigate} />}
          {currentPlaceholder && <PlaceholderPage title={currentPlaceholder} navigate={navigate} />}
          {currentAgent && (
            <ChatPage
              agent={currentAgent}
              draft={chatDraft}
              setDraft={setChatDraft}
              navigate={navigate}
              notify={notify}
            />
          )}
          {!currentAgent && !currentMessage && !currentPlaceholder && activeView !== 'status-test' && <BottomTabs active={activeView} navigate={navigate} />}
        </PhoneFrame>
      </main>

      <button className="menu-scrim" type="button" aria-label="关闭菜单" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function NavButton({ id, active, onClick, icon, label }) {
  return (
    <button className={`nav-button ${active ? 'is-active' : ''}`} type="button" onClick={() => onClick(id)}>
      <Icon name={icon} size={19} />
      <span>{label}</span>
    </button>
  );
}

function PhoneFrame({ children }) {
  return (
    <section className="phone-shell" aria-label="移动端应用预览">
      {children}
    </section>
  );
}

function HomePage({ navigate, notify }) {
  return (
    <div className="screen home-screen">
      <section className="hero">
        <div>
          <h1>首页</h1>
          <p>今天想和谁聊聊？ <span aria-hidden="true">👋</span></p>
        </div>
      </section>

      <Panel title="智能体入口" sparkle>
        <div className="agent-grid">
          {agents.map((agent) => (
            <button key={agent.id} className="agent-card" type="button" onClick={() => navigate(agent.id)}>
              <img src={agent.homeImage || agent.image} alt="" />
              <span className="agent-card-overlay" />
              <strong>{agent.name}</strong>
              <small>{agent.tagline}</small>
              <span className="pill-button">去对话 <ArrowRight size={14} /></span>
            </button>
          ))}
        </div>
      </Panel>

      <section className="check-card">
        <div>
          <h2>今日状态小测</h2>
          <p>30 秒了解你的情绪、压力和任务状态 ✨</p>
          <div className="mini-tags">
            <span><Icon name="情绪" size={17} />情绪</span>
            <span><Icon name="压力" size={17} />压力</span>
            <span><Icon name="任务" size={17} />任务</span>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate('status-test')}>
          开始测评 <ArrowRight size={18} />
        </button>
      </section>

      <Panel title="发现与推荐" sparkle>
        <div className="quick-grid">
          {quickFinds.map((item) => (
            <button className="quick-card" type="button" key={item.title} onClick={() => navigate(`placeholder-${encodeURIComponent(item.title)}`)} style={{ '--quick-image': `url(${item.image})` }}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
              {item.deco && <img className={`quick-deco ${item.decoClass}`} src={item.deco} alt="" />}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MessagesPage({ navigate, filter, setFilter }) {
  const tabs = ['全部', '智能体消息', '系统通知', '社交通知'];
  const visible = messages.filter((item) => filter === '全部' || item.type === filter);

  return (
    <div className="screen messages-screen">
      <PageHeader title="消息" />
      <div className="segmented" role="tablist" aria-label="消息分类">
        {tabs.map((tab) => (
          <button key={tab} className={filter === tab ? 'is-active' : ''} type="button" onClick={() => setFilter(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="message-list">
          {visible.map((item) => (
            <button key={item.id} className="message-row" type="button" onClick={() => navigate(item.agentId || `message-${item.id}`)}>
              <span className="message-icon" style={{ '--accent': item.color }}>
                {item.agentId ? <img src={agents.find((agent) => agent.id === item.agentId)?.homeImage || agents.find((agent) => agent.id === item.agentId)?.image} alt="" /> : <Icon name={item.icon} />}
              </span>
              <span className="message-copy">
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.type}</em>
                </span>
                <small>{getMessagePreview(item)}</small>
              </span>
              <span className="message-meta">
                <time>{item.time}</time>
                {item.indicator && <i aria-hidden="true" />}
                {item.badge && <b className={item.badgeTone === 'red' ? 'is-red' : ''}>{item.badge}</b>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="暂无消息" text="切换到其他分类看看。" />
      )}
    </div>
  );
}

function getMessagePreview(item) {
  if (!item.agentId) return item.text;
  const agent = agents.find((entry) => entry.id === item.agentId);
  return agent?.conversation?.at(-1)?.text || item.text;
}

function MessageDetailPage({ message, navigate }) {
  return (
    <div className="screen message-detail-screen">
      <div className="message-detail-top">
        <button className="round-button" type="button" onClick={() => navigate('messages')} aria-label="返回"><Icon name="返回" /></button>
        <span>{message.time}</span>
      </div>
      <section className="message-detail-card">
        <span className="message-icon" style={{ '--accent': message.color }}>
          <Icon name={message.icon} />
        </span>
        <div>
          <strong>{message.title}</strong>
          <em>{message.type}</em>
        </div>
        <p>{getMessagePreview(message)}</p>
      </section>
    </div>
  );
}

function ProfilePage({ voiceOn, setVoiceOn, navigate, notify }) {
  return (
    <div className="screen profile-screen">
      <PageHeader title="我的" action={<button className="round-button" type="button" onClick={() => navigate(`placeholder-${encodeURIComponent('设置')}`)}><Icon name="设置" /></button>} />
      <section className="profile-card">
        <div className="avatar large-avatar" style={{ backgroundImage: 'url(/assets/profile-avatar.png)' }} />
        <div>
          <h2>林初 <span><Icon name="星" size={14} /></span></h2>
          <p>ID:1002435 <Icon name="复制" size={16} /></p>
          <small>我是谁：偏感性、希望被温柔接住，也想高效完成任务</small>
        </div>
      </section>

      <SettingsPanel title="用户信息" rows={profileRows.user} navigate={navigate} />
      <section className="settings-panel">
        <h3>设置</h3>
        <ProfileRow icon="设置" label="对话偏好" value="温柔治愈风" onClick={() => navigate(`placeholder-${encodeURIComponent('对话偏好')}`)} />
        <ProfileRow icon="图片" label="聊天背景" value="星空梦境" onClick={() => navigate(`placeholder-${encodeURIComponent('聊天背景')}`)} />
        <div className="profile-row">
          <span><Icon name="音量" />语音播放</span>
          <button className={`switch ${voiceOn ? 'is-on' : ''}`} type="button" aria-pressed={voiceOn} onClick={() => setVoiceOn(!voiceOn)}>
            <i />
          </button>
        </div>
        <ProfileRow icon="消息" label="消息漫游" value="30天" onClick={() => navigate(`placeholder-${encodeURIComponent('消息漫游')}`)} />
      </section>
      <section className="reward-card">
        <h3>奖励/会员</h3>
        <div className="reward-panel">
          <img src="/assets/profile-reward-star.png" alt="" />
          <div>
            <span>星芒值</span>
            <strong>1280</strong>
            <small>持续探索，解锁更多可能</small>
          </div>
          <div>
            <span>已解锁灵感剧情</span>
            <strong>6</strong>
          </div>
        </div>
        <button className="member-button" type="button" onClick={() => navigate(`placeholder-${encodeURIComponent('会员特权')}`)}>
          <Icon name="皇冠" size={19} /> 查看会员特权 <ArrowRight size={20} />
        </button>
      </section>
    </div>
  );
}

function ChatPage({ agent, draft, setDraft, navigate, notify }) {
  const [activeTool, setActiveTool] = useState(agent.tools[0]);
  const [localMessages, setLocalMessages] = useState(agent.conversation);
  const [isSending, setIsSending] = useState(false);
  const chatLogRef = useRef(null);
  const isBossFigmaPage = agent.id === 'boss';
  const isEchoFigmaPage = agent.id === 'echo';
  const isEveningFigmaPage = agent.id === 'evening';
  const isClarityFigmaPage = agent.id === 'clarity';
  const isFigmaInteractivePage = isBossFigmaPage || isEchoFigmaPage || isEveningFigmaPage || isClarityFigmaPage;
  const figmaChatClass = isBossFigmaPage ? 'figma-boss-chat' : isEchoFigmaPage ? 'figma-echo-chat' : isEveningFigmaPage ? 'figma-evening-chat' : isClarityFigmaPage ? 'figma-clarity-chat' : '';
  const shouldRenderFullFlow = isFigmaInteractivePage && localMessages.length > agent.conversation.length;
  const visibleMessages = localMessages;

  useEffect(() => {
    setActiveTool(agent.tools[0]);
    setLocalMessages(agent.conversation);
    setIsSending(false);
    setDraft('');
  }, [agent.id, agent.conversation, agent.tools, setDraft]);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [visibleMessages.length]);

  const handleSendMessage = async (message = draft) => {
    if (isSending) return;

    const text = message.trim();
    if (text.length < 2) {
      notify('请输入至少 2 个字再发送');
      return;
    }

    const loadingId = `loading-${Date.now()}`;
    setLocalMessages((items) => [
      ...items,
      { from: 'me', text },
      { from: 'agent', id: loadingId, text: `${agent.name}正在思考...` }
    ]);
    setDraft('');
    setIsSending(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/coze/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: agent.id,
          message: text
        })
      });
      const result = await response.json();
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(result.error || '扣子接口调用失败');
      }

      if (!result.reply) {
        throw new Error('智能体暂时没有返回可展示的回复');
      }

      setLocalMessages((items) =>
        items.map((item) => item.id === loadingId ? { from: 'agent', text: result.reply } : item)
      );
      notify('扣子回复已生成');
    } catch (error) {
      const message = error.name === 'AbortError'
        ? '智能体响应超时，请稍后重试。'
        : error.message === 'Failed to fetch'
          ? '网络连接失败，可能是本地 API 服务未启动、预览服务未重启，或线上函数连接中断。'
          : error.message;
      setLocalMessages((items) =>
        items.map((item) =>
          item.id === loadingId
            ? { from: 'agent', text: agent.reply || `暂时没有连上智能体：${message}` }
            : item
        )
      );
      notify('扣子接口调用失败');
    } finally {
      window.clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  return (
    <div className={`screen chat-screen ${figmaChatClass} ${shouldRenderFullFlow ? 'figma-flow-active' : ''}`}>
      <section className="chat-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(7,6,22,.2), #080719 86%), url(${agent.image})` }}>
        <div className="top-actions">
          <button className="round-button" type="button" onClick={() => navigate('home')} aria-label="返回"><Icon name="返回" /></button>
          <button className="round-button" type="button" onClick={() => notify('更多操作已打开')} aria-label="更多"><Icon name="更多" /></button>
        </div>
        <div className="agent-title">
          <span className="avatar" style={{ backgroundImage: `url(${agent.image})` }} />
          <div>
            <h1>{agent.name} <em>{agent.role}</em></h1>
            <p>{agent.description}</p>
          </div>
        </div>
      </section>

      <div className="tool-strip">
        {agent.tools.map((tool) => (
          <button key={tool} className={activeTool === tool ? 'is-active' : ''} type="button" onClick={() => setActiveTool(tool)}>
            <Icon name={agent.icon} size={22} />
            <span>{tool}</span>
          </button>
        ))}
      </div>

      <div className="chat-log" ref={chatLogRef}>
        {visibleMessages.map((item, index) => (
          <div key={`${item.from}-${index}`} className={`bubble-line ${item.from === 'me' ? 'mine' : 'theirs'}`}>
            {item.from === 'agent' && <span className="tiny-avatar" style={{ backgroundImage: `url(${agent.avatar || agent.image})` }} />}
            <p>{item.text}</p>
          </div>
        ))}
      </div>

      <div className="composer-area">
        <div className="suggestions">
          {agent.prompts.map((prompt) => (
            <button key={prompt} type="button" disabled={isSending} onClick={() => handleSendMessage(prompt)}>{prompt}</button>
          ))}
        </div>
        <form className="composer" onSubmit={(event) => { event.preventDefault(); handleSendMessage(); }}>
          <button type="button" className="mic" onClick={() => notify('语音输入功能稍后接入。')}><Icon name="麦克风" /></button>
          <div className="message-field">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={isSending} placeholder={`发送消息给${agent.name}`} aria-label={`发送消息给${agent.name}`} />
            <button className="send" type="submit" disabled={isSending} aria-label="发送"><Icon name="发送" /></button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BottomTabs({ active, navigate }) {
  const tabs = [
    ['home', '首页', '首页'],
    ['messages', '消息', '消息'],
    ['profile', '我的', '我的']
  ];
  return (
    <nav className="bottom-tabs" aria-label="底部导航">
      {tabs.map(([id, label, icon]) => (
        <button key={id} className={active === id ? 'is-active' : ''} type="button" onClick={() => navigate(id)}>
          <Icon name={icon} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function PageHeader({ title, action }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {action}
    </header>
  );
}

function Panel({ title, children, sparkle = false }) {
  return (
    <section className="panel">
      <h2>{title} {sparkle && <Sparkles size={15} aria-hidden="true" />}</h2>
      {children}
    </section>
  );
}

function SettingsPanel({ title, rows, navigate }) {
  return (
    <section className="settings-panel">
      <h3>{title}</h3>
      {rows.map((row) => <ProfileRow key={row.label} {...row} onClick={() => navigate(`placeholder-${encodeURIComponent(row.label)}`)} />)}
    </section>
  );
}

function ProfileRow({ icon, label, value, onClick }) {
  return (
    <button className="profile-row" type="button" onClick={onClick}>
      <span><Icon name={icon} />{label}</span>
      <em>{value}<ArrowRight size={18} /></em>
    </button>
  );
}

function EmptyState({ title, text }) {
  return (
    <section className="empty-state">
      <Icon name="消息" size={42} />
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

const moodOptions = ['开心', '平静', '焦虑', '疲惫', '烦躁', '迷茫'];
const statusTabs = [
  { key: 'mood', label: '情绪', icon: '情绪' },
  { key: 'stress', label: '压力', icon: '压力' },
  { key: 'task', label: '任务', icon: '任务' }
];

function PlaceholderPage({ title, navigate }) {
  return (
    <div className="screen placeholder-screen">
      <div className="placeholder-top">
        <button className="round-button" type="button" onClick={() => navigate('home')} aria-label="返回"><Icon name="返回" /></button>
      </div>
      <section className="placeholder-card">
        <span><Icon name="星" size={26} /></span>
        <h1>{title}</h1>
        <p>这个功能页面已经预留入口，后续可以继续接入完整内容。现在点击不会失效，你可以先从这里返回继续体验其他页面。</p>
        <button className="primary-button full" type="button" onClick={() => navigate('home')}>返回首页</button>
      </section>
    </div>
  );
}

function StatusTestPage({ navigate, notify }) {
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState('mood');
  const [mood, setMood] = useState('平静');
  const [stress, setStress] = useState(65);
  const [task, setTask] = useState(75);
  const moodScore = { 开心: 88, 平静: 76, 焦虑: 54, 疲惫: 58, 烦躁: 49, 迷茫: 56 }[mood];
  const score = Math.round((moodScore + (100 - stress) + task) / 3);

  if (step === 1) {
    return (
      <div className="screen status-test-screen result">
        <button className="status-back" type="button" onClick={() => setStep(0)} aria-label="返回"><Icon name="返回" size={31} /></button>
        <div className="status-mascot" />
        <header className="status-title">
          <h1>今日状态小测</h1>
          <p>30 秒了解你的情绪、压力和任务状态 ✨</p>
        </header>
        <section className="status-result-card">
          <h2>✦ 小测结果 ✦</h2>
          <div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}>
            <strong>{score}</strong>
            <span>状态得分</span>
            <em>{score > 70 ? '良好' : '需休息'}</em>
          </div>
          <div className="status-bars">
            <StatusBarLine icon="情绪" label="情绪状态" value={moodScore} />
            <StatusBarLine icon="压力" label="压力水平" value={stress} />
            <StatusBarLine icon="任务" label="任务状态" value={task} />
          </div>
        </section>
        <section className="status-advice">
          <h2>整体状态良好，继续保持哦！</h2>
          <p>你今天的情绪比较稳定，压力适中，任务推进顺利。适当休息和奖励自己，能让状态更上一层楼。</p>
        </section>
        <section className="status-agent-card">
          <h2>✦ 为你推荐的智能体 ✦</h2>
          <div>
            <img src="/assets/home/card-evening.png" alt="" />
            <div>
              <strong>晚星伴 <em>情感陪伴</em></strong>
              <p>温柔倾听，陪你梳理情绪，缓解压力</p>
              <button className="primary-button full" type="button" onClick={() => navigate('evening')}><Icon name="消息" />去聊天</button>
            </div>
          </div>
        </section>
        <section className="status-feedback">
          <p>本次小测对你有帮助吗？</p>
          <button type="button" onClick={() => notify('谢谢你的反馈')}>有帮助</button>
          <button type="button" onClick={() => notify('已记录，我们会继续优化')}>一般</button>
        </section>
      </div>
    );
  }

  return (
    <div className="screen status-test-screen">
      <button className="status-back" type="button" onClick={() => navigate('home')} aria-label="返回"><Icon name="返回" size={31} /></button>
      <div className="status-mascot" />
      <header className="status-title">
        <h1>今日状态小测</h1>
        <p>30 秒了解你的情绪、压力和任务状态 ✨</p>
      </header>
      <div className="status-tabs">
        {statusTabs.map((tab) => (
          <button key={tab.key} type="button" className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)}>
            <Icon name={tab.icon} />{tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'mood' && (
        <section className="status-step">
          <h2>你现在的情绪状态是？</h2>
          <p>选择最符合你此刻感受的选项</p>
          <div className="mood-grid">
            {moodOptions.map((item) => (
              <button key={item} className={mood === item ? 'is-active' : ''} type="button" onClick={() => setMood(item)}>
                <span>{item === '开心' ? '☺' : item === '平静' ? '◡' : item === '烦躁' ? '!' : item === '迷茫' ? '?' : '•'}</span>
                <strong>{item}</strong>
              </button>
            ))}
          </div>
        </section>
      )}
      {activeTab !== 'mood' && (
        <section className="status-step slider-step">
          <h2>{activeTab === 'stress' ? '你现在的压力水平是？' : '你的任务推进状态是？'}</h2>
          <p>{activeTab === 'stress' ? '滑动记录此刻压力感受' : '滑动记录今天的任务完成感'}</p>
          <input type="range" min="0" max="100" value={activeTab === 'stress' ? stress : task} onChange={(event) => activeTab === 'stress' ? setStress(Number(event.target.value)) : setTask(Number(event.target.value))} />
          <strong>{activeTab === 'stress' ? stress : task}/100</strong>
        </section>
      )}
      <button className="status-next" type="button" onClick={() => activeTab === 'mood' ? setActiveTab('stress') : activeTab === 'stress' ? setActiveTab('task') : setStep(1)}>下一步</button>
    </div>
  );
}

function StatusBarLine({ icon, label, value }) {
  return (
    <div className="status-bar-line">
      <Icon name={icon} />
      <span>{label}</span>
      <em>{value}/100</em>
      <i><b style={{ width: `${value}%` }} /></i>
    </div>
  );
}

function StatusModal({ close, notify }) {
  const [score, setScore] = useState(null);
  const result = useMemo(() => {
    if (score === null) return null;
    if (score < 35) return '今天需要先放慢一点，适合找晚星伴聊聊。';
    if (score < 70) return '状态稳定，可以把任务拆小后推进。';
    return '能量不错，适合处理关键沟通和复盘。';
  }, [score]);

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="status-title">
      <section className="modal-card">
        <button className="close-button" type="button" onClick={close} aria-label="关闭"><Icon name="关闭" /></button>
        <h2 id="status-title">今日状态小测</h2>
        <p>拖动滑块，记录你此刻的能量值。</p>
        <label className="range-field">
          <span>当前能量</span>
          <input type="range" min="0" max="100" value={score ?? 50} onChange={(event) => setScore(Number(event.target.value))} />
        </label>
        {result ? <div className="modal-result">{result}</div> : <div className="modal-result muted">等待你的输入</div>}
        <button className="primary-button full" type="button" onClick={() => { notify('测评报告已生成'); close(); }}>保存报告</button>
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

