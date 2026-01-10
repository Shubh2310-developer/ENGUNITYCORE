'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Zap, Shield, Code2, MessageSquare, ChevronRight } from 'lucide-react';
import { useCodeStore } from '@/stores/codeStore';
import styles from '../../app/(dashboard)/code/codelab.module.css';

export const AIRefinePanel = () => {
  const { isAIRefineOpen, setAIRefineOpen, runCommand } = useCodeStore();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I have analyzed your current workspace. The `generator.py` file could benefit from some optimizations.' },
  ]);

  if (!isAIRefineOpen) return null;

  const suggestions = [
    { icon: Zap, label: 'Optimize performance', command: 'profile --file active' },
    { icon: Shield, label: 'Security audit', command: 'scan --vulnerabilities' },
    { icon: Code2, label: 'Refactor logic', command: 'refactor --suggest' },
  ];

  const handleSuggestionClick = (command: string) => {
    runCommand(command);
    setMessages(prev => [...prev, { role: 'user', content: `Run ${command}` }]);
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setPrompt('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I've started the analysis. You'll see the results in the console shortly."
      }]);
    }, 1000);
  };

  return (
    <div className={styles['chat-container']}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#E2E8F0] bg-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">Refine AI</span>
        </div>
        <button
          onClick={() => setAIRefineOpen(false)}
          className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors p-1 rounded"
          title="Close Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {/* Message History */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2 block">Message History</span>
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${m.role === 'user'
                    ? 'bg-[#2563EB] text-white ml-4'
                    : 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] mr-4'
                  }`}
              >
                {m.content}
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2 block">Contextual Actions</span>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.command)}
                className="flex items-center gap-3 w-full text-left p-3 bg-white border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors text-sm"
              >
                <s.icon className="w-4 h-4 text-[#2563EB]" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase">Pro Tip</span>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            I noticed your <code className="text-[#4F46E5] bg-[#EEF2FF] px-1 rounded">generate</code> function is synchronous.
            Consider wrapping it in an <code className="text-[#4F46E5] bg-[#EEF2FF] px-1 rounded">async</code> handler.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F1F5F9]">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to refine code..."
            className="w-full bg-white border border-[#E2E8F0] rounded-lg p-3 pr-12 text-sm text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none focus:border-[#2563EB] min-h-[72px]"
          />
          <button
            onClick={handleSend}
            className="absolute bottom-3 right-3 p-1.5 bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
