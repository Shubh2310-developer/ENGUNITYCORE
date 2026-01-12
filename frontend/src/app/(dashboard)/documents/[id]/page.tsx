'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { documentService, Document } from '@/services/document';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft,
  Share2,
  MoreVertical,
  History,
  Sparkles,
  Search,
  BookOpen,
  FileCode,
  Layout,
  MessageSquare,
  List,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Link2,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import styles from './editor.module.css';

// --- Types ---

type DocStatus = 'draft' | 'review' | 'final' | 'archived';

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

const DocumentEditor = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') || 'note') as 'note' | 'research' | 'spec' | 'report';

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<DocStatus>('draft');
  const [docType, setDocType] = useState(initialType);

  const [activeTab, setActiveTab] = useState('ai');
  const [activeOutline, setActiveOutline] = useState('1');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [traceEntries, setTraceEntries] = useState<any[]>([]);

  useEffect(() => {
    if (params.id && params.id !== 'new') {
      fetchDocument();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const [data, traceData] = await Promise.all([
        documentService.getDocument(params.id),
        documentService.getThinkingTrace(params.id)
      ]);
      setDoc(data);
      setTitle(data.title);
      setContent(data.content || '');
      setStatus(data.status as DocStatus);
      setDocType(data.type as any);
      setIsLocked(data.status === 'final');
      setTraceEntries(traceData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!params.id || params.id === 'new') return;
    try {
      setSaving(true);
      const updated = await documentService.updateDocument(params.id, {
        title,
        content,
        type: docType,
        status
      });
      setDoc(updated);
      const traceEntry = await documentService.addThinkingTrace(params.id, 'Changes Saved', 'save');
      setTraceEntries(prev => [traceEntry, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const updated = await documentService.updateDocument(params.id, {
        status: 'final'
      });
      setDoc(updated);
      setStatus('final');
      setIsLocked(true);
      const traceEntry = await documentService.addThinkingTrace(params.id, 'Document Finalized', 'final');
      setTraceEntries(prev => [traceEntry, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to finalize document');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setSaving(true);
      const updated = await documentService.updateDocument(params.id, {
        status: 'draft'
      });
      setDoc(updated);
      setStatus('draft');
      setIsLocked(false);
      setShowUnlockModal(false);
      const traceEntry = await documentService.addThinkingTrace(params.id, 'Document Unlocked', 'unlock');
      setTraceEntries(prev => [traceEntry, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to unlock document');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = async (newType: string) => {
    if (isLocked || docType === newType) return;
    setDocType(newType as any);
    if (params.id !== 'new') {
      try {
        await documentService.updateDocument(params.id, { type: newType });
        const traceEntry = await documentService.addThinkingTrace(params.id, `Converted to ${newType}`, 'edit');
        setTraceEntries(prev => [traceEntry, ...prev]);
      } catch (err) {}
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading your document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Document</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link href="/documents">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
            Back to Library
          </button>
        </Link>
      </div>
    );
  }

  const getTypeSuggestions = (type: string) => {
    switch (type) {
      case 'research':
        return [
          { text: "Verify citation formatting", icon: <BookOpen size={14} /> },
          { text: "Identify claims needing citations", icon: <Sparkles size={14} /> },
          { text: "Check argument logical flow", icon: <List size={14} /> }
        ];
      case 'spec':
        return [
          { text: "Validate API endpoint structure", icon: <FileCode size={14} /> },
          { text: "Identify implementation risks", icon: <AlertCircle size={14} /> },
          { text: "Generate test cases", icon: <CheckCircle2 size={14} /> }
        ];
      case 'report':
        return [
          { text: "Improve professional tone", icon: <Layout size={14} /> },
          { text: "Generate executive summary", icon: <Sparkles size={14} /> },
          { text: "Check consistency", icon: <CheckCircle2 size={14} /> }
        ];
      default:
        return [
          { text: "Improve clarity of section", icon: <Sparkles size={14} /> },
          { text: "Make more concise", icon: <Sparkles size={14} /> },
          { text: "Fix grammar & punctuation", icon: <CheckCircle2 size={14} /> }
        ];
    }
  };

  const suggestions = getTypeSuggestions(docType);

  // Status Badge Component
  const StatusBadge = ({ currentStatus }: { currentStatus: DocStatus }) => {
    const classMap = {
      draft: styles.badgeDraft,
      review: styles.badgeReview,
      final: styles.badgeFinal,
      archived: styles.badgeArchived
    };

    const labelMap = {
      draft: 'Drafting',
      review: 'In Review',
      final: 'Finalized',
      archived: 'Archived'
    };

    return (
      <span className={`${styles.badge} ${classMap[currentStatus]}`}>
        {currentStatus === 'final' ? <CheckCircle2 size={12} className="mr-1.5" /> : <Clock size={12} className="mr-1.5" />}
        {labelMap[currentStatus]}
        {isLocked && <Lock size={10} className="ml-1.5 opacity-60" />}
      </span>
    );
  };

  const TypeSelector = () => {
    const types = [
      { id: 'note', label: 'Note', icon: <MessageSquare size={12} />, color: 'text-blue-600' },
      { id: 'research', label: 'Research', icon: <BookOpen size={12} />, color: 'text-purple-600' },
      { id: 'spec', label: 'Spec', icon: <FileCode size={12} />, color: 'text-green-600' },
      { id: 'report', label: 'Report', icon: <Layout size={12} />, color: 'text-amber-600' }
    ];

    return (
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-2">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTypeChange(t.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
              docType === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
            title={`Convert to ${t.label}`}
            disabled={isLocked}
          >
            {t.icon}
            <span className="hidden lg:inline">{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles['editor-theme']}>
      {/* Editor Header */}
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <Link href="/documents">
            <button className={styles.backBtn} title="Back to Library">
              <ChevronLeft size={20} />
            </button>
          </Link>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <input
            type="text"
            className={styles.docTitleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            disabled={isLocked}
          />
          <StatusBadge currentStatus={status} />
          <TypeSelector />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mr-4">
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin text-blue-500" />
                SAVING...
              </>
            ) : (
              <>
                <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                {isLocked ? 'FINALIZED' : 'SAVED TO HUB'}
              </>
            )}
          </div>
          {!isLocked && (
            <button
              className={styles.backBtn}
              title="Save Changes"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} className={saving ? 'text-slate-300' : ''} />
            </button>
          )}
          <button
            className={`${styles.backBtn} ${isFocusMode ? 'text-blue-600 bg-blue-50' : ''}`}
            title="Focus Mode"
            onClick={() => setIsFocusMode(!isFocusMode)}
          >
            <Layout size={18} />
          </button>
          <button className={styles.backBtn} title="Version History">
            <History size={18} />
          </button>
          <button className={styles.backBtn} title="Share Document">
            <Share2 size={18} />
          </button>
          {isLocked ? (
            <button
              className={`${styles.backBtn} bg-slate-100 text-slate-600 hover:bg-slate-200 ml-2`}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
              onClick={() => setShowUnlockModal(true)}
              disabled={saving}
            >
              <Unlock size={14} className="mr-2" />
              <span className="text-xs font-bold">Unlock</span>
            </button>
          ) : (
            <button
              className={`${styles.backBtn} bg-blue-600 text-white hover:bg-blue-700 ml-2`}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}
              onClick={handlePublish}
              disabled={saving}
            >
              <span className="text-xs font-bold">Publish</span>
            </button>
          )}
          <button className={styles.backBtn}>
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Unlock Confirmation Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className={styles.modalOverlay} onClick={() => setShowUnlockModal(false)}>
            <motion.div
              className={styles.modalContent}
              style={{ maxWidth: '400px' }}
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <Unlock size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Unlock Document?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  This document is currently finalized. Unlocking it will move it back to draft status and allow editing. This action will be logged in the thinking trace.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                    onClick={() => setShowUnlockModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                    onClick={handleUnlock}
                    disabled={saving}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirm Unlock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={styles.layoutContainer}>
        {/* Left Sidebar - Outline (Placeholder logic) */}
        <aside className={styles.leftSidebar}>
          <h3 className={styles.sidebarTitle}>Document Outline</h3>
          <div className="space-y-1">
            <div
              className={`${styles.outlineItem} ${styles.outlineItemActive}`}
            >
              <List size={14} className="text-blue-600" />
              {title || 'Untitled Document'}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <h3 className={styles.sidebarTitle}>Linked Context</h3>
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 p-2 italic">
                No context linked yet
              </div>
              <button className="w-full mt-2 text-[10px] font-bold text-blue-600 py-2 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50">
                + ADD REFERENCE
              </button>
            </div>
          </div>
        </aside>

        {/* Center Column - Writing Area */}
        <main className={styles.centerColumn}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${styles.canvas} ${isLocked ? 'opacity-90' : ''}`}
          >
            {isLocked && (
              <div className="absolute top-4 right-8 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 z-10">
                <Lock size={12} /> Read Only
              </div>
            )}
            <textarea
              className={`${styles.editableArea} w-full h-full resize-none border-none outline-none bg-transparent font-serif text-lg leading-relaxed`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              placeholder="Start writing your knowledge artifact..."
              disabled={isLocked}
              style={{ minHeight: '80vh' }}
            />
          </motion.div>
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside className={styles.rightSidebar}>
          <div className={styles.tabs}>
            <div
              className={`${styles.tab} ${activeTab === 'ai' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              AI ASSISTANT
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              CHAT
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'trace' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('trace')}
            >
              TRACE
            </div>
          </div>

          <div className={styles.aiPanel}>
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className={styles.aiMessage}>
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={14} />
                    {docType === 'research' ? 'Research Insight' : docType === 'spec' ? 'Technical Audit' : 'Context Insight'}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {docType === 'research'
                      ? "I can analyze your methodology and cross-reference claims with available research papers."
                      : docType === 'spec'
                      ? "I can audit your technical specification for ambiguity or missing edge cases."
                      : "I can pull in benchmarks and data points from your recent work to enrich this note."
                    }
                  </p>
                  <button className="mt-3 flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                    Get AI Analysis <ArrowRight size={12} />
                  </button>
                </div>

                <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Writing Suggestions</h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2"
                        disabled={isLocked}
                      >
                        <span className="text-blue-500 opacity-60">{suggestion.icon}</span>
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No chat history for this doc</p>
                <p className="text-[11px] mt-1">Start a conversation to see it here</p>
              </div>
            )}

            {activeTab === 'trace' && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thinking Trace</h4>
                <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                  {traceEntries.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No trace entries yet</p>
                  ) : (
                    traceEntries.map((entry) => (
                      <div key={entry.id} className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 border-white ${
                          entry.event_type === 'final' ? 'bg-green-500' :
                          entry.event_type === 'unlock' ? 'bg-amber-500' :
                          entry.event_type === 'ai_suggestion' ? 'bg-blue-600' :
                          entry.event_type === 'save' ? 'bg-blue-300' :
                          entry.event_type === 'create' ? 'bg-slate-300' : 'bg-purple-500'
                        }`}></div>
                        <p className="text-[11px] font-bold text-slate-900">{entry.event}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })} • You
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className={styles.aiPromptBox}>
              <textarea
                className={styles.promptInput}
                placeholder={isLocked ? "Unlock document to ask AI for changes..." : "Ask AI to help with this document..."}
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isLocked}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600" disabled={isLocked}><Sparkles size={16} /></button>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600" disabled={isLocked}><Link2 size={16} /></button>
                </div>
                <button
                  className={`${isLocked ? 'bg-slate-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white p-1.5 rounded-lg transition-colors`}
                  disabled={isLocked}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DocumentEditor;
