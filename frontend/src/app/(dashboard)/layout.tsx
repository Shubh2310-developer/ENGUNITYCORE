'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { TransitionScreen } from '@/components/ui/transition-screen';
import {
  LayoutDashboard,
  MessageSquare,
  Code2,
  BookOpen,
  Search,
  BarChart3,
  Settings,
  FileText,
  Zap,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Github,
  Briefcase,
  Shield
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, status, clearAuth } = useAuthStore();
  const { isEnteringWorkspace, setEnteringWorkspace } = useUIStore();
  const pathname = usePathname(); // Need to import this
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  useEffect(() => {
    // Redirect to login if unauthenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Sidebar state is now controlled only by user interaction (toggle button)
  // No auto-collapse on any route

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Show loading while checking or if unauthenticated (to avoid flicker before redirect)
  if (status === 'checking' || status === 'idle' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen bg-void-900 items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/overview' },
    { icon: MessageSquare, label: 'Neural Chat', href: '/chat' },
    { icon: Code2, label: 'Code Lab', href: '/code' },
    { icon: BookOpen, label: 'Notebook', href: '/notebook' },
    { icon: Search, label: 'Research', href: '/research' },
    { icon: FileText, label: 'Documents', href: '/documents' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Briefcase, label: 'Job Prep', href: '/jobprep' },
    { icon: Shield, label: 'Decision Vault', href: '/decisionvault' },
    { icon: Github, label: 'Github Repos', href: '/githubrepos' },
  ];

  if (isEnteringWorkspace) {
    return (
      <TransitionScreen
        isVisible={isEnteringWorkspace}
        onComplete={() => setEnteringWorkspace(false)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-void-900 text-starlight-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-72'} border-r border-white/5 flex flex-col bg-void-800/50 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-void-800 border border-white/10 rounded-full p-1 text-starlight-400 hover:text-white hover:border-cyber-teal/50 transition-all z-40 shadow-xl"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className={`p-6 ${isCollapsed ? 'items-center justify-center px-2' : ''} flex transition-all duration-300`}>
          <Link href="/overview" className="flex items-center gap-3 group">
            <div className="w-9 h-9 relative overflow-hidden rounded-lg shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-transform group-hover:scale-110 flex-shrink-0">
              <Image
                src="/Logo1.jpg"
                alt="Engunity Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className={`text-white font-bold text-xl tracking-tighter font-mono uppercase whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              Engunity
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-x-hidden">
          <div className={`px-4 mb-4 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            <p className="text-mono-label text-starlight-400/40 whitespace-nowrap">Core_Systems</p>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-starlight-400 hover:text-white hover:bg-white/5 transition-all group relative`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 group-hover:text-primary transition-colors flex-shrink-0`} />
              <span className={`text-body font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden absolute' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 overflow-hidden">
          <Link
            href="/settings"
            className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-starlight-400 hover:text-white hover:bg-white/5 transition-all group mb-2`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 group-hover:text-primary transition-colors flex-shrink-0" />
            <span className={`text-body font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
              Settings
            </span>
          </Link>

          <div className={`glass-panel p-2 rounded-2xl border-white/5 flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'bg-transparent border-0 justify-center' : 'p-4'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-cyber p-[1px] flex-shrink-0 cursor-pointer">
              <div className="w-full h-full rounded-full bg-void-900 flex items-center justify-center overflow-hidden">
                <User className="w-5 h-5 text-starlight-400" />
              </div>
            </div>

            <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-auto opacity-100 block'}`}>
              <p className="text-body font-bold text-white truncate">{user?.email.split('@')[0] || 'Researcher_01'}</p>
              <p className="text-mono-label text-starlight-400/50 truncate">ID: 0x{user?.id.toString(16).padStart(3, '0')}...4k</p>
            </div>

            <button
              onClick={handleLogout}
              className={`text-starlight-400 hover:text-red-400 transition-colors flex-shrink-0 ${isCollapsed ? 'hidden' : 'block'}`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">
        {/* Top Header - Hide on pages with their own headers */}
        {pathname !== '/chat' && pathname !== '/decisionvault' && pathname !== '/analytics' && !pathname?.startsWith('/analytics/') && pathname !== '/code' && pathname !== '/overview' && pathname !== '/research' && pathname !== '/githubrepos' && pathname !== '/jobprep' && !pathname?.startsWith('/documents') && (
          <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-void-900/50 backdrop-blur-md z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                <span className="text-mono-label text-primary">Neural Link: Active</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-cyber rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                <button className="relative px-4 py-2 bg-void-800 border border-white/10 rounded-xl flex items-center gap-3 hover:border-white/20 transition-all">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-mono-label font-bold text-white">340.2 GLOPs</span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Area */}
        <section className={`flex-1 overflow-hidden ${pathname === '/chat' || pathname === '/decisionvault' || pathname === '/analytics' || pathname?.startsWith('/analytics/') || pathname === '/code' || pathname === '/overview' || pathname === '/research' || pathname === '/githubrepos' || pathname === '/jobprep' || pathname?.startsWith('/documents')
          ? 'm-4 rounded-2xl overflow-hidden'
          : ''
          } ${pathname === '/overview' ? '' : 'bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.03),transparent_40%)]'}`}>
          <div className={`mx-auto h-full transition-all duration-300 ${pathname === '/code' || pathname === '/decisionvault' || pathname === '/chat' || pathname === '/analytics' || pathname?.startsWith('/analytics/') || pathname === '/overview' || pathname === '/research' || pathname === '/githubrepos' || pathname === '/jobprep' || pathname?.startsWith('/documents')
            ? 'p-0 max-w-full h-full'
            : 'p-10 max-w-[1720px]'
            }`}>
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
