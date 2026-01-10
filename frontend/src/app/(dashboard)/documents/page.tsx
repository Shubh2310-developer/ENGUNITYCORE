import React from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Clock,
  HardDrive,
  Database,
  Cloud
} from 'lucide-react';

export default function DocumentsPage() {
  const documents = [
    { name: 'System_Architecture_v2.pdf', size: '4.2 MB', type: 'PDF', modified: '2h ago', location: 'Local' },
    { name: 'Training_Dataset_Metadata.json', size: '128 KB', type: 'JSON', modified: '5h ago', location: 'Vector Grid' },
    { name: 'Neural_Weights_E5_Final.bin', size: '1.4 GB', type: 'BIN', modified: 'Yesterday', location: 'Cloud Storage' },
    { name: 'Research_Whitepaper_Draft.docx', size: '842 KB', type: 'DOCX', modified: '3 days ago', location: 'Local' },
    { name: 'API_Contract_v1.yaml', size: '12 KB', type: 'YAML', modified: '1 week ago', location: 'Local' },
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="uppercase font-mono tracking-tighter">Document Vault</h2>
          <p className="text-starlight-400 text-body-large font-medium">Secure repository for neural datasets and research assets.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-ghost px-6 py-3 flex items-center gap-3 font-black tracking-widest border border-white/10">
            <Filter className="w-5 h-5" />
            Filter
          </button>
          <button className="btn-reactor px-8 py-3 flex items-center gap-3 font-black tracking-widest shadow-lg">
            <Plus className="w-6 h-6" />
            Ingest Files
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 flex-1 overflow-hidden">
        {/* Storage Stats */}
        <div className="col-span-3 space-y-8">
          <div className="glass-card border-white/5 p-8 space-y-8 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-mono-label text-starlight-400/50 font-black tracking-[0.4em]">Storage_Allocation</h3>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <HardDrive className="w-5 h-5 text-primary" />
                     <span className="text-body font-bold text-white">Total Capacity</span>
                  </div>
                  <span className="text-mono-label font-black text-starlight-400">2.0 TB</span>
               </div>
               <div className="h-2 w-full bg-void-900 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary w-[64%] shadow-[0_0_12px_rgba(45,212,191,0.6)]" />
               </div>
               <p className="text-mono-label text-starlight-400/40 text-center font-black">1.28 TB / 2.0 TB Utilized</p>
            </div>
            <div className="pt-6 border-t border-white/10 space-y-4">
               {[
                 { label: 'Local Mesh', size: '420 GB', color: 'bg-primary' },
                 { label: 'Vector Grid', size: '124 GB', color: 'bg-cyber-sky' },
                 { label: 'Cloud Buffer', size: '736 GB', color: 'bg-white/20' },
               ].map(item => (
                 <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm`} />
                       <span className="text-mono-label text-starlight-400 font-black">{item.label}</span>
                    </div>
                    <span className="text-mono-label text-white font-black">{item.size}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="glass-card border-white/5 p-8 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-mono-label text-starlight-400/50 font-black tracking-[0.4em] mb-8">Quick_Connect</h3>
            <div className="space-y-3">
               {[
                 { label: 'GitHub Repo', icon: Database, connected: true },
                 { label: 'S3 Bucket', icon: Cloud, connected: false },
                 { label: 'Local RAID', icon: HardDrive, connected: true },
               ].map(service => (
                 <button key={service.label} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4">
                       <service.icon className="w-5 h-5 text-starlight-400" />
                       <span className="text-body font-bold text-white">{service.label}</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${service.connected ? 'bg-primary shadow-[0_0_8px_rgba(45,212,191,0.6)]' : 'bg-starlight-400/20'}`} />
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="col-span-9 glass-card border-white/5 p-0 flex flex-col overflow-hidden group shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 border-b border-white/10 bg-void-800/50 flex items-center justify-between">
            <div className="relative w-[500px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-starlight-400/40" />
               <input
                 type="text"
                 placeholder="Search documents by name, type, or node..."
                 className="w-full bg-void-900/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-body text-white placeholder:text-starlight-400/30 focus:outline-none focus:border-primary/50 transition-all font-mono shadow-inner"
               />
            </div>
            <div className="flex items-center gap-5">
               <span className="text-mono-label font-black text-primary italic tracking-[0.3em]">Indexing: Live</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="border-b border-white/10 text-mono-label text-starlight-400/50 text-left bg-void-800/20">
                     <th className="px-10 py-6 font-black">Filename</th>
                     <th className="px-10 py-6 font-black">Size</th>
                     <th className="px-10 py-6 font-black">Location</th>
                     <th className="px-10 py-6 font-black text-right">Modified</th>
                     <th className="px-10 py-6 font-black text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/10">
                  {documents.map((doc, i) => (
                    <tr key={i} className="group/row hover:bg-white/[0.03] transition-colors">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-xl bg-void-900 border border-white/10 flex items-center justify-center font-mono group-hover/row:border-primary/40 transition-colors shadow-sm">
                                <span className="text-mono-label text-primary font-black">{doc.type}</span>
                             </div>
                             <span className="text-body-large font-black text-white group-hover/row:text-primary transition-colors">{doc.name}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6 text-body font-mono text-starlight-400">{doc.size}</td>
                       <td className="px-10 py-6">
                          <span className="text-mono-label font-black px-3 py-1.5 rounded-lg bg-white/5 text-starlight-400 border border-white/10 shadow-sm">{doc.location}</span>
                       </td>
                       <td className="px-10 py-6 text-body font-mono text-starlight-400/60 text-right">{doc.modified}</td>
                       <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all transform translate-x-2 group-hover/row:translate-x-0">
                             <button className="p-2.5 hover:text-primary transition-colors bg-white/5 rounded-lg border border-white/5"><Download className="w-5 h-5" /></button>
                             <button className="p-2.5 hover:text-primary transition-colors bg-white/5 rounded-lg border border-white/5"><Share2 className="w-5 h-5" /></button>
                             <button className="p-2.5 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5"><Trash2 className="w-5 h-5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-white/10 bg-void-800/50 flex justify-between items-center px-10">
             <p className="text-mono-label text-starlight-400/40 font-black tracking-[0.3em]">Displaying 5 of 124 Assets</p>
             <div className="flex gap-3">
                <button className="px-5 py-2 rounded-lg border border-white/10 text-mono-label font-black text-starlight-400 hover:text-white transition-colors hover:bg-white/5">Prev</button>
                <button className="px-5 py-2 rounded-lg border border-primary/30 text-mono-label font-black text-white bg-primary/10">1</button>
                <button className="px-5 py-2 rounded-lg border border-white/10 text-mono-label font-black text-starlight-400 hover:text-white transition-colors hover:bg-white/5">Next</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
