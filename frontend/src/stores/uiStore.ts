import { create } from 'zustand';

interface UIState {
  isEnteringWorkspace: boolean;
  setEnteringWorkspace: (state: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isEnteringWorkspace: false,
  setEnteringWorkspace: (state: boolean) => set({ isEnteringWorkspace: state }),
}));
