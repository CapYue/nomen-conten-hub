import { useState, useEffect, useRef } from 'react';
import type { ContentTopic } from './data/contentPool';
import { TOPIC_POOL } from './data/contentPool';

interface ReviewImage { id: string; url: string; selected: boolean; refreshing: boolean; }
interface ReviewState { topic: ContentTopic; images: ReviewImage[]; bodyText: string; title: string; }
interface XHSStatus { api: 'checking'|'connected'|'disconnected'; login: 'checking'|'logged_in'|'not_logged_in'; sessionAge?: string; }

// 小红书状态指示灯
function XHSStatusBadge({ status, onClick }: { status: XHSStatus; onClick: () => void }) {
  const dot = status.api === 'connected' && status.login === 'logged_in'
    ? { bg: '#059669', label: `✅ 小红书已登录${status.sessionAge ? ` (${status.sessionAge})` : ''}` }
    : status.api === 'connected' && status.login === 'not_logged_in'
    ? { bg: '#f59e0b', label: '🔑 未登录' }
    : { bg: '#9ca3af', label: '⏳ 等待连接…' };
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, background: dot.bg + '18', border: `1px solid ${dot.bg}44`, borderRadius: '20px', padding: '3px 10px', cursor: 'pointer' }} title="点击配置小红书">
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot.bg }} />
      <span style={{ fontSize: '11px', fontWeight: 700, color: dot.bg }}>{dot.label}</span>
    </button>
  );
}

