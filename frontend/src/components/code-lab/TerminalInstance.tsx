'use client';

import React, { useEffect, useRef } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { TerminalWebSocket } from '@/services/terminal-ws';
// Static side-effect import for xterm CSS — Turbopack requires this at module level
// (runtime require() of CSS inside if(typeof window) blocks is not supported)
import '@xterm/xterm/css/xterm.css';

// Dynamically import XTerm JS with no SSR (window guard)
let XTerm: any;
let FitAddon: any;
let WebLinksAddon: any;

if (typeof window !== 'undefined') {
  XTerm = require('@xterm/xterm').Terminal;
  FitAddon = require('@xterm/addon-fit').FitAddon;
  WebLinksAddon = require('@xterm/addon-web-links').WebLinksAddon;
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

  const {
    terminalCommand,
    terminalTimestamp,
    terminalOutput,
    terminalOutputTimestamp,
    activeBottomTab,
    isTerminalOpen
  } = useCodeStore();

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

  useEffect(() => {
    if (isActive && xtermRef.current && terminalOutput) {
      xtermRef.current.write(terminalOutput);
    }
  }, [terminalOutput, terminalOutputTimestamp, isActive]);

  // Main terminal initialization
  useEffect(() => {
    if (!terminalRef.current || !XTerm || !FitAddon) return;

    // Create terminal instance
    const term = new XTerm({
      theme: {
        background: '#0F172A', // Engunity Dark Slate
        foreground: '#F1F5F9', // Starlight White
        cursor: '#3B82F6', // Engunity Blue
        cursorAccent: '#FFFFFF',
        selectionBackground: '#3B82F640',
        black: '#0F172A',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#8B5CF6',
        cyan: '#06B6D4',
        white: '#F1F5F9',
        brightBlack: '#475569',
        brightRed: '#F87171',
        brightGreen: '#34D399',
        brightYellow: '#FBBF24',
        brightBlue: '#60A5FA',
        brightMagenta: '#A78BFA',
        brightCyan: '#22D3EE',
        brightWhite: '#FFFFFF',
      },
      // Use the loaded font variable from layout.tsx
      fontFamily: 'var(--font-jetbrains-mono), monospace',
      fontSize: 13,
      lineHeight: 1.4,
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
