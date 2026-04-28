'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Key, Shield, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo =
        process.env.NEXT_PUBLIC_SUPABASE_AUTH_CALLBACK_URL?.replace('/callback', '/reset-password/confirm') ||
        `${window.location.origin}/reset-password/confirm`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900 text-starlight-100 flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-sky/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <Link href="/login" className="inline-flex items-center gap-2 mb-8 text-starlight-400 hover:text-primary transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-mono-label">Return to Terminal</span>
          </Link>

          <div className="flex justify-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 relative overflow-hidden rounded-xl shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-transform group-hover:scale-110">
                <Image
                  src="/Logo1.jpg"
                  alt="Engunity Logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <span className="text-white font-bold text-3xl tracking-tighter font-mono uppercase">Engunity</span>
            </Link>
          </div>

          <h1 className="font-black text-white mb-3 tracking-tight">Key Recovery</h1>
          <p className="text-starlight-400 text-body-large font-medium">Reset your secure access credentials.</p>
        </div>

        <div className="glass-card p-10 border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cyber opacity-50 group-hover:opacity-100 transition-opacity" />

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Recovery Packet Dispatched</h2>
              <p className="text-starlight-400 text-caption leading-relaxed">
                A recovery link has been sent to <span className="text-primary font-mono">{email}</span>. Check your inbox and follow the link to reset your password.
              </p>
              <Link href="/login" className="inline-block mt-4 text-caption text-starlight-400 hover:text-primary transition-colors">
                Return to Terminal
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-caption text-red-400 text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-mono-label font-black text-starlight-400 mb-2 italic tracking-widest">Identity // Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexus.com"
                  disabled={isLoading}
                  autoFocus
                  className="w-full bg-void-900/50 border border-white/10 rounded-xl px-4 py-4 text-body text-white placeholder:text-starlight-400/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <p className="mt-4 text-mono-label text-starlight-400/50 leading-relaxed italic">
                  Verification packet will be dispatched to this address if it exists within our neural mesh.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-reactor w-full py-5 flex items-center justify-center gap-3 group text-body-large font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dispatch Recovery Link'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-starlight-400/40 text-mono-label">
            Protocol: Encrypted_Handshake // RSA-4096
          </p>
        </div>
      </div>

      {/* Security Badge */}
      <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-4 px-4 py-2 glass-panel border-white/10 rounded-lg">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-mono-label text-starlight-400/60">Secure Recovery Terminal</span>
      </div>
    </div>
  );
}