// 小红书登录/状态弹窗
function XHSLoginModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'info'|'wait'|'done'|'error'>('info');
  const [msg, setMsg] = useState('');
  const [qrReady, setQrReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [imgKey, setImgKey] = useState(0);

  const check = async () => {
    try {
      const r = await fetch('http://127.0.0.1:3002/api/status', { mode: 'cors' });
      const d = await r.json();
      if (d.loggedIn) { setStep('done'); setMsg(`已登录！有效期剩余 ${d.expiresIn}`); if (pollRef.current) clearInterval(pollRef.current); setTimeout(onClose, 2500); return; }
      if (d.qrExists) { setQrReady(true); setImgKey(k => k + 1); }
    } catch { setStep('error'); setMsg('无法连接 API。请确保服务器上已运行：node /workspace/pw/xhs_api.js'); if (pollRef.current) clearInterval(pollRef.current); }
  };

  const startLogin = async () => {
    setStep('wait'); setMsg('');
    try {
      await fetch('http://127.0.0.1:3002/api/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'login'}), mode:'cors' });
    } catch {}
    pollRef.current = setInterval(check, 4000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:900 }}>🌟 小红书自动发布</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#aaa' }}>×</button>
        </div>
        {step === 'info' && (
          <div>
            <p style={{ color:'#555', lineHeight:1.9, fontSize:'14px', marginBottom:12 }}>
              本功能需要<strong>在服务器上运行API服务器</strong>，它会调用云端浏览器自动完成小红书发布（登录只需1次，有效期7天）。
            </p>
            <div style={{ background:'#f8f8f8', borderRadius:10, padding:'12px 14px', fontFamily:'monospace', fontSize:12, color:'#333', marginBottom:14 }}>
              <strong style={{ color:'#059669' }}>node /workspace/pw/xhs_api.js</strong>
            </div>
            <p style={{ fontSize:'12px', color:'#999', marginBottom:16 }}>API服务器运行后，点击下方「扫码登录」，用小红书App扫码授权。</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={startLogin} style={{ flex:1, padding:'12px', background:'#e11d48', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:800, fontSize:14 }}>🔑 扫码登录小红书</button>
              <button onClick={onClose} style={{ padding:'12px 18px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700 }}>暂不</button>
            </div>
          </div>
        )}
        {step === 'wait' && (
          <div style={{ textAlign:'center' }}>
            {qrReady ? (
              <>
                <p style={{ fontSize:'13px', color:'#666', marginBottom:10 }}>用小红书App扫描二维码登录</p>
                <img key={imgKey} src={`http://127.0.0.1:3002/api/qr?t=${imgKey}`} alt="登录二维码" style={{ width:200, height:200, borderRadius:10, border:'1px solid #eee' }} />
                <p style={{ fontSize:'12px', color:'#059669', marginTop:10 }}>⏳ 等待扫码中…（二维码5分钟内有效）</p>
              </>
            ) : (
              <div style={{ padding:'30px 0' }}><div style={{ fontSize:36, marginBottom:10 }}>⏳</div><p style={{ color:'#666' }}>正在启动浏览器，请稍等15秒…</p></div>
            )}
            <p style={{ fontSize:'11px', color:'#bbb', marginTop:14 }}>也可以直接复制文案到小红书手动发布，不影响使用</p>
          </div>
        )}
        {step === 'done' && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <p style={{ fontSize:16, fontWeight:800, color:'#059669' }}>{msg || '登录成功！'}</p>
            <p style={{ fontSize:13, color:'#888', marginTop:8 }}>现在可以「发布到小红书」自动发布了！</p>
          </div>
        )}
        {step === 'error' && (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <p style={{ fontSize:13, color:'#e11d48', marginBottom:14 }}>{msg}</p>
            <div style={{ background:'#f8f8f8', borderRadius:10, padding:'12px 14px', fontFamily:'monospace', fontSize:12, textAlign:'left', marginBottom:14 }}>
              <strong style={{ color:'#059669' }}>node /workspace/pw/xhs_api.js</strong>
            </div>
            <button onClick={onClose} style={{ padding:'10px 24px', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>知道了</button>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  planned:   { bg: '#dbeafe', text: '#1e40af', label: '📋 规划中' },
  generated: { bg: '#ede7f6', text: '#6a1b9a', label: '✍️ 已生成' },
  drafted:   { bg: '#fef3c7', text: '#92400e', label: '🎨 生成中' },
  review:    { bg: '#ffe0b2', text: '#bf360c', label: '🔍 审核' },
  published: { bg: '#d1fae5', text: '#065f46', label: '✅ 已发布' },
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1600); }); }}
      style={{ padding: '6px 14px', background: ok ? '#059669' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
      {ok ? '✓ 已复制' : label}
    </button>
  );
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', padding: '12px 28px', borderRadius: '12px', zIndex: 9999, fontSize: '14px', fontWeight: 700, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{msg}</div>;
}

type Tab = 'home' | 'calendar' | 'generate' | 'settings';

export default function App() {
  const [topics, setTopics] = useState<ContentTopic[]>(TOPIC_POOL);
  const [tab, setTab] = useState<Tab>('home');
  const [toast, setToast] = useState('');
  const [genPrompt, setGenPrompt] = useState('');
  const [genResult, setGenResult] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reviewMode, setReviewMode] = useState<'auto' | 'manual'>(() => (localStorage.getItem('nomad_review_mode') ?? 'manual') as 'auto' | 'manual');
  const [review, setReview] = useState<ReviewState | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [scheduleEdit, setScheduleEdit] = useState<Record<number, string>>({});
  const [deepseekKey, setDeepseekKey] = useState(() => localStorage.getItem('nomad_ds_key') || '');
  const [deepseekUrl, setDeepseekUrl] = useState(() => localStorage.getItem('nomad_ds_url') || 'https://api.deepseek.com/v1');
  const [feishuChatId, setFeishuChatId] = useState(() => localStorage.getItem('nomad_feishu_chat') || '');
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showXHSLogin, setShowXHSLogin] = useState(false);
  const [xhsStatus, setXhsStatus] = useState<XHSStatus>({ api: 'checking', login: 'checking' });

  const toast_ = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const saveConfig = (k: string, v: string) => localStorage.setItem(k, v);
  const updateTopic = (id: number, patch: Partial<ContentTopic>) =>
    setTopics(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  // 检查小红书 API 状态
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('http://127.0.0.1:3002/api/status', { mode: 'cors' });
        const d = await r.json();
        setXhsStatus({ api: 'connected', login: d.loggedIn ? 'logged_in' : 'not_logged_in', sessionAge: d.expiresIn });
      } catch { setXhsStatus({ api: 'disconnected', login: 'checking' }); }
    };
    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, []);

  const toggleReviewMode = (mode: 'auto' | 'manual') => {
    setReviewMode(mode);
    localStorage.setItem('nomad_review_mode', mode);
    toast_(mode === 'auto' ? '🤖 已切换为自动发布' : '👤 已切换为人工审核');
  };

  const startReview = (topic: ContentTopic) => {
    const imgs: ReviewImage[] = Array.from({ length: 4 }, (_, i) => ({
      id: `${topic.id}-${i}`,
      url: (topic as any).coverImageUrl || `https://picsum.photos/seed/${topic.id * 7 + i * 13}/720/1280`,
      selected: false,
      refreshing: false,
    }));
    setReview({ topic, images: imgs, bodyText: topic.bodyText, title: topic.title });
  };

  const refreshImage = async (imgId: string) => {
    if (!review) return;
    const prompt = review.topic.coverPrompt || review.topic.bodyText.slice(0, 100);
    setReview(prev => prev ? { ...prev, images: prev.images.map(img => img.id === imgId ? { ...img, refreshing: true } : img) } : prev);
    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, seed: imgId })
      });
      const data = await resp.json();
      const newUrl = data.url || data.file || `https://picsum.photos/seed/${Date.now()}/720/1280?v=2`;
      setReview(prev => prev ? { ...prev, images: prev.images.map(img => img.id === imgId ? { ...img, url: newUrl, refreshing: false } : img) } : prev);
    } catch {
      setReview(prev => prev ? { ...prev, images: prev.images.map(img => img.id === imgId ? { ...img, url: `https://picsum.photos/seed/${Date.now()}/720/1280?v=2`, refreshing: false } : img) } : prev);
    }
  };

  const toggleImage = (imgId: string) => {
    if (!review) return;
    setReview(prev => prev ? { ...prev, images: prev.images.map(img => img.id === imgId ? { ...img, selected: !img.selected } : img) } : prev);
  };

  const regenerateAll = async () => {
    if (!review) return;
    setReview(prev => prev ? { ...prev, images: prev.images.map(img => ({ ...img, refreshing: true, selected: false })) } : prev);
    try {
      const results = await Promise.all(review.images.map((img, i) =>
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: review.topic.coverPrompt || review.topic.bodyText.slice(0, 100), seed: img.id + i })
        }).then(r => r.json()).then(d => d.url || d.file || `https://picsum.photos/seed/${Date.now()+i}/720/1280?v=2`)
      ));
      setReview(prev => prev ? { ...prev, images: prev.images.map((img, i) => ({ ...img, url: results[i], refreshing: false })) } : prev);
    } catch {
      setReview(prev => prev ? { ...prev, images: prev.images.map((img, i) => ({ ...img, url: `https://picsum.photos/seed/${Date.now()+i}/720/1280?v=2`, refreshing: false })) } : prev);
    }
  };

  const handlePublish = async () => {
    if (!review) return;
    setPublishing(true);
    const selectedImages = review.images.filter(i => i.selected);
    try {
      // 优先：调用小红书 API 真实发布
      if (xhsStatus.api === 'connected' && xhsStatus.login === 'logged_in') {
        toast_('🤖 正在通过云端浏览器自动发布…');
        const body = {
          title: review.title,
          content: review.bodyText,
          images: selectedImages.map((_, i) => `/workspace/nomad-content-hub/public/covers/topic_${review.topic.id}_${i}.png`),
          topics: review.topic.tags || '',
        };
        const resp = await fetch('http://127.0.0.1:3002/api/publish', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), mode: 'cors',
        });
        const d = await resp.json();
        if (d.ok) {
          updateTopic(review.topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) });
          toast_('🎉 发布成功！小红书已自动发布！');
        } else if (d.reason === 'not_logged_in') {
          await navigator.clipboard.writeText(`【${review.title}】\n\n${review.bodyText}`);
          updateTopic(review.topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) });
          toast_('✅ 已复制！去小红书手动发布');
        } else {
          await navigator.clipboard.writeText(`【${review.title}】\n\n${review.bodyText}`);
          toast_('⚠️ 发布异常，已复制文案');
        }
      } else {
        // Fallback：复制文案
        await navigator.clipboard.writeText(`【${review.title}】\n\n${review.bodyText}`);
        updateTopic(review.topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) });
        toast_('✅ 已复制文案！去小红书粘贴发布');
      }
      setReview(null);
    } catch {
      try {
        await navigator.clipboard.writeText(`【${review.title}】\n\n${review.bodyText}`);
        updateTopic(review.topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) });
        toast_('✅ 已复制！去小红书手动发布');
        setReview(null);
      } catch { toast_('❌ 发布失败'); }
    }
    setPublishing(false);
  };

  const handleAutoPublish = async (topic: ContentTopic) => {
    updateTopic(topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) });
    await navigator.clipboard.writeText(topic.bodyText);
    toast_(`✅「${topic.title}」已自动发布，文案已复制！`);
  };

  const handleGenerate = async () => {
    if (!deepseekKey) { toast_('⚠️ 请先填 Deepseek API Key'); return; }
    if (!genPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${deepseekUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [
          { role: 'system', content: '你是小红书游牧文化内容创作者。语言：短句分段、情绪丰富、emoji、#话题标签。' },
          { role: 'user', content: `请为「${genPrompt}」生成小红书内容，返回JSON格式：\n{"title":"标题(15字内带emoji)","bodyText":"正文(800字，分段，带emoji和#标签)","coverPrompt":"英文AI绘图描述(9:16竖版,纪录片风格)"}` }
        ], temperature: 0.8 }),
      });
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) { toast_('❌ Deepseek 返回为空'); setGenerating(false); return; }
      try {
        const p = JSON.parse(content);
        setGenResult(JSON.stringify(p, null, 2));
        setAiPrompt(p.coverPrompt || '');
        toast_('✅ 生成成功！');
      } catch { setGenResult(content); toast_('⚠️ 已生成（非JSON格式）'); }
    } catch (e: unknown) { toast_(`❌ 失败：${e instanceof Error ? e.message : String(e)}`); }
    setGenerating(false);
  };

  const handleCreateTopic = () => {
    if (!genResult) return;
    try {
      const p = JSON.parse(genResult);
      const newId = Math.max(...topics.map(t => t.id)) + 1;
      const newTopic: ContentTopic = { id: newId, title: p.title || '新选题', bodyText: p.bodyText || '', coverPrompt: p.coverPrompt || aiPrompt || '', tags: ['AI生成'], status: 'generated', month: currentMonth, generatedAt: new Date().toISOString().slice(0, 10) };
      setTopics(prev => [newTopic, ...prev]);
      toast_(`✅「${newTopic.title}」已加入内容库！`);
      setGenResult(''); setGenPrompt(''); setAiPrompt('');
    } catch { toast_('❌ 解析失败'); }
  };

  const stats = { total: topics.length, generated: topics.filter(t => t.status === 'generated').length, published: topics.filter(t => t.status === 'published').length };

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: 'home',     label: '内容库',   emoji: '🏠' },
    { key: 'calendar', label: '内容日历', emoji: '📅' },
    { key: 'generate', label: 'AI 生成',   emoji: '✨' },
    { key: 'settings', label: '配置',      emoji: '⚙️' },
  ];

  // ─── REVIEW SCREEN ───────────────────────────────────────────
  if (review) {
    const selectedImages = review.images.filter(i => i.selected);
    const canPublish = selectedImages.length >= 1;

    return (
      <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
        {toast && <Toast msg={toast} />}
      {showXHSLogin && <XHSLoginModal onClose={() => setShowXHSLogin(false)} />}
        <div style={{ background: '#1a1a2e', color: '#fff', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>🔍 内容审核 · 选封面 · 发布</h2>
              <p style={{ margin: '2px 0 0', opacity: 0.6, fontSize: '12px' }}>{review.topic.title}</p>
            </div>
            <XHSStatusBadge status={xhsStatus} onClick={() => setShowXHSLogin(true)} />
            <button onClick={() => setReview(null)} style={{ padding: '7px 18px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>← 返回</button>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 22, alignItems: 'start' }}>
          {/* Images */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#1a1a2e' }}>🖼️ 选择封面图</h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>点击「刷新」重新生成 · 点击图片选中 · 选1张后即可发布</p>
              </div>
              <button onClick={regenerateAll} disabled={review.images.some(i => i.refreshing)} style={{ padding: '8px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 800 }}>🔄 全部刷新</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {review.images.map(img => (
                <div key={img.id} style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', border: img.selected ? '3px solid #059669' : '3px solid transparent', boxShadow: img.selected ? '0 0 0 5px rgba(5,150,105,0.25)' : '0 2px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s' }} onClick={() => toggleImage(img.id)}>
                  <img src={img.url} alt="cover" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${img.id}/720/1280`; }} />
                  {img.refreshing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 800, flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: '28px' }}>⏳</div>AI 生图中…
                    </div>
                  )}
                  {img.selected && <div style={{ position: 'absolute', top: 10, right: 10, background: '#059669', color: '#fff', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>✓</div>}
                  {!img.refreshing && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 8px 8px', display: 'flex', gap: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); refreshImage(img.id); }} style={{ flex: 1, padding: '7px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#333' }}>🔄 刷新</button>
                      <button onClick={(e) => { e.stopPropagation(); toggleImage(img.id); }} style={{ flex: 1, padding: '7px', background: img.selected ? '#059669' : 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: img.selected ? '#fff' : '#333' }}>{img.selected ? '✓ 已选' : '选这张'}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedImages.length > 0 && (
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#d1fae5', borderRadius: '10px', fontSize: '13px', color: '#065f46', fontWeight: 600 }}>✅ 已选择 {selectedImages.length} 张封面图 → 右侧编辑文案后点击发布</div>
            )}
          </div>

          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 90 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#888', display: 'block', marginBottom: 6 }}>📌 标题</label>
              <input value={review.title} onChange={e => setReview(prev => prev ? { ...prev, title: e.target.value } : prev)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e0d8cf', borderRadius: '9px', fontSize: '14px', boxSizing: 'border-box', fontWeight: 800, color: '#1a1a2e' }} />
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#888' }}>📝 正文（可编辑）</label>
                <CopyBtn text={review.bodyText} label="📋 复制" />
              </div>
              <textarea value={review.bodyText} onChange={e => setReview(prev => prev ? { ...prev, bodyText: e.target.value } : prev)} rows={18} style={{ width: '100%', padding: '10px', border: '1.5px solid #e0d8cf', borderRadius: '9px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.9, fontFamily: 'inherit', color: '#333' }} />
            </div>
            <button onClick={handlePublish} disabled={!canPublish || publishing} style={{ width: '100%', padding: '16px', background: canPublish ? 'linear-gradient(135deg,#e11d48,#f43f5e)' : '#ccc', color: '#fff', border: 'none', borderRadius: '14px', cursor: canPublish ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: 900, boxShadow: canPublish ? '0 6px 24px rgba(225,29,72,0.4)' : 'none' }}>
              {publishing ? '⏳ 发布中…' : canPublish ? '📤 发布到小红书' : '请先选择1张封面图'}
            </button>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: '12px', color: '#888', lineHeight: 1.8 }}>
              <strong style={{ color: '#333' }}>💡 发布说明：</strong>点击「发布」后文案自动复制 · 打开小红书 App → 发笔记 · 封面图保存到相册手动上传
            </div>
            <button onClick={() => { updateTopic(review.topic.id, { status: 'published', publishedAt: new Date().toISOString().slice(0, 10) }); setReview(null); toast_('已标记为发布'); }} style={{ width: '100%', padding: '10px', background: '#fff', border: '1.5px solid #e0d8cf', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#888' }}>跳过 → 稍后发布</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── NORMAL TABS ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
      {toast && <Toast msg={toast} />}
      {showXHSLogin && <XHSLoginModal onClose={() => setShowXHSLogin(false)} />}

      {/* Header */}
      <div style={{ background: '#1a1a2e', color: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>🌿 原野.NomadWild 内容工厂</h1>
              <p style={{ margin: '3px 0 0', opacity: 0.6, fontSize: '12px' }}>游牧文化 · AI 创作 · 小红书发布</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '3px', gap: 2 }}>
                <button onClick={() => toggleReviewMode('auto')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: reviewMode === 'auto' ? '#059669' : 'transparent', color: reviewMode === 'auto' ? '#fff' : 'rgba(255,255,255,0.6)' }}>🤖 自动</button>
                <button onClick={() => toggleReviewMode('manual')} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: reviewMode === 'manual' ? '#2563eb' : 'transparent', color: reviewMode === 'manual' ? '#fff' : 'rgba(255,255,255,0.6)' }}>👤 审核</button>
              </div>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: '8px', border: '1.5px solid rgba(255,255,255,0.3)', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1a1a2e' : '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>{t.emoji} {t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── HOME ── */}
        {tab === 'home' && (
          <>
            <div style={{ background: reviewMode === 'auto' ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#1e40af,#3b82f6)', borderRadius: '14px', padding: '14px 24px', color: '#fff', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>{reviewMode === 'auto' ? '🤖 自动发布模式' : '👤 人工审核模式'}</div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.88 }}>{reviewMode === 'auto' ? 'AI 生成后自动复制文案并发布' : '生成后进入审核页面，选择封面 + 编辑文案 + 发布'}</p>
              </div>
              <button onClick={() => toggleReviewMode(reviewMode === 'auto' ? 'manual' : 'auto')} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>切换模式 →</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: '总选题', value: stats.total, bg: '#eef2ff', color: '#4338ca', emoji: '📚' },
                { label: '待发布', value: stats.generated, bg: '#ede7f6', color: '#6a1b9a', emoji: '✍️' },
                { label: '已发布', value: stats.published, bg: '#e8f5e9', color: '#2e7d32', emoji: '✅' },
                { label: '本月', value: topics.filter(t => t.month === currentMonth).length, bg: '#fce4ec', color: '#ad1457', emoji: '🗓️' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: s.color, marginTop: 4, opacity: 0.85 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {topics.map(topic => {
                const sc = STATUS_CONFIG[topic.status] || STATUS_CONFIG.planned;
                const isAuto = reviewMode === 'auto' && topic.status !== 'published';
                return (
                  <div key={topic.id} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: isAuto ? '2px solid #059669' : '2px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ background: sc.bg, color: sc.text, fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px' }}>{sc.label}</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {topic.status !== 'published' && (
                          isAuto ? (
                            <button onClick={() => handleAutoPublish(topic)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>⚡ 自动发布</button>
                          ) : (
                            <button onClick={() => startReview(topic)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '7px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>🔍 审核发布</button>
                          )
                        )}
                        {topic.status === 'published' && <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '11px', fontWeight: 700, padding: '5px 10px', borderRadius: '7px' }}>✓ 已发布</span>}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 7px' }}>{topic.title}</h3>
                    <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px', lineHeight: 1.6 }}>{topic.bodyText.slice(0, 72)}…</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {(topic.tags || []).map(tag => <span key={tag} style={{ background: '#f5f0e8', color: '#7c6a5a', fontSize: '11px', padding: '2px 7px', borderRadius: '5px' }}>{tag}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <CopyBtn text={topic.bodyText} label="📋 复制" />
                      <CopyBtn text={topic.coverPrompt} label="🖼️ 封面词" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── CALENDAR ── */}
        {tab === 'calendar' && (
          <>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1a1a2e', fontWeight: 900 }}>📅 内容日历</h2>
            {['2026-04', '2026-05', '2026-06'].map(month => {
              const mt = topics.filter(t => t.month === month);
              if (!mt.length) return null;
              return (
                <div key={month} style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#555', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #e0d8cf' }}>🗓️ {month} · {mt.length} 篇</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                    {mt.map(topic => {
                      const sc = STATUS_CONFIG[topic.status] || STATUS_CONFIG.planned;
                      return (
                        <div key={topic.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                            <span style={{ background: sc.bg, color: sc.text, fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px' }}>{sc.label}</span>
                            <input type="date" value={scheduleEdit[topic.id] || topic.scheduledDate || ''} onChange={e => { setScheduleEdit(prev => ({ ...prev, [topic.id]: e.target.value })); updateTopic(topic.id, { scheduledDate: e.target.value }); }} style={{ border: '1px solid #e0d8cf', borderRadius: '6px', fontSize: '11px', padding: '2px 5px', color: '#555' }} />
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{topic.title}</div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>{(topic.tags || []).slice(0, 2).join(' · ')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
        {/* ── GENERATE ── */}
        {tab === 'generate' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ background: '#fff', borderRadius: '18px', padding: '26px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 900, color: '#1a1a2e' }}>✍️ AI 文案生成</h2>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#888' }}>Deepseek 自动生成正文+标题+封面提示词</p>
                <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)} rows={4} placeholder="例如：蒙古族马奶节的传统习俗" style={{ width: '100%', padding: '11px', border: '1.5px solid #e0d8cf', borderRadius: '12px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }} />
                <button onClick={handleGenerate} disabled={generating || !genPrompt.trim()} style={{ marginTop: 10, width: '100%', padding: '11px', background: generating ? '#9ca3af' : '#1a1a2e', color: '#fff', border: 'none', borderRadius: '12px', cursor: generating ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 800 }}>
                  {generating ? '⏳ 生成中…' : '🚀 立即生成'}
                </button>
                {genResult && (
                  <div style={{ marginTop: 16 }}>
                    <pre style={{ background: '#faf8f5', border: '1px solid #ede8e0', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#333', overflow: 'auto', maxHeight: 280, lineHeight: 1.7 }}>{genResult}</pre>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => navigator.clipboard.writeText(genResult)} style={{ flex: 1, padding: '9px', background: '#f0ebe4', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#555' }}>复制</button>
                      <button onClick={handleCreateTopic} style={{ flex: 1, padding: '9px', background: '#059669', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: 700 }}>✅ 加入内容库</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ background: '#fff', borderRadius: '18px', padding: '26px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 900, color: '#1a1a2e' }}>🎨 封面图说明</h2>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#888' }}>审核时选择封面，可逐张刷新重新生成</p>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} placeholder="英文封面描述，AI绘图工具使用" style={{ width: '100%', padding: '11px', border: '1.5px solid #e0d8cf', borderRadius: '12px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7, marginBottom: 10 }} />
                <CopyBtn text={aiPrompt} label="📋 复制封面描述" />
                <div style={{ marginTop: 14, padding: '14px', background: '#f5f0e8', borderRadius: '10px', fontSize: '12px', color: '#555', lineHeight: 1.8 }}>
                  <strong style={{ color: '#1a1a2e' }}>🎯 流程：</strong>① 左侧生成内容 → ② 点「审核发布」→ ③ 封面图可逐张刷新 → ④ 选图+编辑文案 → ⑤ 发布
                </div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800, color: '#1a1a2e' }}>🔥 快速生成选题</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
                {['那达慕大会：草原最盛大的"男儿三艺"运动会', '蒙古包门为何朝南？草原建筑的千年智慧', '草原禁忌：这些事在草原上绝对不能做', '马头琴：草原上最悲伤的乐器', '我在呼伦贝尔住蒙古包30天真实记录'].map(q => (
                  <button key={q} onClick={() => { setGenPrompt(q); setTab('generate'); }} style={{ textAlign: 'left', padding: '11px 14px', background: '#f5f0e8', border: '1.5px solid #e0d8cf', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', color: '#333', lineHeight: 1.5 }}>
                    ✨ {q}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1a1a2e', fontWeight: 900 }}>⚙️ 配置与帮助</h2>
            <div style={{ display: 'grid', gap: 18 }}>
              {[
                { title: '🤖 Deepseek API（文案生成）', color: '#4338ca', items: [
                  { label: 'API Key', placeholder: 'sk-...', value: deepseekKey, type: 'password', setter: setDeepseekKey, cfgKey: 'nomad_ds_key' },
                  { label: 'API 地址', placeholder: 'https://api.deepseek.com/v1', value: deepseekUrl, type: 'text', setter: setDeepseekUrl, cfgKey: 'nomad_ds_url' },
                ], help: '申请：https://platform.deepseek.com 注册后创建 Key，免费额度足够' },
                { title: '📨 飞书审核通知', color: '#0284c7', items: [
                  { label: '飞书 Chat ID / Webhook', placeholder: 'oc_xxx 或 webhook token', value: feishuChatId, type: 'text', setter: setFeishuChatId, cfgKey: 'nomad_feishu_chat' },
                ], help: '方式1：飞书机器人 Webhook 地址；方式2：Chat ID，自动发消息给你' },
                { title: '📸 小红书发布（手动）', color: '#e11d48', items: [], help: '小红书有官方 API，需申请开发者权限。目前「复制正文+封面图」到 App 发布最简单可靠' },
              ].map(section => (
                <div key={section.title} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${section.color}` }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: section.color }}>{section.title}</h3>
                  {section.items.map(item => (
                    <div key={item.label} style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#333', display: 'block', marginBottom: 4 }}>{item.label}</label>
                      <input type={item.type} placeholder={item.placeholder} value={item.value} onChange={e => { item.setter(e.target.value); saveConfig(item.cfgKey, e.target.value); }}
                        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e0d8cf', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888', lineHeight: 1.7 }}>{section.help}</p>
                </div>
              ))}
              <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#2d2d5a)', borderRadius: '16px', padding: '24px', color: '#fff' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900 }}>🔄 完整工作流</h3>
                {[
                  ['① AI 生成文案', '输入选题，Deepseek 生成完整正文+标题+封面描述'],
                  ['② 加入内容库', '点「加入内容库」自动进入管理列表'],
                  ['③ 人工审核', '选封面图（可刷新）+ 编辑文案 + 点发布'],
                  ['④ 自动发布', '直接复制文案并标记为已发布'],
                  ['⑤ 小红书发布', 'App 粘贴正文 + 上传封面图'],
                ].map(([title, desc]) => (
                  <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ minWidth: 120, fontWeight: 800, fontSize: '13px', color: '#a5b4fc', whiteSpace: 'nowrap' }}>{title}</div>
                    <div style={{ fontSize: '13px', opacity: 0.88, lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', color: '#bbb', fontSize: '12px' }}>
        原野.NomadWild 内容工厂 · OpenClaw AI · 2026
      </div>
    </div>
  );
}
