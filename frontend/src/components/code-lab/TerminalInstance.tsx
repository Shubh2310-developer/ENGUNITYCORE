'use client';

import React, { useEffect, useRef } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { TerminalWebSocket } from '@/services/terminal-ws';

// Dynamically import XTerm with no SSR
let XTerm: any;
let FitAddon: any;
let WebLinksAddon: any;

if (typeof window !== 'undefined') {
  XTerm = require('@xterm/xterm').Terminal;
  FitAddon = require('@xterm/addon-fit').FitAddon;
  WebLinksAddon = require('@xterm/addon-web-links').WebLinksAddon;
  require('@xterm/xterm/css/xterm.css');
}

interface TerminalInstanceProps {
  projectId: string;
  isActive: boolean;
}

export const TerminalInstance: React.FC<TerminalInstanceProps> = ({ projectId, isActive }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<TerminalWebSocket | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isDisposedRef = useRef(false);
  const isActiveRef = useRef(isActive);

  // Sync isActive ref to avoid stale closures in timeouts/observers
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  };

  const setTrackedTimeout = (fn: () => void, delay: number) => {
    if (isDisposedRef.current) return;
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      fn();
    }, delay);
    timeoutsRef.current.add(id);
    return id;
  };

  // Robust fitting logic with renderer guards and settlement attempts
  const performFit = () => {
    if (isDisposedRef.current) return;

    const term = xtermRef.current;
    const fitAddon = fitAddonRef.current;
    const container = terminalRef.current;

    if (container && term && fitAddon) {
      // CRITICAL: Ensure terminal is attached to DOM and has a renderer ready
      // XTerm internally uses _core._renderService which might not be ready
      // We check for .element and .textarea as proxy for readiness
      if (!term.element || !term.textarea) return;

      // Check if the element is actually visible and has valid dimensions
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        try {
          // fitAddon.fit() calculates dimensions and triggers onResize
          fitAddon.fit();

          // Force a full refresh of the character grid to fix alignment/corruption
          term.refresh(0, term.rows - 1);

          // Re-focus to ensure input handling is correct if this is the active terminal
          if (isActiveRef.current) {
            term.focus();
          }
        } catch (e: any) {
          // Specific catch for the "dimensions" error which is common during layout settlement
          if (!e.message?.includes('dimensions')) {
            console.warn('XTerm fit failed:', e);
          }
        }
      }
    }
  };

  const { terminalCommand, terminalTimestamp, activeBottomTab, isTerminalOpen } = useCodeStore();

  // Re-fit when becoming visible via store state (e.g. panel toggle or tab switch)
  useEffect(() => {
    if (isActive && activeBottomTab === 'terminal' && isTerminalOpen) {
      performFit();
      setTrackedTimeout(performFit, 100);
      setTrackedTimeout(performFit, 400); // Wait for CSS transitions to settle
    }
  }, [isActive, activeBottomTab, isTerminalOpen]);

  // Handle external commands
  useEffect(() => {
    if (isActive && xtermRef.current && terminalCommand && wsRef.current) {
        wsRef.current.send(terminalCommand + '\r');
    }
  }, [terminalCommand, terminalTimestamp, isActive]);

  // Main terminal initialization
  useEffect(() => {
    if (!terminalRef.current || !XTerm || !FitAddon) return;

    // Create terminal instance
    const term = new XTerm({
      theme: {
        background: '#0a0a0b',
        foreground: '#e2e8f0',
        cursor: '#00f2ff',
        cursorAccent: '#000000',
        selectionBackground: '#00f2ff40',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      // Use the loaded font variable from layout.tsx
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      drawBoldTextInBrightColors: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    term.write('\x1b[32m[Initializing terminal session...]\x1b[0m\r\n');

    // Initialize WebSocket connection
    const ws = new TerminalWebSocket(term, projectId);
    ws.connect();
    wsRef.current = ws;

    xtermRef.current = term;

    // Handle user input
    const disposable = term.onData((data: string) => {
      ws.send(data);
    });

    // Handle terminal resize events (triggered by fitAddon or manually)
    const resizeDisposable = term.onResize((size: { cols: number; rows: number }) => {
      ws.resize(size.cols, size.rows);
    });

    // Fit on mount and window resize
    const initFit = async () => {
      // Wait for fonts to load for accurate character width calculation
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {}
      }

      performFit();
      setTrackedTimeout(performFit, 100);
      setTrackedTimeout(performFit, 500); // Catch end of panel opening animation
    };

    initFit();
    window.addEventListener('resize', performFit);

    // Create observer for container resize
    const resizeObserver = new ResizeObserver(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          performFit();
          // Add delayed fits to catch the end of CSS transitions (e.g. sidebar toggles)
          setTrackedTimeout(performFit, 100);
          setTrackedTimeout(performFit, 350);
        });
    });

    if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
    }

    return () => {
      isDisposedRef.current = true;
      clearAllTimeouts();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', performFit);
      resizeObserver.disconnect();
      disposable.dispose();
      resizeDisposable.dispose();
      ws.disconnect();
      term.dispose();
      xtermRef.current = null;
      wsRef.current = null;
      fitAddonRef.current = null;
    };
  }, [projectId]);

  return (
    <div
      className={`h-full w-full absolute inset-0 ${isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}
      style={{ minHeight: 0, overflow: 'hidden', transition: 'opacity 0.1s' }}
    >
      <div
        ref={terminalRef}
        className="h-full w-full overflow-hidden"
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
};
