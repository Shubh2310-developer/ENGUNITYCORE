'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowRight,
  Code,
  Search,
  FileText,
  BarChart3,
  ShieldCheck,
  Cpu,
  Zap,
  Globe,
  Lock,
  LayoutDashboard,
  MessageSquare,
  Code2,
  BookOpen
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { status } = useAuthStore();

  const handleStartWorking = (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'authenticated') {
      router.push('/overview');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-void-900 text-starlight-100 selection:bg-primary/30 selection:text-white">
      {/* Navigation */}
      <nav className="h-[80px] glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-atlas h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative overflow-hidden rounded-lg shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <Image
                src="/Logo1.jpg"
                alt="Engunity Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-white font-bold text-2xl tracking-tighter font-mono uppercase">Engunity <span className="text-primary">AI</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-12">
            <Link href="#features" className="text-mono-label font-black text-starlight-400 hover:text-primary transition-colors">Features</Link>
            <Link href="#research" className="text-mono-label font-black text-starlight-400 hover:text-primary transition-colors">Research</Link>
            <Link href="#api" className="text-mono-label font-black text-starlight-400 hover:text-primary transition-colors">API</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-mono-label font-black text-starlight-400 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <button
              onClick={handleStartWorking}
              className="btn-reactor py-3 px-8 text-mono-label font-black"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-24 overflow-hidden border-b border-white/5">
        <div className="container-atlas grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10 animate-in">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel border-white/10 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-mono-label font-black text-starlight-400">System v2.0 // Cyan_Protocol_Active</span>
            </div>

            <h1 className="mb-8 max-w-2xl leading-[1.1]">
              A unified AI workspace for <br />
              <span className="text-gradient-cyber">research, code, and analytical thinking.</span>
            </h1>

            <p className="text-starlight-400 text-body-large mb-12 leading-relaxed font-medium max-w-xl">
              Chat, analyze documents, write code, and reason over data in one structured, secure environment — powered by both local and cloud AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button
                onClick={handleStartWorking}
                className="btn-reactor w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5"
              >
                Start working
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="#overview" className="btn-ghost w-full sm:w-auto px-10 py-5 font-black text-mono-label">
                View platform overview
              </Link>
            </div>
          </div>

          <div className="relative group lg:block hidden">
            <div className="absolute -inset-1 bg-gradient-cyber rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass-card p-2 border-white/10 bg-void-950/80 overflow-hidden shadow-2xl">
              <div className="bg-void-900 rounded-xl overflow-hidden aspect-[16/10] relative">
                {/* Static Product Preview Mockup */}
                <div className="absolute inset-0 opacity-80">
                  <Image
                    src="/Hero1.jpeg"
                    alt="Engunity Dashboard Overview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-void-950/80 to-transparent" />

                {/* Interface Elements */}
                <div className="absolute top-4 left-4 right-4 h-8 flex items-center justify-between px-4 rounded-lg bg-white/5 border border-white/10">
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/40" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                      <div className="w-2 h-2 rounded-full bg-green-500/40" />
                   </div>
                   <div className="text-[10px] font-mono text-starlight-400/40">engunity.terminal.v2</div>
                   <div className="w-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Credibility Strip */}
      <section className="py-12 border-b border-white/5 bg-void-900/50">
        <div className="container-atlas">
          <div className="flex flex-wrap justify-between items-center gap-8">
            {[
              "Built for long-form research and serious work",
              "Hybrid AI: local + cloud",
              "Designed for data privacy",
              "Enterprise-grade architecture"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-primary/50" />
                <span className="text-mono-label font-black text-starlight-400/60 lowercase tracking-widest">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Framing */}
      <section className="py-32 border-b border-white/5 bg-void-800/20">
        <div className="container-atlas">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="mb-8">Modern AI tools are powerful — <span className="text-starlight-400/60">but fragmented.</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mt-20">
              {[
                "Switching between chat tools, notebooks, and document viewers breaks focus",
                "Code, research, and data analysis live in disconnected environments",
                "Context is lost between sessions, requiring constant re-prompting",
                "Most AI tools optimize for speed, not reasoning quality or accuracy"
              ].map((pain, i) => (
                <div key={i} className="flex gap-6 p-8 glass-card border-transparent hover:border-white/5">
                  <div className="text-primary font-mono text-xl opacity-20">0{i+1}</div>
                  <p className="text-body-large text-starlight-400 font-medium leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section id="overview" className="py-32 relative overflow-hidden">
        <div className="container-atlas relative z-10">
          <div className="text-center mb-24">
             <h2 className="mb-6">Engunity is a workspace, <span className="text-primary">not a tool.</span></h2>
             <p className="text-starlight-400 text-body-large max-w-2xl mx-auto">A persistent environment designed for the depth of professional research.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-10 space-y-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="uppercase tracking-widest text-white">Unified Workspace</h3>
              <p className="text-starlight-400 text-body leading-relaxed">Chat, code, documents, and analysis live in one continuous context. No more fragmented windows.</p>
            </div>
            <div className="glass-card p-10 space-y-8">
              <div className="w-12 h-12 bg-cyber-sky/10 rounded-xl flex items-center justify-center border border-cyber-sky/20">
                <Cpu className="w-6 h-6 text-cyber-sky" />
              </div>
              <h3 className="uppercase tracking-widest text-white">Hybrid Intelligence</h3>
              <p className="text-starlight-400 text-body leading-relaxed">Cloud LLMs for peak reasoning power. Local models for reliability, offline access, and absolute privacy.</p>
            </div>
            <div className="glass-card p-10 space-y-8">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <Lock className="w-6 h-6 text-starlight-400" />
              </div>
              <h3 className="uppercase tracking-widest text-white">Structured Thinking</h3>
              <p className="text-starlight-400 text-body leading-relaxed">Designed for long-form sessions, deep reasoning, and reproducible research artifacts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Walkthrough */}
      <section className="py-32 bg-void-800/30 border-y border-white/5">
        <div className="container-atlas">
          <div className="flex flex-col gap-32">
            {[
              {
                title: "AI Chat with Context Memory",
                description: "Ask questions that persist across sessions, documents, and code — without re-prompting or loss of context.",
                icon: MessageSquare,
                image: "/AICODEANDCHAT.jpeg"
              },
              {
                title: "Document Q&A (RAG)",
                description: "Deep-dive into thousands of pages. Our neural retrieval engine finds precise answers within your secure document vault.",
                icon: FileText,
                image: "/DocumentRAG.jpeg"
              },
              {
                title: "Clinical Code Assistant",
                description: "Write, debug, and execute code in isolated sandboxes. Full integration with your research data and AI reasoning.",
                icon: Code2,
                image: "/ClincialCodeAsistant.jpeg"
              },
              {
                title: "Bento Notebook Interface",
                description: "Aggregate AI insights, code artifacts, and source documentation into a single cohesive, structured narrative.",
                icon: BookOpen,
                image: "/BENTO.jpeg"
              }
            ].map((module, i) => (
              <div key={i} className={`flex flex-col lg:flex-row items-center gap-20 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1 space-y-8">
                  <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                    <module.icon className="w-5 h-5 text-primary" />
                    <span className="text-mono-label font-black text-white">{module.title}</span>
                  </div>
                  <h2 className="text-white leading-tight">{module.title}</h2>
                  <p className="text-starlight-400 text-body-large leading-relaxed font-medium">
                    {module.description}
                  </p>
                </div>
                <div className="flex-1 w-full max-w-3xl">
                  <div className="glass-card p-2 border-white/10 shadow-2xl bg-void-950/50">
                    <div className="aspect-[16/10] bg-void-900 rounded-xl overflow-hidden border border-white/5 relative">
                       <Image
                         src={module.image}
                         alt={module.title}
                         fill
                         className="object-cover opacity-80 hover:scale-105 transition-transform duration-700"
                       />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It’s Different */}
      <section className="py-32">
        <div className="container-atlas">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center mb-20">Designed for <span className="text-gradient-cyan">Skeptics.</span></h2>
            <div className="glass-card p-0 border-white/10 overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/10 bg-white/5">
                     <th className="px-10 py-8 text-mono-label font-black text-starlight-400">Parameter</th>
                     <th className="px-10 py-8 text-mono-label font-black text-starlight-400/50 italic">Typical AI Tools</th>
                     <th className="px-10 py-8 text-mono-label font-black text-primary">Engunity AI</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {[
                     ["Architecture", "Stateless chats", "Persistent workspaces"],
                     ["Workflow", "One-size-fits-all", "Role-aware workflows"],
                     ["Intelligence", "Cloud-only", "Hybrid local + cloud"],
                     ["Output", "Short prompts", "Long-form reasoning"]
                   ].map(([label, typical, engunity], i) => (
                     <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                       <td className="px-10 py-8 text-body font-black text-white">{label}</td>
                       <td className="px-10 py-8 text-body text-starlight-400/50">{typical}</td>
                       <td className="px-10 py-8 text-body font-bold text-primary">{engunity}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </section>

      {/* Who It’s For */}
      <section className="py-32 border-t border-white/5">
        <div className="container-atlas grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="glass-card p-12 space-y-10 border-white/5 hover:border-primary/20">
             <h3 className="text-mono-label font-black text-primary italic">Designed_For</h3>
             <div className="space-y-6">
                {["Researchers", "Engineers", "Analysts", "Students doing serious work"].map(item => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-body-large font-bold text-white">{item}</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="glass-card p-12 space-y-10 border-white/5 grayscale opacity-60">
             <h3 className="text-mono-label font-black text-starlight-400 italic">Not_Designed_For</h3>
             <div className="space-y-6">
                {["Casual chat", "Meme generation", "Social media content farms"].map(item => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-starlight-400/20" />
                    <span className="text-body-large font-medium text-starlight-400">{item}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section className="py-32 bg-void-950">
        <div className="container-atlas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="mb-10">Clinical security <br /><span className="text-starlight-400/60">as a standard.</span></h2>
              <div className="grid grid-cols-2 gap-8">
                {[
                  { label: "Data isolation", desc: "Private enclaves for every session" },
                  { label: "Secure execution", desc: "Isolated sandboxed runtime" },
                  { label: "Role-based access", desc: "Granular permission mesh" },
                  { label: "Blockchain Audit", desc: "Immutable provenance tracking" }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="text-mono-label font-black text-white">{item.label}</div>
                    <p className="text-caption text-starlight-400/60 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-10 bg-void-900/50 border-white/5 font-mono text-caption text-starlight-400/40 space-y-2">
               <p className="text-primary font-black">{"// ARCHITECTURE_MANIFEST"}</p>
               <p>[PROTOCOL] Engunity_v2_Release</p>
               <p>[SECURITY] EAL6+_Verified</p>
               <p>[ENCRYPTION] AES-256-GCM-Static</p>
               <p>[RUNTIME] Isolate-V8-Runtime-v12</p>
               <div className="pt-4 border-t border-white/5 text-primary/40 animate-pulse">
                  $ INITIALIZING_SECURE_LINK... DONE
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Philosophy */}
      <section className="py-32 border-y border-white/5">
        <div className="container-atlas text-center">
           <h2 className="mb-8">Simple tiers. <span className="text-starlight-400/60">No hidden usage traps.</span></h2>
           <p className="text-starlight-400 text-body-large mb-12 max-w-2xl mx-auto">Pay for capability, not gimmicks. Our pricing is designed to scale with your throughput requirements.</p>
           <button className="btn-reactor px-12 py-5 font-black text-mono-label">View pricing plans</button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full translate-y-1/2" />
        <div className="container-atlas relative z-10 text-center">
          <h1 className="mb-12">Start working in a <br /><span className="text-gradient-cyber">focused AI environment.</span></h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <button
              onClick={handleStartWorking}
              className="btn-reactor w-full sm:w-auto px-12 py-6 text-body-large font-black uppercase"
            >
              Create workspace
            </button>
            <Link href="/docs" className="btn-ghost w-full sm:w-auto px-12 py-6 text-body-large font-black uppercase">
              Read technical overview
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-void-900 border-t border-white/5">
        <div className="container-atlas">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-24 mb-32">
            <div className="max-w-md">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 relative overflow-hidden rounded-lg shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                  <Image
                    src="/Logo1.jpg"
                    alt="Engunity Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-white font-black text-2xl tracking-tighter uppercase font-mono">Engunity</span>
              </div>
              <p className="text-starlight-400 text-body-large leading-relaxed font-medium mb-10">
                Architecting the next generation of artificial intelligence interfaces. Built for deep flow, designed for clinical precision.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#2DD4BF]" />
                <span className="text-caption font-mono text-starlight-400 uppercase tracking-[0.3em] font-bold">Global_Grid_Status: Active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-24 lg:gap-40">
              <div className="flex flex-col gap-6">
                <h4 className="text-caption font-mono uppercase tracking-[0.4em] text-white font-black mb-4 border-b border-primary/20 pb-2">Platform</h4>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Research</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Execution</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">API Docs</Link>
              </div>
              <div className="flex flex-col gap-6">
                <h4 className="text-caption font-mono uppercase tracking-[0.4em] text-white font-black mb-4 border-b border-primary/20 pb-2">Legal</h4>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Security</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Privacy</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Terms</Link>
              </div>
              <div className="flex flex-col gap-6">
                <h4 className="text-caption font-mono uppercase tracking-[0.4em] text-white font-black mb-4 border-b border-primary/20 pb-2">Social</h4>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Twitter</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">GitHub</Link>
                <Link href="#" className="text-starlight-400 hover:text-primary text-body font-bold transition-all hover:translate-x-1">Discord</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6">
            <p className="text-starlight-400/40 text-caption font-mono font-bold tracking-[0.3em] uppercase">
              © 2026 ENGUNITY_AI // ALL_SYSTEMS_GO
            </p>
            <div className="px-6 py-2 rounded-full glass-panel border-white/5 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              <span className="text-mono-label text-starlight-400/60">Protocol: 802.11AI-REV2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
