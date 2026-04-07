/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'initial',
    role: 'assistant',
    content: '你好啊。有什么事儿说吧——写东西也好，聊聊也好，或者就是想找个人说说话，都行。（人间不值得，但聊聊还是可以的）',
  },
];


// Li Dan voice sound effects (pre-generated via Fish Audio)
type SoundType = 'send' | 'thinking' | 'receive' | 'error' | 'welcome' | 'reset';

const playSound = (type: SoundType, enabled = true) => {
  if (!enabled) return;
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.play().catch(() => {});
};

// Lidan Video Character
type CharacterState = 'idle' | 'thinking' | 'speaking';

const LidanCharacter = ({ state }: { state: CharacterState }) => {
  const speakingRef = useRef<HTMLVideoElement>(null);
  const thinkingRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const sp = speakingRef.current;
    const th = thinkingRef.current;
    if (!sp || !th) return;

    if (state === 'speaking') {
      sp.play().catch(() => {});
      th.pause(); th.currentTime = 0;
    } else if (state === 'thinking') {
      th.playbackRate = 2.0;
      th.play().catch(() => {});
      sp.pause(); sp.currentTime = 0;
    } else {
      sp.pause(); sp.currentTime = 0;
      th.pause(); th.currentTime = 0;
    }
  }, [state]);

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 overflow-hidden">
      <video ref={speakingRef} src="/lidan.mp4" loop muted playsInline
        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-200 ${state === 'thinking' ? 'opacity-0' : 'opacity-100'}`} />
      <video ref={thinkingRef} src="/lidan-thinking.mp4" loop muted playsInline
        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-200 ${state === 'thinking' ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

// Decorative Components
const PixelCloud = ({ className }: { className?: string }) => (
  <motion.div className={className} animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
    <svg viewBox="0 0 32 16" className="w-24 h-12" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="4" width="24" height="8" fill="white" />
      <rect x="8" y="2" width="16" height="2" fill="white" />
      <rect x="8" y="12" width="16" height="2" fill="white" />
      <rect x="2" y="6" width="2" height="4" fill="white" />
      <rect x="28" y="6" width="2" height="4" fill="white" />
    </svg>
  </motion.div>
);

const PixelStar = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div className={className} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay }}>
    <svg viewBox="0 0 8 8" className="w-6 h-6" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="1" width="2" height="6" fill="#f6c177" />
      <rect x="1" y="3" width="6" height="2" fill="#f6c177" />
      <rect x="3" y="3" width="2" height="2" fill="white" />
    </svg>
  </motion.div>
);

const PixelHeart = ({ className }: { className?: string }) => (
  <motion.div className={className} animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
    <svg viewBox="0 0 8 8" className="w-8 h-8" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="2" width="2" height="2" fill="#eb6f92" />
      <rect x="5" y="2" width="2" height="2" fill="#eb6f92" />
      <rect x="2" y="1" width="1" height="1" fill="#eb6f92" />
      <rect x="5" y="1" width="1" height="1" fill="#eb6f92" />
      <rect x="1" y="4" width="6" height="1" fill="#eb6f92" />
      <rect x="2" y="5" width="4" height="1" fill="#eb6f92" />
      <rect x="3" y="6" width="2" height="1" fill="#eb6f92" />
    </svg>
  </motion.div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const speakMessage = async (msgId: string, text: string) => {
    if (!isSoundEnabled || speakingMsgId === msgId) return;
    setSpeakingMsgId(msgId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) { setSpeakingMsgId(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setSpeakingMsgId(null); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSpeakingMsgId(null); };
      audio.play().catch(() => setSpeakingMsgId(null));
    } catch {
      setSpeakingMsgId(null);
    }
  };

  useEffect(() => {
    // Welcome sound on first load (after a short delay so audio context can initialize)
    const t = setTimeout(() => playSound('welcome', isSoundEnabled), 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const botId = (Date.now() + 1).toString();
    const botMsg: Message = { id: botId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setIsLoading(true);
    playSound('send', isSoundEnabled);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (firstChunk) {
          firstChunk = false;
          playSound('thinking', isSoundEnabled);
        }
        setMessages(prev =>
          prev.map(m => m.id === botId ? { ...m, content: m.content + chunk } : m)
        );
      }

      playSound('receive', isSoundEnabled);
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === botId ? { ...m, content: '哎呀出错了，稍后再试试。' } : m)
      );
      playSound('error', isSoundEnabled);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, isSoundEnabled]);

  const lastMsg = messages[messages.length - 1];
  const characterState: CharacterState =
    !isLoading ? 'idle' :
    lastMsg?.role === 'assistant' && lastMsg.content === '' ? 'thinking' :
    'speaking';

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-dotgothic text-[#e0def4] relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
        src="/bg.mp4"
      />
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-[#2d1b4e]/70 pointer-events-none" style={{ zIndex: 1 }} />
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        <PixelCloud className="absolute top-10 left-[5%] opacity-20" />
        <PixelCloud className="absolute top-40 right-[10%] opacity-10" />
        <PixelStar className="absolute top-20 left-[20%]" delay={0.5} />
        <PixelStar className="absolute top-60 right-[25%]" delay={1.2} />
        <PixelStar className="absolute bottom-40 left-[15%]" delay={0.8} />
        <PixelHeart className="absolute bottom-20 right-[5%] opacity-30" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 relative z-10">
        {/* Title nameplate */}
        <div className="flex items-center gap-0">
          <div className="px-2 py-1 bg-[#191724] border-4 border-[#191724] shadow-[4px_4px_0px_0px_#191724] flex items-center">
            <img src="/egg-icon.png" alt="蛋" className="w-8 h-8" style={{ imageRendering: 'pixelated' }} />
          </div>
          <div className="px-4 py-2 bg-[#191724] border-4 border-l-0 border-[#191724] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
            <h1 className="text-xl font-dotgothic tracking-[0.15em] text-[#ebbcba] leading-none" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}>
              蛋总在线
            </h1>
          </div>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSoundEnabled(s => !s)} className="px-3 py-2 bg-[#191724] border-4 border-[#191724] hover:bg-[#26233a] transition-colors text-[#908caa] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-px">
            {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => { setMessages(INITIAL_MESSAGES); setInput(''); playSound('reset', isSoundEnabled); }} className="px-3 py-2 bg-[#191724] border-4 border-[#191724] hover:bg-[#26233a] transition-colors text-[#908caa] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-px">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-4xl flex-1 flex flex-col md:flex-row gap-12 items-center md:items-start relative z-10">
        {/* Character */}
        <div className="sticky top-8 flex flex-col items-center">
          <div className="p-4 bg-[#1f1d2e] border-4 border-[#191724] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
            <LidanCharacter state={characterState} />
          </div>
          <div className="mt-6 px-6 py-2 bg-[#31748f] text-white border-4 border-[#191724] text-sm font-pixel uppercase tracking-widest">
            {characterState === 'thinking' ? 'Thinking' : characterState === 'speaking' ? 'Speaking' : 'Idle'}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 w-full flex flex-col bg-[#1f1d2e] border-4 border-[#191724] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 min-h-[400px] max-h-[60vh] bg-[#191724]/30">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                // Skip empty bot placeholder — replaced by Thinking indicator below
                if (msg.role === 'assistant' && msg.content === '') return null;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`relative max-w-[90%] px-6 py-4 border-4 border-[#191724] ${
                      msg.role === 'user'
                        ? 'bg-[#c4a7e7] text-[#191724] shadow-[-4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                        : 'bg-[#26233a] text-[#e0def4] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none font-dotgothic leading-relaxed">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakMessage(msg.id, msg.content)}
                          disabled={speakingMsgId === msg.id}
                          className="mt-3 flex items-center gap-1 text-[#908caa] hover:text-[#ebbcba] text-xs font-pixel uppercase tracking-tighter transition-colors disabled:opacity-40"
                        >
                          <Volume2 className="w-3 h-3" />
                          {speakingMsgId === msg.id ? '播放中...' : '读出来'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.content === '' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-[#26233a] px-4 py-2 border-4 border-[#191724] flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#ebbcba] animate-pulse" />
                  <span className="text-xs font-pixel text-[#908caa] uppercase tracking-tighter">Thinking...</span>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-[#191724] border-t-4 border-[#191724]">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="说吧，什么事..."
                disabled={isLoading}
                className="flex-1 px-6 py-4 bg-[#1f1d2e] border-4 border-[#191724] text-[#e0def4] focus:outline-none focus:border-[#ebbcba] transition-colors font-dotgothic uppercase placeholder:text-[#6e6a86] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 bg-[#ebbcba] text-[#191724] border-4 border-[#191724] hover:bg-[#e0def4] disabled:opacity-50 transition-all active:translate-y-1 shadow-[0px_4px_0px_0px_#191724]"
              >
                <Send className="w-8 h-8" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-[#6e6a86] text-[10px] font-pixel uppercase tracking-widest text-center relative z-10">
        &copy; 2026 蛋总在线 // 人间不值得，但这里还行
      </footer>

      <style>{`
        .prose p { margin: 0; }
        .prose ul, .prose ol { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #191724; }
        ::-webkit-scrollbar-thumb { background: #26233a; border: 2px solid #191724; }
        ::-webkit-scrollbar-thumb:hover { background: #ebbcba; }
      `}</style>
    </div>
  );
}
