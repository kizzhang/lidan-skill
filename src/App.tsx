/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Send, User, Bot, Loader2, RefreshCw, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import Pixel3DScene from './components/Pixel3DScene';

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Sound Synthesis Utility
const playSound = (type: 'send' | 'receive' | 'error' | 'speak') => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  switch (type) {
    case 'send':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'receive':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'error':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'speak':
      // A very subtle "blip" for character speaking
      osc.type = 'sine';
      osc.frequency.setValueAtTime(Math.random() * 200 + 400, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
  }
};

interface Message {
  role: 'user' | 'bot';
  content: string;
  id: string;
}

// Pixel Art Character Component
const PixelCharacter = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full drop-shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Background/Shadow */}
        <circle cx="32" cy="58" r="12" fill="rgba(0,0,0,0.1)" />
        
        {/* Body/Shirt (Brown) */}
        <rect x="16" y="48" width="32" height="16" fill="#7d4a25" />
        <rect x="20" y="52" width="24" height="12" fill="#5d361b" />
        
        {/* Head (Skin Tone) */}
        <rect x="20" y="16" width="24" height="32" fill="#e5b087" />
        <rect x="22" y="14" width="20" height="2" fill="#e5b087" />
        
        {/* Glasses */}
        <rect x="22" y="28" width="8" height="8" fill="none" stroke="#1a1a1a" strokeWidth="1" />
        <rect x="34" y="28" width="8" height="8" fill="none" stroke="#1a1a1a" strokeWidth="1" />
        <rect x="30" y="32" width="4" height="1" fill="#1a1a1a" />
        
        {/* Eyes */}
        <rect x="25" y="31" width="2" height="2" fill="#1a1a1a" />
        <rect x="37" y="31" width="2" height="2" fill="#1a1a1a" />

        {/* Mouth Animation */}
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.g
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Animated Mouth */}
              <motion.rect
                x="28"
                y="40"
                width="8"
                height="4"
                fill="#1a1a1a"
                animate={{ 
                  height: [2, 6, 2, 8, 2],
                  y: [41, 39, 41, 38, 41]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              />
            </motion.g>
          ) : (
            <motion.g
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Idle Smile */}
              <rect x="28" y="42" width="8" height="1" fill="#1a1a1a" />
              <rect x="27" y="41" width="1" height="1" fill="#1a1a1a" />
              <rect x="36" y="41" width="1" height="1" fill="#1a1a1a" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Ears */}
        <rect x="18" y="30" width="2" height="6" fill="#e5b087" />
        <rect x="44" y="30" width="2" height="6" fill="#e5b087" />
      </svg>
    </div>
  );
};

// Decorative Pixel Art Components
const PixelCloud = ({ className }: { className?: string }) => (
  <motion.div 
    className={className}
    animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg viewBox="0 0 32 16" className="w-24 h-12" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="4" width="24" height="8" fill="white" />
      <rect x="8" y="2" width="16" height="2" fill="white" />
      <rect x="8" y="12" width="16" height="2" fill="white" />
      <rect x="2" y="6" width="2" height="4" fill="white" />
      <rect x="28" y="6" width="2" height="4" fill="white" />
    </svg>
  </motion.div>
);

const PixelStar = ({ className, delay = 0 }: { className?: string, delay?: number }) => (
  <motion.div 
    className={className}
    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 2, repeat: Infinity, delay }}
  >
    <svg viewBox="0 0 8 8" className="w-6 h-6" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="1" width="2" height="6" fill="#f6c177" />
      <rect x="1" y="3" width="6" height="2" fill="#f6c177" />
      <rect x="3" y="3" width="2" height="2" fill="white" />
    </svg>
  </motion.div>
);

