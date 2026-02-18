import { useReducer, useCallback } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const getBaseUrl = () => {
  let url = API_URL;
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }
  return url;
};

const FINAL_API_URL = getBaseUrl();

export type AgentRole = 'user' | 'agent-lead' | 'agent-coder' | 'agent-reviewer' | 'system';

export interface AgentMessage {
  id: string;
  timestamp: string;
  from: AgentRole;
  to: AgentRole | 'all';
  type: 'COMMAND' | 'RESPONSE' | 'UPDATE' | 'ERROR';
  action?: string;
  payload?: Record<string, unknown>;
  content?: string;
}

export type TeamStatus = 'PLANNING' | 'IMPLEMENTING' | 'REVIEWING' | 'COMPLETED' | 'FAILED' | 'IDLE';

interface TeamState {
  status: TeamStatus;
  messages: AgentMessage[];
  activeAgent: AgentRole | null;
  currentTask: string | null;
}

type TeamAction =
  | { type: 'ADD_MESSAGE'; message: AgentMessage }
  | { type: 'SET_STATUS'; status: TeamStatus }
  | { type: 'SET_ACTIVE_AGENT'; agent: AgentRole }
  | { type: 'SET_TASK'; task: string };

const initialState: TeamState = {
  status: 'IDLE',
  messages: [],
  activeAgent: null,
  currentTask: null,
};

function teamReducer(state: TeamState, action: TeamAction): TeamState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_ACTIVE_AGENT':
      return { ...state, activeAgent: action.agent };
    case 'SET_TASK':
      return { ...state, currentTask: action.task };
    default:
      return state;
  }
}

const generateId = () => Math.random().toString(36).substring(7);
const getTimestamp = () => new Date().toISOString();

export function useAgentTeam() {
  const [state, dispatch] = useReducer(teamReducer, initialState);

  const sendMessage = useCallback((text: string) => {
    const msg: AgentMessage = {
      id: generateId(),
      timestamp: getTimestamp(),
      from: 'user',
      to: 'agent-lead',
      type: 'COMMAND',
      content: text,
      payload: { instructions: text }
    };
    dispatch({ type: 'ADD_MESSAGE', message: msg });

    if (state.status === 'IDLE' || state.status === 'COMPLETED' || state.status === 'FAILED') {
      runCodingTeam(text);
    }
  }, [state.status]);

  const runCodingTeam = async (userRequest: string) => {
    dispatch({ type: 'SET_STATUS', status: 'PLANNING' });
    dispatch({ type: 'SET_ACTIVE_AGENT', agent: 'agent-lead' });
    dispatch({ type: 'SET_TASK', task: 'Analyzing request...' });

    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: generateId(),
        timestamp: getTimestamp(),
        from: 'agent-lead',
        to: 'agent-coder',
        type: 'COMMAND',
        content: `Planning task: "${userRequest}". Sending to backend...`,
      }
    });

    try {
      const token = useAuthStore.getState().token;

      dispatch({ type: 'SET_STATUS', status: 'IMPLEMENTING' });
      dispatch({ type: 'SET_ACTIVE_AGENT', agent: 'agent-coder' });
      dispatch({ type: 'SET_TASK', task: 'Writing code...' });

      const response = await fetch(`${FINAL_API_URL}/coding-team/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ task: userRequest }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse backend messages into team chat messages
      const backendMessages: Array<{ role: string; content: string }> = data.messages || [];
      for (const msg of backendMessages) {
        const content = typeof msg === 'string' ? msg : (msg.content || JSON.stringify(msg));
        let from: AgentRole = 'system';
        if (content.includes('Team Lead')) from = 'agent-lead';
        else if (content.includes('Coder')) from = 'agent-coder';
        else if (content.includes('Reviewer')) from = 'agent-reviewer';

        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: generateId(),
            timestamp: getTimestamp(),
            from,
            to: 'all',
            type: 'UPDATE',
            content,
          }
        });
      }

      if (data.status === 'completed' && data.file_content && data.file_path) {
        dispatch({ type: 'SET_STATUS', status: 'REVIEWING' });
        dispatch({ type: 'SET_ACTIVE_AGENT', agent: 'agent-reviewer' });

        // Add file to the code store so it appears in the file explorer
        const fileName = data.file_path.split('/').pop() || data.file_path;
        const codeStore = useCodeStore.getState();

        // Check if file already exists in the store
        const existingFile = codeStore.files.find(f => f.name === fileName && f.type === 'file');

        if (existingFile) {
          codeStore.updateFileContent(existingFile.id, data.file_content);
          codeStore.openFile(existingFile.id);
        } else {
          codeStore.addFile(fileName, 'file');
          // Find the newly added file (it was just added, so it's the last one)
          const updatedFiles = useCodeStore.getState().files;
          const newFile = updatedFiles.find(f => f.name === fileName && f.type === 'file');
          if (newFile) {
            codeStore.updateFileContent(newFile.id, data.file_content);
            codeStore.openFile(newFile.id);
          }
        }

        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: generateId(),
            timestamp: getTimestamp(),
            from: 'agent-reviewer',
            to: 'all',
            type: 'RESPONSE',
            content: `✅ Task completed! File "${fileName}" has been created and opened in the editor.`,
          }
        });

        dispatch({ type: 'SET_STATUS', status: 'COMPLETED' });
        dispatch({ type: 'SET_ACTIVE_AGENT', agent: 'agent-lead' });
        dispatch({ type: 'SET_TASK', task: 'Idle' });

        codeStore.setNotification({ message: `File "${fileName}" created successfully`, type: 'success' });
      } else if (data.status === 'completed') {
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: generateId(),
            timestamp: getTimestamp(),
            from: 'agent-reviewer',
            to: 'all',
            type: 'RESPONSE',
            content: `✅ Task completed. Result: ${data.result || 'Done'}`,
          }
        });
        dispatch({ type: 'SET_STATUS', status: 'COMPLETED' });
        dispatch({ type: 'SET_TASK', task: 'Idle' });
      } else {
        dispatch({
          type: 'ADD_MESSAGE',
          message: {
            id: generateId(),
            timestamp: getTimestamp(),
            from: 'system',
            to: 'all',
            type: 'UPDATE',
            content: `Task ended with status: ${data.status}. ${data.result || ''}`,
          }
        });
        dispatch({ type: 'SET_STATUS', status: 'FAILED' });
        dispatch({ type: 'SET_TASK', task: 'Idle' });
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: generateId(),
          timestamp: getTimestamp(),
          from: 'system',
          to: 'all',
          type: 'ERROR',
          content: `❌ Error: ${errorMsg}`,
        }
      });

      dispatch({ type: 'SET_STATUS', status: 'FAILED' });
      dispatch({ type: 'SET_TASK', task: 'Idle' });

      useCodeStore.getState().setNotification({ message: `Team error: ${errorMsg}`, type: 'error' });
    }
  };

  return {
    state,
    sendMessage
  };
}
