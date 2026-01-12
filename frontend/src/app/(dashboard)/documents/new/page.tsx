'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { documentService } from '@/services/document';
import {
  ChevronLeft,
  FileText,
  BookOpen,
  FileCode,
  Layout,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import styles from '../documents.module.css';

const NewDocumentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || 'note';

  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeInfo = {
    note: { label: 'Note', icon: <FileText size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    research: { label: 'Research Draft', icon: <BookOpen size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    spec: { label: 'Technical Spec', icon: <FileCode size={24} />, color: 'text-green-600', bg: 'bg-green-50' },
    report: { label: 'Report / Output', icon: <Layout size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  }[typeParam as string] || { label: 'Document', icon: <FileText size={24} />, color: 'text-slate-600', bg: 'bg-slate-50' };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const newDoc = await documentService.createDocument({
        title: title.trim(),
        type: typeParam,
        status: 'draft',
        content: ''
      });
      router.push(`/documents/${newDoc.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create document');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/documents" className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors mb-8 no-underline font-medium">
          <ChevronLeft size={18} />
          Back to Library
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-3 rounded-2xl ${typeInfo.bg} ${typeInfo.color}`}>
              {typeInfo.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New {typeInfo.label}</h1>
              <p className="text-slate-500 text-sm">Give your document a starting title</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                autoFocus
                placeholder="e.g., Project Phoenix Architecture"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isCreating || !title.trim()
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
              }`}
            >
              {isCreating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  CREATING DOCUMENT...
                </>
              ) : (
                <>
                  INITIALIZE KNOWLEDGE <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50">
            <div className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <Sparkles size={16} className="text-blue-500 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>AI Tip:</strong> As you write, I'll provide real-time {typeParam === 'research' ? 'citation' : typeParam === 'spec' ? 'technical audit' : 'context'} insights based on the document type you've selected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDocumentPage;