const PixelHeart = ({ className }: { className?: string }) => (
  <motion.div 
    className={className}
    animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 1.5, repeat: Infinity }}
  >
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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "你好！我是你的像素助手。有什么我可以帮你的吗？", id: 'initial' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speaking sound loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking && isSoundEnabled) {
      interval = setInterval(() => {
        playSound('speak');
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isSpeaking, isSoundEnabled]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (isSoundEnabled) playSound('send');

    const userMessage: Message = {
      role: 'user',
      content: input,
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsSpeaking(true);

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
      });
      const text = response.text;

      if (isSoundEnabled) playSound('receive');

      const botMessage: Message = {
        role: 'bot',
        content: text || "抱歉，我没听清楚，请再说一遍。",
        id: (Date.now() + 1).toString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      if (isSoundEnabled) playSound('error');
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "哎呀，出了一点小问题，请稍后再试。", 
        id: (Date.now() + 1).toString() 
      }]);
    } finally {
      setIsLoading(false);
      // Keep speaking for a short duration after response to simulate finishing the sentence
      setTimeout(() => setIsSpeaking(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d1b4e] flex flex-col items-center p-4 md:p-8 font-dotgothic text-[#e0def4] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <PixelCloud className="absolute top-10 left-[5%] opacity-20" />
        <PixelCloud className="absolute top-40 right-[10%] opacity-10" />
        <PixelStar className="absolute top-20 left-[20%]" delay={0.5} />
        <PixelStar className="absolute top-60 right-[25%]" delay={1.2} />
        <PixelStar className="absolute bottom-40 left-[15%]" delay={0.8} />
        <PixelHeart className="absolute bottom-20 right-[5%] opacity-30" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-[#1f1d2e] border-4 border-[#191724] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <Bot className="w-8 h-8 text-[#ebbcba]" />
          </div>
          <h1 className="text-2xl font-pixel tracking-tighter text-[#ebbcba] uppercase">Pixel Chat</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 bg-[#1f1d2e] border-4 border-[#191724] hover:bg-[#26233a] transition-colors text-[#908caa]"
            title={isSoundEnabled ? "Mute" : "Unmute"}
          >
            {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setMessages([{ role: 'bot', content: "你好！我是你的像素助手。有什么我可以帮你的吗？", id: 'initial' }])}
            className="p-2 bg-[#1f1d2e] border-4 border-[#191724] hover:bg-[#26233a] transition-colors text-[#908caa]"
            title="Reset Chat"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col md:flex-row gap-12 items-center md:items-start">
        
        {/* Character Section */}
        <div className="sticky top-8 flex flex-col items-center">
          <div className="relative p-4 bg-[#1f1d2e] border-4 border-[#191724] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] group overflow-visible">
            {/* 3D Pixel Voxel Scene Overlay */}
            <div className="absolute inset-0 -inset-x-16 pointer-events-none z-0">
              <Pixel3DScene />
            </div>
            
            <div className="relative z-10">
              <PixelCharacter isSpeaking={isSpeaking} />
            </div>
          </div>
          <div className="mt-6 px-6 py-2 bg-[#31748f] text-white border-4 border-[#191724] text-sm font-pixel uppercase tracking-widest">
            {isSpeaking ? "Speaking" : "Idle"}
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 w-full flex flex-col bg-[#1f1d2e] border-4 border-[#191724] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 min-h-[400px] max-h-[60vh] bg-[#191724]/30">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-[#26233a] px-4 py-2 border-4 border-[#191724] flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#ebbcba] animate-pulse" />
                  <span className="text-xs font-pixel text-[#908caa] uppercase tracking-tighter">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#191724] border-t-4 border-[#191724]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-4"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="TYPE YOUR QUESTION..."
                className="flex-1 px-6 py-4 bg-[#1f1d2e] border-4 border-[#191724] text-[#e0def4] focus:outline-none focus:border-[#ebbcba] transition-colors font-dotgothic uppercase placeholder:text-[#6e6a86]"
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

      {/* Footer */}
      <footer className="mt-12 text-[#6e6a86] text-[10px] font-pixel uppercase tracking-widest text-center">
        &copy; 2026 PIXEL CHATBOT // SYSTEM READY
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
