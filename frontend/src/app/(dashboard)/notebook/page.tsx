import React from 'react';
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Tag,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react';

export default function NotebookPage() {
  const notes = [
    { title: 'Neural Architecture Analysis', date: 'Jan 04, 2026', tags: ['Research', 'AI'], excerpt: 'Initial findings on the latent space distribution of the current model...' },
    { title: 'Vector Database Optimization', date: 'Jan 02, 2026', tags: ['Backend', 'Perf'], excerpt: 'Sharding strategies for the production cluster to reduce latency...' },
    { title: 'Atlas Design System v2.1', date: 'Dec 28, 2025', tags: ['UI/UX', 'Design'], excerpt: 'Transitioning from Purple to Cyan Protocol for better accessibility...' },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="uppercase font-mono tracking-tighter">Researcher Notebook</h2>
          <p className="text-starlight-400 text-body-large font-medium">Capture insights and document progress within the mesh.</p>
        </div>
        <button className="btn-reactor px-8 py-4 flex items-center gap-3 text-secondary font-black tracking-widest shadow-lg">
          <Plus className="w-6 h-6" />
          New Entry
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-10 overflow-hidden">
        {/* Sidebar / Folders */}
        <div className="col-span-3 space-y-8 overflow-y-auto">
          <div className="glass-card border-white/5 p-6 group relative overflow-hidden shadow-xl">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-starlight-400/40" />
               <input
                 type="text"
                 placeholder="Search entries..."
                 className="w-full bg-void-900/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-body text-white placeholder:text-starlight-400/30 focus:outline-none focus:border-primary/50 transition-all font-mono shadow-inner"
               />
             </div>
          </div>

          <div className="glass-card border-white/5 flex flex-col p-6 shadow-xl">
            <span className="text-mono-label font-black text-starlight-400/50 tracking-[0.3em] mb-6">Directories</span>
            <div className="space-y-2">
              {[
                { label: 'All Entries', count: 12, active: true },
                { label: 'Research Papers', count: 4 },
                { label: 'Technical Specs', count: 5 },
                { label: 'Personal Drafts', count: 3 },
                { label: 'Archive', count: 28 },
              ].map((folder) => (
                <div
                  key={folder.label}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-body cursor-pointer transition-all ${
                    folder.active ? 'bg-primary/10 text-primary font-black shadow-sm' : 'text-starlight-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                    <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-body">{folder.label}</span>
                  </div>
                  <span className="text-mono-label font-black opacity-50">{folder.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-9 glass-card border-white/5 p-0 flex flex-col overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
          <div className="p-6 border-b border-white/5 bg-void-800/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-mono-label font-black text-white italic tracking-widest">Recent_Entries</span>
              <div className="h-4 w-[1px] bg-white/5" />
              <div className="flex items-center gap-2 text-starlight-400/40">
                <Clock className="w-4 h-4" />
                <span className="text-mono-label">Auto-saved 2m ago</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 gap-6">
              {notes.map((note, i) => (
                <div key={i} className="glass-card border-white/10 hover:border-primary/30 p-6 flex flex-col gap-4 group/item cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      {note.tags.map(tag => (
                        <span key={tag} className="text-mono-label px-2 py-1 rounded bg-white/5 text-starlight-400 group-hover/item:text-primary transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="text-starlight-400/40 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-body-large font-black text-white mb-2 group-hover/item:text-primary transition-colors">{note.title}</h3>
                    <p className="text-body text-starlight-400/60 line-clamp-2 leading-relaxed italic">{"\""}{note.excerpt}{"\""}</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2 text-starlight-400/40">
                      <Calendar className="w-3 h-3" />
                      <span className="text-mono-label">{note.date}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
              <div className="glass-card border-dashed border-white/10 hover:border-primary/30 flex flex-col items-center justify-center gap-4 py-12 group/new cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover/new:bg-primary/10 transition-colors">
                  <Plus className="w-6 h-6 text-starlight-400 group-hover/new:text-primary transition-colors" />
                </div>
                <p className="text-mono-label font-black italic tracking-widest text-starlight-400 group-hover/new:text-white transition-colors">Initialize_New_Entry</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
