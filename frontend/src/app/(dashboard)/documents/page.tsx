'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { documentService, Document } from '@/services/document';
import { useAuthStore } from '@/stores/authStore';
import {
  FileText, Search, Plus, Grid, List as ListIcon,
  MoreVertical, Clock, User, Hash, ArrowUpRight,
  Sparkles, BookOpen, Settings, Layout, FileCode,
  FileSearch, Archive, CheckCircle2, AlertCircle,
  Link2, Share2, Download, History, ChevronRight,
  Filter, Star, PlusCircle, X, Loader2
} from 'lucide-react';
import styles from './documents.module.css';

// --- Types ---

type DocType = 'note' | 'research' | 'spec' | 'report';
type DocStatus = 'draft' | 'review' | 'final' | 'archived';

// --- Sub-components ---

const TypeSelectionModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const types = [
    {
      id: 'note',
      title: 'Note',
      description: 'Lightweight, exploratory thinking and quick capture.',
      icon: <FileText size={24} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      useCases: 'Meeting notes, brainstorming, quick thoughts.'
    },
    {
      id: 'research',
      title: 'Research Draft',
      description: 'Structured academic and professional research with citations.',
      icon: <BookOpen size={24} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      useCases: 'Academic papers, literature reviews, proposals.'
    },
    {
      id: 'spec',
      title: 'Technical Spec',
      description: 'Engineering documentation and technical decision records.',
      icon: <FileCode size={24} />,
      color: 'text-green-600',
      bg: 'bg-green-50',
      useCases: 'API docs, architecture records, feature specs.'
    },
    {
      id: 'report',
      title: 'Report / Output',
      description: 'Polished, delivery-ready professional documents.',
      icon: <Layout size={24} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      useCases: 'Client deliverables, executive summaries, final submissions.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalOverlay} onClick={onClose}>
          <motion.div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create New Document</h2>
                <p className="text-sm text-slate-500 mt-1">Select a type to optimize your writing environment</p>
              </div>
              <button onClick={onClose} className={styles.iconBtn}><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {types.map((type) => (
                <Link href={`/documents/new?type=${type.id}`} key={type.id} className="no-underline">
                  <div className={styles.typeCard}>
                    <div className={`${styles.typeIconLarge} ${type.bg} ${type.color}`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1">{type.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{type.description}</p>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Examples: {type.useCases}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const StatusBadge = ({ status }: { status: DocStatus }) => {
  const labels: Record<DocStatus, string> = {
    draft: 'Draft',
    review: 'In Review',
    final: 'Final',
    archived: 'Archived'
  };

  const classNames: Record<DocStatus, string> = {
    draft: styles.badgeDraft,
    review: styles.badgeReview,
    final: styles.badgeFinal,
    archived: styles.badgeArchived
  };

  return (
    <span className={`${styles.badge} ${classNames[status]}`}>
      {status === 'final' && <CheckCircle2 size={12} className="mr-1" />}
      {status === 'review' && <Clock size={12} className="mr-1" />}
      {labels[status]}
    </span>
  );
};

const TypeIcon = ({ type }: { type: DocType }) => {
  switch (type) {
    case 'note': return <FileText size={18} />;
    case 'research': return <BookOpen size={18} />;
    case 'spec': return <FileCode size={18} />;
    case 'report': return <Layout size={18} />;
  }
};

const TypeBadge = ({ type }: { type: DocType }) => {
  const labels: Record<DocType, string> = {
    note: 'Note',
    research: 'Research',
    spec: 'Technical Spec',
    report: 'Report'
  };

  const classNames: Record<DocType, string> = {
    note: styles.typeNote,
    research: styles.typeResearch,
    spec: styles.typeSpec,
    report: styles.typeReport
  };

  return (
    <span className={`${styles.badge} ${classNames[type]}`}>
      <div className="mr-1.5"><TypeIcon type={type} /></div>
      {labels[type]}
    </span>
  );
};

// --- Main Page Component ---

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Documents', icon: FileText },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared', icon: Share2 },
    { id: 'archived', label: 'Archived', icon: Archive }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'recent') {
      const diffInDays = (new Date().getTime() - new Date(doc.updated_at).getTime()) / (1000 * 3600 * 24);
      return diffInDays < 7;
    }
    if (activeTab === 'archived') return doc.status === 'archived';
    // Starred and shared are not yet implemented in backend, so showing all for now if those tabs are selected
    return true;
  });

  return (
    <div className={styles['documents-theme']}>
      {/* Top Header */}
      <header className={styles.topNav}>
        <div className={styles.topNavLeft}>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileSearch size={20} />
            </div>
            <span className={styles.topNavTitle}>Knowledge Hub</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <nav className="flex gap-6">
            <button className={styles.topNavLink}>Workspaces</button>
            <button className={styles.topNavLink}>Templates</button>
            <button className={styles.topNavLink}>Exports</button>
          </nav>
        </div>

        <div className={styles.topNavRight}>
          <button className={styles.iconBtn} title="Settings">
            <Settings size={20} />
          </button>
          <button className={styles.btnPrimary} onClick={() => setIsTypeModalOpen(true)}>
            <PlusCircle size={18} />
            New Document
          </button>
        </div>
      </header>

      <TypeSelectionModal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} />

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabItem} ${activeTab === tab.id ? styles.active : ''}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* AI Assistant Insight (Premium Feature) */}
          <div className={styles.aiAssistant}>
            <div className={styles.aiIconWrapper}>
              <Sparkles className="text-blue-600" size={20} />
            </div>
            <div className={styles.aiContent}>
              <h4>Intelligent Document Analysis</h4>
              <p>
                I can help you analyze your documents and suggest improvements or find related information.
                Try uploading some files or creating a new research draft.
              </p>
            </div>
            <button className="ml-auto flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
              Explore Insights <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Library Toolbar */}
          <div className={styles.libraryHeader}>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search documents or content..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ListIcon size={18} />
                </button>
              </div>
              <button className={styles.btnSecondary} onClick={fetchDocuments}>
                <History size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Document Content */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-600" />
                <p>Loading your knowledge hub...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <button onClick={fetchDocuments} className="mt-4 text-blue-600 font-bold hover:underline">
                  Try Again
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.gridContainer}
              >
                {filteredDocuments.map((doc) => (
                  <Link href={`/documents/${doc.id}`} key={doc.id} className="no-underline">
                    <motion.div
                      layout
                      className={styles.docCard}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={styles.docCardHeader}>
                        <TypeBadge type={doc.type as DocType} />
                        <button className={styles.iconBtn} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <MoreVertical size={18} />
                        </button>
                      </div>

                      <div>
                        <h3 className={styles.docTitle}>{doc.title}</h3>
                        <p className={styles.docPreview}>
                          {doc.content ? (doc.content.substring(0, 120) + (doc.content.length > 120 ? '...' : '')) : (doc.filename || 'No content')}
                        </p>
                      </div>

                      <div className={styles.docFooter}>
                        <div className={styles.docMeta}>
                          <div className={styles.docMetaItem}>
                            <User size={12} /> {user?.full_name || user?.username || 'You'}
                          </div>
                          <div className={styles.docMetaItem}>
                            <Clock size={12} /> {formatDate(doc.updated_at)}
                          </div>
                        </div>
                        <StatusBadge status={doc.status as DocStatus} />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.listView}
              >
                <div className={`${styles.listRow} ${styles.listHeader}`}>
                  <div>Title</div>
                  <div>Type</div>
                  <div>Status</div>
                  <div>Last Edited</div>
                  <div></div>
                </div>
                {filteredDocuments.map((doc) => (
                  <Link href={`/documents/${doc.id}`} key={doc.id} className="no-underline">
                    <div className={styles.listRow}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${styles[`type${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}`]}`}>
                          <TypeIcon type={doc.type as DocType} />
                        </div>
                        <span className="font-bold text-slate-900">{doc.title}</span>
                      </div>
                      <div><TypeBadge type={doc.type as DocType} /></div>
                      <div><StatusBadge status={doc.status as DocStatus} /></div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Clock size={14} /> {formatDate(doc.updated_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button className={styles.iconBtn} title="Download" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><Download size={16} /></button>
                        <button className={styles.iconBtn} title="Share" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><Share2 size={16} /></button>
                        <button className={styles.iconBtn} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><MoreVertical size={16} /></button>
                      </div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State Illustration if no docs */}
          {!loading && filteredDocuments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileSearch size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No documents found matching your search' : 'Your knowledge hub is empty'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => {setSearchQuery(''); setActiveTab('all');}}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              ) : (
                <button
                  onClick={() => setIsTypeModalOpen(true)}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Create your first document
                </button>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default DocumentsPage;
