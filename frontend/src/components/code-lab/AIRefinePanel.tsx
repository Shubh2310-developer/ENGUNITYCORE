'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Zap, Shield, Code2, MessageSquare, ChevronRight, Loader2, BookOpen, Save, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCodeStore } from '@/stores/codeStore';
import { useRouter } from 'next/navigation';
import styles from '../../app/(dashboard)/code/codelab.module.css';

export const AIRefinePanel = () => {
  const router = useRouter();
  const { isAIRefineOpen, setAIRefineOpen, runCommand, files, activeFileId, updateFileContent, setNotification } = useCodeStore();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your AI coding assistant. I can help you optimize code, review security, refactor logic, and save decisions to your vault.' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImprovedCode, setLastImprovedCode] = useState<string | null>(null);

  if (!isAIRefineOpen) return null;

  const activeFile = files.find(f => f.id === activeFileId && f.type === 'file');

  const suggestions = [
    { icon: Zap, label: 'Optimize performance', action: 'optimize' },
    { icon: Shield, label: 'Security audit', action: 'security' },
    { icon: Code2, label: 'Refactor logic', action: 'refactor' },
    { icon: BookOpen, label: 'Explain code', action: 'explain' },
    { icon: Save, label: 'Save to Decision Vault', action: 'save-vault' },
  ];

  const handleSuggestionClick = async (action: string) => {
    if (!activeFile) {
      setNotification({ message: 'No file selected', type: 'error' });
      return;
    }

    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: `${action.charAt(0).toUpperCase() + action.slice(1)} this code` }]);

    try {
      if (action === 'save-vault') {
        // Navigate to Decision Vault with pre-filled data
        const title = `Code Decision: ${activeFile.name}`;
        const problem = `Architectural or implementation decision regarding ${activeFile.name}`;
        const context = `Language: ${activeFile.language}\n\nCode:\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``;
        
        router.push(`/decisionvault?source=code&title=${encodeURIComponent(title)}&problem=${encodeURIComponent(problem)}&context=${encodeURIComponent(context)}`);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '✅ Opening Decision Vault with your code context...' 
        }]);
        setIsProcessing(false);
        return;
      }

      // Call backend AI service
      const response = await fetch('http://localhost:8000/api/v1/code/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeFile.content,
          language: activeFile.language,
          action: action,
          filename: activeFile.name
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();

      if (result.improved_code) {
        setLastImprovedCode(result.improved_code);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.response || 'Analysis complete!'
      }]);

      // If optimization or refactoring, offer to apply changes
      if ((action === 'optimize' || action === 'refactor') && result.improved_code) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '💡 I\'ve generated improved code. Would you like me to apply these changes? Type "apply" to confirm.' 
        }]);
      }
      // NOTE: intentionally NOT calling runCommand() here.
      // AI responses must stay in the AI panel only and must never
      // be written to the terminal xterm buffer.
      
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ ${error.message}. Make sure the backend is running.` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim() || isProcessing) return;
    
    const userMessage = prompt.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setPrompt('');
    setIsProcessing(true);

    try {
      // Check for special commands
      if (userMessage.toLowerCase() === 'apply' && activeFile) {
        if (lastImprovedCode) {
          updateFileContent(activeFile.id, lastImprovedCode);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '✅ Applied the suggested code changes to the editor.'
          }]);
          setNotification({ message: 'Code changes applied', type: 'success' });
          setLastImprovedCode(null);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ No improved code found to apply. Please use "Optimize" or "Refactor" first.'
          }]);
        }
        setIsProcessing(false);
        return;
      }

      if (!activeFile) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ Please open a file first to use AI assistance.' 
        }]);
        setIsProcessing(false);
        return;
      }

      // Call backend AI chat service
      const response = await fetch('http://localhost:8000/api/v1/code/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          code: activeFile.content,
          language: activeFile.language,
          filename: activeFile.name,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const result = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.response
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Unable to connect to AI service. Error: ${error.message}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles['chat-container']}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#CBD5E1] bg-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
            Refine AI {activeFile && `- ${activeFile.name}`}
          </span>
        </div>
        <button
          onClick={() => setAIRefineOpen(false)}
          className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-all p-1 rounded active:scale-95"
          title="Close Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white">
        {/* Message History */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3 block opacity-80">Workspace Conversation</span>
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-xl text-[13px] leading-relaxed shadow-sm transition-all border ${m.role === 'user'
                    ? 'bg-[#2563EB] text-white ml-6 border-[#2563EB]/10'
                    : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] mr-6'
                  }`}
              >
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-[#2563EB] text-[11px] font-bold uppercase tracking-tight ml-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="animate-pulse">AI is thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3 block opacity-80">Intelligent Actions</span>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.action)}
                disabled={isProcessing || !activeFile}
                className="flex items-center gap-3 w-full text-left p-3 bg-white border border-[#E2E8F0] rounded-xl text-[#475569] hover:bg-[#F8FAFC] hover:text-[#2563EB] hover:border-[#2563EB]/30 hover:shadow-md transition-all text-xs font-bold disabled:opacity-50 disabled:scale-100 group active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center group-hover:bg-white group-hover:text-[#2563EB] transition-colors border border-transparent group-hover:border-[#2563EB]/10">
                  <s.icon className="w-4 h-4" />
                </div>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        {activeFile && (
          <div className="p-4 bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.04)]">
            <div className="flex items-center gap-2 mb-2.5 text-[#2563EB]">
              <FileCode className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Active Context</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-[#1E40AF] font-bold flex justify-between">
                Language: <code className="bg-white/60 px-1.5 py-0.5 rounded border border-[#BFDBFE]/30 text-[#2563EB] font-mono">{activeFile.language}</code>
              </p>
              <p className="text-[11px] text-[#1E40AF] font-bold flex justify-between">
                Lines: <code className="bg-white/60 px-1.5 py-0.5 rounded border border-[#BFDBFE]/30 text-[#2563EB] font-mono">{activeFile.content?.split('\n').length || 0}</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#CBD5E1] bg-[#F1F5F9]">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isProcessing}
            placeholder={activeFile ? "Refine code, fix bugs, or explain..." : "Open a file to start AI chat"}
            className="w-full bg-white border border-[#CBD5E1] rounded-xl p-3.5 pr-14 text-[13px] text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 min-h-[84px] disabled:opacity-50 shadow-sm transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || !prompt.trim()}
            className="absolute bottom-4 right-4 p-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2.5 px-1">
          <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Shift+Enter for newline</span>
          <Zap className="w-3 h-3 text-[#2563EB] opacity-40" />
        </div>
      </div>
    </div>
  );
};
