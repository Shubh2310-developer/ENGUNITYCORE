'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Github, Shield, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/overview');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900 text-starlight-100 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-sky/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[500px] z-10 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-8 h-8 relative overflow-hidden rounded shadow-[0_0_10px_rgba(45,212,191,0.2)] transition-transform group-hover:scale-105">
              <Image
                src="/Logo1.jpg"
                alt="Engunity Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-white font-bold text-lg tracking-tighter font-mono uppercase">Engunity</span>
          </Link>
          <h1 className="text-white mb-2 tracking-tight">Apply for Clearance</h1>
          <p className="text-starlight-400 font-medium text-body">Join the next generation of sovereign researchers.</p>
        </div>

        <div className="glass-card p-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-cyber opacity-30 group-hover:opacity-100 transition-opacity" />

          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Clearance Granted</h2>
              <p className="text-starlight-400 text-caption">Your account has been initialized. Redirecting to terminal...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-caption text-red-400 text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-mono-label text-starlight-400">First_Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-void-900 border border-white/5 rounded px-4 py-2.5 text-body text-white placeholder:text-starlight-400/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-mono-label text-starlight-400">Last_Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-void-900 border border-white/5 rounded px-4 py-2.5 text-body text-white placeholder:text-starlight-400/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-mono-label text-starlight-400">Primary_Identity // Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.com"
                  className="w-full bg-void-900 border border-white/5 rounded px-4 py-2.5 text-body text-white placeholder:text-starlight-400/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-mono-label text-starlight-400">Access_Key // Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-void-900 border border-white/5 rounded px-4 py-2.5 text-body text-white placeholder:text-starlight-400/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <p className="mt-2 text-[10px] text-starlight-400/40 uppercase tracking-widest italic font-medium">Requirement: 8+ characters, alphanumeric complexity.</p>
              </div>

              <div className="flex items-start gap-3 py-1">
                <input type="checkbox" required className="mt-1 accent-primary w-3.5 h-3.5 rounded border-white/10 bg-void-900" />
                <p className="text-caption text-starlight-400 leading-relaxed">
                  I agree to the <Link href="/terms" className="text-primary hover:text-white transition-colors font-bold">Neural Service Terms</Link> and <Link href="/privacy" className="text-primary hover:text-white transition-colors font-bold">Privacy Protocol</Link>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-reactor w-full py-3.5 flex items-center justify-center gap-2 group text-body font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Initialize Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-3 bg-void-800 text-mono-label text-starlight-400/40 italic">Rapid_Onboarding</span>
          </div>

          <button className="w-full btn-ghost py-3 flex items-center justify-center gap-2 text-mono-label font-bold tracking-widest">
            <Github className="w-4 h-4" />
            GitHub Identity Link
          </button>
        </div>

        <p className="text-center mt-6 text-starlight-400/60 text-caption">
          Already have clearance? <Link href="/login" className="text-primary hover:text-white transition-colors underline underline-offset-4 decoration-primary/20 hover:decoration-white font-bold">Return to Terminal</Link>
        </p>
      </div>

      {/* Floating security tag */}
      <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-3 px-3 py-1.5 glass-panel border-white/5 rounded text-mono-label text-starlight-400/40">
        <Shield className="w-3.5 h-3.5 text-primary/50" />
        <span>End-to-End Encryption // AES-256</span>
      </div>
    </div>
  );
}
