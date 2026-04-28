'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * ResearchErrorBoundary
 * ──────────────────────
 * React class-based error boundary wrapping the main content grid of the
 * Research Workspace.  On an uncaught render error it shows a minimal recovery
 * banner instead of a blank white page, while keeping the header + phase nav
 * fully visible (they live outside this boundary).
 *
 * To reset, the user can click "Refresh" which does a hard reload, or wait for
 * Next.js HMR to patch the component tree automatically in dev mode.
 */
export default class ResearchErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Non-blocking: surface to any error monitoring tool (Sentry, etc.)
    console.error('[ResearchErrorBoundary]', error, info.componentStack);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 gap-5">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>

        {/* Copy */}
        <div className="text-center max-w-md">
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Something went wrong loading the workspace
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            The research workspace encountered an unexpected error. Your data is
            safe — please refresh to reload the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.message && (
            <pre className="mt-3 text-left text-[10px] text-red-700 bg-red-50 border border-red-100 rounded-lg p-3 overflow-auto max-h-24">
              {this.state.message}
            </pre>
          )}
        </div>

        {/* Action */}
        <button
          onClick={this.handleRefresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow shadow-blue-200"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh page
        </button>
      </div>
    );
  }
}
