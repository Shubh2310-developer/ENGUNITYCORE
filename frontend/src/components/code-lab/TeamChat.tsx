import React, { useRef, useEffect, useState } from 'react';
import { useAgentTeam, AgentMessage } from '@/hooks/useAgentTeam';
import styles from '@/app/(dashboard)/code/codelab.module.css';
import { Send, Bot, User, Terminal, CheckCircle, AlertCircle } from 'lucide-react';

export function TeamChat() {
  const { state, sendMessage } = useAgentTeam();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'user': return <User className="w-3.5 h-3.5" />;
      case 'agent-lead': return <Bot className="w-3.5 h-3.5 text-blue-600" />;
      case 'agent-coder': return <Terminal className="w-3.5 h-3.5 text-amber-600" />;
      case 'agent-reviewer': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'system': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getAgentBadge = (role: string) => {
    const badgeStyles: Record<string, string> = {
      'user': 'bg-slate-100 text-slate-700 border-slate-200',
      'agent-lead': 'bg-blue-50 text-blue-700 border-blue-100',
      'agent-coder': 'bg-amber-50 text-amber-700 border-amber-100',
      'agent-reviewer': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'system': 'bg-red-50 text-red-700 border-red-100',
    };
    return badgeStyles[role] || 'bg-slate-50 text-slate-500 border-slate-100';
  };

  return (
    <div className={styles['chat-container']}>
      <div className={styles['chat-header']} style={{ justifyContent: 'flex-end' }}>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${
          state.status === 'IDLE' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          state.status === 'PLANNING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
          state.status === 'IMPLEMENTING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          state.status === 'REVIEWING' ? 'bg-purple-50 text-purple-700 border-purple-200' :
          state.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          {state.status}
        </span>
      </div>

      <div className={styles['chat-messages']}>
        {state.messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm opacity-60 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <Bot className="w-6 h-6" />
            </div>
            <p className="font-medium text-slate-600 mb-1">Collaborative AI Team</p>
            <p className="text-xs">Agents will discuss planning, coding, and review steps here as they work.</p>
          </div>
        )}

        {state.messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles['chat-bubble']} ${msg.from === 'user' ? styles['chat-bubble-user'] : styles['chat-bubble-ai']} shadow-sm border border-black/5`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getAgentBadge(msg.from)}`}>
                {getAgentIcon(msg.from)}
                <span>{msg.from.replace('agent-', '')}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">to {msg.to}</span>
            </div>
            <div className="text-[12px] leading-relaxed font-medium text-inherit">{msg.content || JSON.stringify(msg.payload)}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles['chat-input-area']}>
        <div className="relative group">
          <textarea
            className={`${styles['chat-textarea']} focus:ring-2 focus:ring-blue-500/20 shadow-sm border-[#CBD5E1] transition-all`}
            placeholder="Assign a task to the team..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
