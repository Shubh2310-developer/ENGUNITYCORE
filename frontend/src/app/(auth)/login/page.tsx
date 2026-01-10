'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Github, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, status } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/overview');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Authenticate and get token
      const tokenData = await authService.login(email, password);

      // 2. Fetch user details with the new token
      const userData = await authService.getMe(tokenData.access_token);

      // 3. Update global state
      setAuth(userData, tokenData.access_token);

      // 4. Redirect to dashboard
      router.push('/overview'); // Using /overview as the initial landing page in dashboard
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-900 text-starlight-400 flex flex-col lg:flex-row">
      {/* Left Section: Brand & Trust (60% on desktop) */}
      <div className="hidden lg:flex lg:w-[60%] flex-col justify-center px-24 space-y-6 border-r border-void-700/30">
        <div className="space-y-4">
          <div className="w-16 h-16 relative grayscale opacity-60">
            <Image
              src="/Logo1.jpg"
              alt="Engunity Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="space-y-3">
            <h1 className="text-starlight-100 text-3xl font-bold tracking-tight">Engunity AI</h1>
            <p className="text-starlight-400 text-base max-w-sm">
              Structured AI workspace for serious work.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-void-700/20 max-w-xs">
          <p className="text-mono-label text-starlight-400/30 mb-4">Security Protocol</p>
          <ul className="space-y-2 text-secondary text-starlight-400/50">
            <li>• End-to-end encryption for all sessions</li>
            <li>• Zero-knowledge data architecture</li>
            <li>• Multi-factor authentication ready</li>
          </ul>
        </div>
      </div>

      {/* Right Section: Authentication (40% on desktop, 100% on mobile) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-void-900">
        <div className="w-full max-w-[360px] space-y-6">
          {/* Mobile-only Logo */}
          <div className="flex flex-col items-center text-center space-y-2 lg:hidden">
            <div className="w-10 h-10 relative mb-2 grayscale opacity-80">
              <Image
                src="/Logo1.jpg"
                alt="Engunity Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-starlight-100 text-2xl font-bold tracking-tight">Engunity AI</h1>
            <p className="text-starlight-400 text-sm">Structured AI workspace for serious work.</p>
          </div>

          <div className="bg-void-800 border border-void-700 rounded-lg p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-caption text-red-400 text-center animate-in">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-mono-label text-starlight-400">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder="admin@engunity.ai"
                  className="w-full bg-void-900 border border-void-700 rounded px-4 py-2.5 text-body text-starlight-100 placeholder:text-starlight-400/10 focus:outline-none focus:ring-1 focus:ring-cyber-teal transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-mono-label text-starlight-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full bg-void-900 border border-void-700 rounded px-4 py-2.5 text-body text-starlight-100 placeholder:text-starlight-400/20 focus:outline-none focus:ring-1 focus:ring-cyber-teal transition-all pr-10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-starlight-400/50 hover:text-starlight-100 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded border-void-700 bg-void-900 text-cyber-teal focus:ring-cyber-teal focus:ring-offset-void-800 disabled:opacity-50"
                  />
                  <span className="text-caption text-starlight-400 group-hover:text-starlight-100 transition-colors">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyber-teal hover:bg-[#25bca8] text-void-900 font-bold py-3 rounded transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-h-[44px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </form>

            {/* Secondary Actions */}
            <div className="mt-8 flex flex-col items-center space-y-3">
              <Link
                href="/reset-password"
                className="text-caption text-starlight-400 hover:text-starlight-100 transition-all"
              >
                Forgot password
              </Link>
              <Link
                href="/register"
                className="text-caption text-starlight-400 hover:text-starlight-100 transition-all"
              >
                Create an account
              </Link>
            </div>

            {/* Authentication Alternatives */}
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-void-700"></div>
                </div>
                <div className="relative flex justify-center text-mono-label">
                  <span className="bg-void-800 px-4 text-starlight-400/50">OR</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  disabled={isLoading}
                  className="p-2.5 bg-void-700/50 hover:bg-void-700 border border-void-700 text-starlight-100 rounded transition-all active:scale-[0.98] disabled:opacity-50"
                  aria-label="Continue with GitHub"
                >
                  <Github className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-void-700/50 text-center">
              <p className="text-[9px] text-starlight-400/30 leading-relaxed uppercase tracking-widest">
                Data encrypted at rest and in transit<br />
                No training on private data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
