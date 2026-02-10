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

      runCommand(`\r\n\x1b[36m[AI ${action}]\x1b[0m ${result.response || 'Complete'}\r\n`);
      
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
      <div className="flex items-center justify-between p-3 border-b border-[#E2E8F0] bg-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#475569]">
            Refine AI {activeFile && `- ${activeFile.name}`}
          </span>
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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2 block">Conversation</span>
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${m.role === 'user'
                    ? 'bg-[#2563EB] text-white ml-4'
                    : 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] mr-4'
                  }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-[#64748B] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2 block">Quick Actions</span>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.action)}
                disabled={isProcessing || !activeFile}
                className="flex items-center gap-3 w-full text-left p-3 bg-white border border-[#E2E8F0] rounded-lg text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <s.icon className="w-4 h-4 text-[#2563EB]" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        {activeFile && (
          <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
              <FileCode className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Current File</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Language: <code className="text-[#4F46E5] bg-white px-1 rounded">{activeFile.language}</code>
              <br />
              Lines: <code className="text-[#4F46E5] bg-white px-1 rounded">{activeFile.content?.split('\n').length || 0}</code>
            </p>
          </div>
        )}
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
            disabled={isProcessing}
            placeholder={activeFile ? "Ask AI to help with your code..." : "Open a file to get started"}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg p-3 pr-12 text-sm text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none focus:border-[#2563EB] min-h-[72px] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isProcessing || !prompt.trim()}
            className="absolute bottom-3 right-3 p-1.5 bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-[#64748B] mt-2">
          💡 Tip: Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
