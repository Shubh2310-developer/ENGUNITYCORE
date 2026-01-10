'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useCodeStore } from '@/stores/codeStore';
import '@xterm/xterm/css/xterm.css';

export const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const { terminalCommand, terminalTimestamp } = useCodeStore();

  useEffect(() => {
    if (xtermRef.current && terminalCommand) {
      const term = xtermRef.current;
      term.writeln(`\r\n\x1b[33m[Running]\x1b[0m ${terminalCommand}`);

      // Mock execution sequence
      setTimeout(() => {
        term.writeln('\x1b[34m[Build]\x1b[0m Compiling modules...');
      }, 500);

      setTimeout(() => {
        term.writeln('\x1b[32m[Success]\x1b[0m Build complete. Output:');
        term.writeln('----------------------------------------');
        term.writeln('Processing batch: 1024 chunks');
        term.writeln('Average Latency: 42ms');
        term.writeln('Throughput: 12.4 req/s');
        term.writeln('----------------------------------------');
        term.write('\x1b[36m$ \x1b[0m');
      }, 1500);
    }
  }, [terminalCommand, terminalTimestamp]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#0a0a0b',
        foreground: '#e2e8f0',
        cursor: '#00f2ff',
        selectionBackground: '#00f2ff40',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc',
      },
      fontFamily: 'Fira Code, JetBrains Mono, monospace',
      fontSize: 13,
      allowProposedApi: true,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('\x1b[32m[Handshake]\x1b[0m Connected to Engunity-Runtime-v2');
    term.writeln('\x1b[34m[System]\x1b[0m Initializing model: all-MiniLM-L6-v2...');
    term.writeln('\x1b[34m[System]\x1b[0m Memory load: 4.2GB / 16GB');
    term.write('\x1b[36m$ \x1b[0m');

    let currentCommand = '';
    term.onData(data => {
      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        const command = currentCommand.trim();
        if (command === 'clear') {
          term.clear();
        } else if (command === 'ls') {
          term.writeln('\r\n\x1b[34mai-core\x1b[0m  \x1b[34mapi\x1b[0m  \x1b[34mfrontend\x1b[0m  package.json  requirements.txt');
        } else if (command === 'help') {
          term.writeln('\r\n\x1b[1mAvailable commands:\x1b[0m ls, clear, help, profile, scan, refactor');
        } else if (command !== '') {
          term.writeln(`\r\n\x1b[31mCommand not found:\x1b[0m ${command}`);
        } else {
          term.writeln('');
        }
        currentCommand = '';
        term.write('\x1b[36m$ \x1b[0m');
      } else if (code === 127) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write('\b \b');
        }
      } else if (code < 32) {
        // Ignore control characters
      } else {
        currentCommand += data;
        term.write(data);
      }
    });

    xtermRef.current = term;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return (
    <div className="h-full bg-void-950 p-2">
      <div ref={terminalRef} className="h-full" />
    </div>
  );
};
