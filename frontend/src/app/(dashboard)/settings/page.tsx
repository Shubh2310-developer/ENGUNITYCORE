import React from 'react';
import {
  User,
  Shield,
  Zap,
  Bell,
  Cpu,
  Database,
  Globe,
  Lock,
  Eye,
  Github,
  Key,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    {
      title: 'Researcher Profile',
      icon: User,
      description: 'Manage your identity and public metadata.',
      fields: [
        { label: 'Display Name', value: 'Researcher_01', type: 'text' },
        { label: 'Neural ID', value: '0x92f8d...4k', type: 'readonly' },
        { label: 'Bio', value: 'Sovereign researcher focusing on latent space distribution.', type: 'textarea' },
      ]
    },
    {
      title: 'Security Protocol',
      icon: Shield,
      description: 'Enhance your terminal access security.',
      fields: [
        { label: 'Multi-Factor Auth', value: 'Enabled', type: 'toggle' },
        { label: 'Session Timeout', value: '15 Minutes', type: 'select' },
        { label: 'Encryption Level', value: 'AES-256-GCM', type: 'readonly' },
      ]
    },
    {
      title: 'API & Integration',
      icon: Key,
      description: 'Connect your mesh to external nodes and repositories.',
      fields: [
        { label: 'GitHub Identity', value: 'Connected', type: 'button' },
        { label: 'OpenAI API Key', value: '••••••••••••••••', type: 'password' },
        { label: 'Local Node Path', value: '/usr/local/engunity/bin', type: 'text' },
      ]
    }
  ];

  return (
    <div className="max-w-[1720px] mx-auto space-y-12 pb-20">
      <div className="flex flex-col gap-3">
        <h2 className="uppercase font-mono tracking-tighter">Terminal Settings</h2>
        <p className="text-starlight-400 text-body-large font-medium">Configure your environment and security parameters.</p>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Navigation */}
        <div className="col-span-3">
          <div className="glass-card border-white/5 p-2 space-y-1 sticky top-8">
            {sections.map((section, i) => (
              <button
                key={i}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-mono-label font-bold transition-all ${
                  i === 0 ? 'bg-primary/10 text-primary' : 'text-starlight-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.title.split(' ')[0]}
              </button>
            ))}
            <div className="h-[1px] bg-white/5 my-2 mx-2" />
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-mono-label font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all">
              <Lock className="w-4 h-4" />
              Reset Terminal
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="col-span-9 space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="glass-card border-white/5 p-0 overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-20 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 border-b border-white/5 bg-void-800/30">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-mono uppercase tracking-widest font-black text-white">{section.title}</h3>
                </div>
                <p className="text-body text-starlight-400/60 font-medium">{section.description}</p>
              </div>
              <div className="p-8 space-y-8">
                {section.fields.map((field, j) => (
                  <div key={j} className="grid grid-cols-3 gap-8 items-center">
                    <label className="text-mono-label font-black text-starlight-400/60">
                      {field.label.replace(' ', '_')}
                    </label>
                    <div className="col-span-2">
                      {field.type === 'text' || field.type === 'password' ? (
                        <input
                          type={field.type}
                          defaultValue={field.value}
                          className="w-full bg-void-900 border border-white/10 rounded-xl px-4 py-3 text-body text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          defaultValue={field.value}
                          rows={3}
                          className="w-full bg-void-900 border border-white/10 rounded-xl px-4 py-3 text-body text-white focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
                        />
                      ) : field.type === 'readonly' ? (
                        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-xl">
                          <span className="text-body font-mono text-starlight-400">{field.value}</span>
                          <Lock className="w-3 h-3 text-starlight-400/20" />
                        </div>
                      ) : field.type === 'toggle' ? (
                        <button className="w-12 h-6 bg-primary rounded-full relative shadow-[0_0_10px_rgba(45,212,191,0.3)]">
                           <div className="absolute right-1 top-1 w-4 h-4 bg-void-900 rounded-full" />
                        </button>
                      ) : field.type === 'button' ? (
                        <button className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-body font-bold text-white transition-all">
                           {field.label.includes('GitHub') && <Github className="w-4 h-4" />}
                           {field.value}
                           <ChevronRight className="w-4 h-4 ml-auto text-starlight-400/40" />
                        </button>
                      ) : (
                        <select className="w-full bg-void-900 border border-white/10 rounded-xl px-4 py-3 text-body text-white focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none">
                          <option>{field.value}</option>
                          <option>30 Minutes</option>
                          <option>1 Hour</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-4 pt-4">
             <button className="btn-ghost px-8 py-3 text-mono-label font-bold">
                Discard Changes
             </button>
             <button className="btn-reactor px-10 py-3 text-mono-label font-black">
                Save Protocol
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
