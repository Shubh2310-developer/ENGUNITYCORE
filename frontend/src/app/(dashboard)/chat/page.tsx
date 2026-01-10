'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Settings,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  Trash2,
  Plus,
  Search,
  MessageCircle,
  Clock,
  User,
  Bot,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService, Message } from '@/services/chat';
import { documentService } from '@/services/document';
import styles from './chat.module.css';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isActive: boolean;
}

const CodeBlock = ({ children, lang }: { children: string, lang: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-all"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      {lang && (
        <div className="absolute left-3 -top-2.5 px-2 py-0.5 bg-slate-700 text-xs text-slate-400 font-mono rounded">
          {lang}
        </div>
      )}
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load latest session on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const sessions = await chatService.getSessions();
        if (sessions && sessions.length > 0) {
          // Map sessions to ChatSession format
          const formattedSessions: ChatSession[] = sessions.map((s: any, index: number) => ({
            id: s.id,
            title: s.title || `Chat ${index + 1}`,
            lastMessage: '',
            timestamp: new Date(s.updated_at || s.created_at || Date.now()),
            messageCount: s.message_count || 0,
            isActive: index === 0
          }));
          setChatSessions(formattedSessions);

          const latestSession = await chatService.getSession(sessions[0].id);
          setActiveSessionId(latestSession.id);
          if (latestSession.messages && latestSession.messages.length > 0) {
            setMessages(latestSession.messages);
          } else {
            setInitialMessage();
          }
        } else {
          setInitialMessage();
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setInitialMessage();
      } finally {
        setIsInitialLoading(false);
      }
    };

    initChat();
  }, []);

  const setInitialMessage = () => {
    setMessages([
      {
        role: 'assistant',
        content: '👋 Welcome to **Engunity AI Chat**!\n\nI\'m your AI assistant, ready to help with:\n\n- 💻 **Programming & Development** - Code architecture, debugging, best practices\n- 🏗️ **System Design** - Scalability, microservices, cloud platforms\n- 📊 **Data Engineering** - Database design, pipelines, analytics\n- 🔧 **DevOps** - CI/CD, containerization, infrastructure\n\nHow can I assist you today?',
        id: 'initial'
      }
    ]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(currentInput, activeSessionId || undefined);
      setMessages(prev => [...prev, response]);

      if (!activeSessionId) {
        const sessions = await chatService.getSessions();
        if (sessions.length > 0) {
          setActiveSessionId(sessions[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        id: Date.now().toString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const doc = await documentService.upload(file);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📄 **File uploaded successfully!**\n\n**Filename:** ${doc.filename}\n**Size:** ${(doc.size / 1024).toFixed(1)} KB\n\nI've indexed this document into your research context.`,
        id: Date.now().toString()
      }]);
    } catch (error) {
      console.error('Upload failed:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ File upload failed. Please verify the document format and size.',
        id: Date.now().toString()
      }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearCanvas = async () => {
    setIsLoading(true);
    try {
      const newSession = await chatService.createSession("New Conversation " + new Date().toLocaleTimeString());
      setActiveSessionId(newSession.id);
      setMessages([
        {
          role: 'assistant',
          content: '🧹 Chat cleared! How can I help you next?',
          id: Date.now().toString()
        }
      ]);
    } catch (error) {
      console.error('Failed to clear canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const newSession = await chatService.createSession("New Chat " + new Date().toLocaleTimeString());
      setActiveSessionId(newSession.id);
      setChatSessions(prev => [
        {
          id: newSession.id,
          title: 'New Chat',
          lastMessage: '',
          timestamp: new Date(),
          messageCount: 0,
          isActive: true
        },
        ...prev.map(s => ({ ...s, isActive: false }))
      ]);
      setInitialMessage();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const switchToSession = async (sessionId: string) => {
    try {
      const session = await chatService.getSession(sessionId);
      setActiveSessionId(sessionId);
      setChatSessions(prev => prev.map(s => ({
        ...s,
        isActive: s.id === sessionId
      })));
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
      } else {
        setInitialMessage();
      }
    } catch (error) {
      console.error('Failed to switch session:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const MarkdownComponents = {
    p: ({ children }: any) => <p className="text-slate-700 leading-relaxed mb-4 last:mb-0">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-xl font-bold text-slate-900 mb-4 mt-6">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold text-slate-900 mb-3 mt-5">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-bold text-slate-900 mb-2 mt-4">{children}</h3>,
    ul: ({ children }: any) => <ul className="space-y-2 mb-4 list-disc pl-5 text-slate-700">{children}</ul>,
    ol: ({ children }: any) => <ol className="space-y-2 mb-4 list-decimal pl-5 text-slate-700">{children}</ol>,
    li: ({ children }: any) => <li className="text-slate-700">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-slate-600">
        {children}
      </blockquote>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';

      if (inline) {
        return (
          <code className="text-slate-800 font-mono text-sm bg-slate-100 px-1.5 py-0.5 rounded" {...props}>
            {children}
          </code>
        );
      }

      return <CodeBlock lang={lang}>{String(children)}</CodeBlock>;
    }
  };

  if (isInitialLoading) {
    return (
      <div className={`${styles.chatTheme} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.chatTheme} flex h-screen overflow-hidden`}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={styles.sidebarTitle}>Chat History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`${styles.iconBtn} lg:hidden`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button onClick={createNewChat} className={styles.newChatBtn}>
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className={styles.sessionsList}>
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => switchToSession(session.id)}
                className={`${styles.sessionItem} ${session.isActive ? styles.sessionItemActive : ''}`}
              >
                <h3 className={styles.sessionTitle}>{session.title}</h3>
                <div className={styles.sessionMeta}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimestamp(session.timestamp)}
                  <span className="mx-1">•</span>
                  {session.messageCount} messages
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={styles.userName}>User</p>
            <p className={styles.userEmail}>user@example.com</p>
          </div>
          <button className={styles.iconBtn}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={styles.iconBtn}
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className={styles.headerLogo}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className={styles.headerTitle}>Neural Chat</h1>
              <p className={styles.headerSubtitle}>AI-powered assistance</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.statusBadge}>
              <span className={`${styles.statusDot} ${styles.statusLive}`}></span>
              <span>Live</span>
            </div>

            <button
              onClick={clearCanvas}
              className={`${styles.iconBtn} ${styles.deleteBtn}`}
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button className={styles.iconBtn}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className={styles.messagesContainer}>
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className={styles.messageBubble}>
              {msg.role === 'assistant' ? (
                <div className={styles.messageAssistant}>
                  <div className={styles.messageAvatar}>
                    <Bot className={styles.messageAvatarIcon} />
                  </div>
                  <div className={styles.messageAssistantContent}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {msg.content || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className={styles.messageUser}>
                  <div className={styles.messageUserContent}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className={styles.messageBubble}>
              <div className={styles.messageAssistant}>
                <div className={styles.messageAvatar}>
                  <Bot className={styles.messageAvatarIcon} />
                </div>
                <div className={styles.messageAssistantContent}>
                  <div className={styles.loadingDots}>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <div className={styles.inputBox}>
              <div className={styles.inputInner}>
                {/* File Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className={styles.hidden}
                />
                <div className={styles.inputActions}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={styles.inputActionBtn}
                    title="Upload file"
                  >
                    {isUploading ? <Loader2 className="animate-spin" /> : <Paperclip />}
                  </button>
                </div>

                {/* Text Input */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask anything about programming, engineering, or request code help..."
                  rows={1}
                  className={styles.inputTextarea}
                  disabled={isLoading}
                />

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={styles.sendBtn}
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                </button>
              </div>

              <div className={styles.inputFooter}>
                <div className={styles.inputHints}>
                  <span className={styles.kbd}>Enter</span>
                  <span>to send</span>
                  <span className="text-slate-300 mx-1">•</span>
                  <span className={styles.kbd}>Shift + Enter</span>
                  <span>for new line</span>
                </div>
                <div>
                  <span>{input.length} chars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
