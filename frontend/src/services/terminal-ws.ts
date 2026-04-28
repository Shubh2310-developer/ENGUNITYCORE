import type { Terminal } from '@xterm/xterm';

export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private term: Terminal;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private intentionalClose = false;

  constructor(terminal: Terminal, projectId: string) {
    this.term = terminal;

    if (typeof window !== 'undefined') {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const parsed = new URL(apiBase);
        const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = parsed.host;
        this.url = `${protocol}//${host}/ws/terminal/${projectId}`;
    } else {
        this.url = '';
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.intentionalClose = false;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.term.write('\r\n\x1b[32m[Connected to terminal]\x1b[0m\r\n');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          this.term.write(event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        if (this.intentionalClose) {
          return;
        }
        if (!event.wasClean || this.reconnectAttempts < this.maxReconnectAttempts) {
          this.term.write('\r\n\x1b[31m[Connection lost. Reconnecting...]\x1b[0m\r\n');
          this.attemptReconnect();
        } else {
            this.term.write('\r\n\x1b[33m[Connection closed]\x1b[0m\r\n');
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.term.write('\r\n\x1b[31m[Failed to reconnect. Please refresh the page.]\x1b[0m\r\n');
    }
  }

  public send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  private resizeTimeout: NodeJS.Timeout | null = null;

  public resize(cols: number, rows: number) {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Debounce resize messages to prevent flooding the backend during transitions
    this.resizeTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(`__resize__:${rows}:${cols}`);
      }
      this.resizeTimeout = null;
    }, 100);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    if (this.ws) {
      this.intentionalClose = true;
      // Prevent callbacks on intentional close
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
