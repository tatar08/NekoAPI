import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestModel {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: KeyValueItem[];
  params: KeyValueItem[];
  bodyType: 'json' | 'form-data' | 'raw' | 'none';
  body: string;
  auth: {
    type: 'none' | 'bearer' | 'basic';
    bearerToken?: string;
    basicUsername?: string;
    basicPassword?: string;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    time: number;
    size: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  requests: RequestModel[];
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValueItem[];
}

interface ApiStoreState {
  collections: Collection[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  tabs: string[]; // List of active Request IDs
  activeTabId: string | null;
  history: { requestId: string; timestamp: number }[];
  
  // Actions
  addCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  addRequestToCollection: (collectionId: string, request: Partial<RequestModel>) => void;
  updateRequest: (requestId: string, updates: Partial<RequestModel>) => void;
  deleteRequest: (collectionId: string, requestId: string) => void;
  
  addEnvironment: (name: string) => void;
  updateEnvironmentVariables: (id: string, variables: KeyValueItem[]) => void;
  setActiveEnvironment: (id: string | null) => void;
  
  openTab: (requestId: string) => void;
  closeTab: (requestId: string) => void;
  setActiveTab: (requestId: string | null) => void;
}

export const useApiStore = create<ApiStoreState>()(
  persist(
    (set, get) => ({
      collections: [],
      environments: [],
      activeEnvironmentId: null,
      tabs: [],
      activeTabId: null,
      history: [],

      addCollection: (name) => set((state) => ({
        collections: [...state.collections, { id: crypto.randomUUID(), name, requests: [] }]
      })),

      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter(c => c.id !== id)
      })),

      updateCollection: (id, updates) => set((state) => ({
        collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      addRequestToCollection: (collectionId, request) => set((state) => {
        const defaultReq: RequestModel = {
          id: crypto.randomUUID(),
          name: request.name || 'Untitled Request',
          method: request.method || 'GET',
          url: request.url || '',
          headers: request.headers || [],
          params: request.params || [],
          bodyType: request.bodyType || 'none',
          body: request.body || '',
          auth: request.auth || { type: 'none' },
          ...request
        };

        return {
          collections: state.collections.map((col) => {
            if (col.id === collectionId) {
              return { ...col, requests: [...col.requests, defaultReq] };
            }
            return col;
          })
        };
      }),

      updateRequest: (requestId, updates) => set((state) => ({
        collections: state.collections.map((col) => ({
          ...col,
          requests: col.requests.map((req) => 
            req.id === requestId ? { ...req, ...updates } : req
          )
        }))
      })),

      deleteRequest: (collectionId, requestId) => set((state) => {
        const nextTabs = state.tabs.filter(t => t !== requestId);
        let nextActive = state.activeTabId;
        if (state.activeTabId === requestId) {
          nextActive = nextTabs.length > 0 ? nextTabs[0] : null;
        }
        return {
          tabs: nextTabs,
          activeTabId: nextActive,
          collections: state.collections.map((col) => {
            if (col.id === collectionId) {
              return { ...col, requests: col.requests.filter(r => r.id !== requestId) };
            }
            return col;
          })
        };
      }),

      addEnvironment: (name) => set((state) => ({
        environments: [...state.environments, { id: crypto.randomUUID(), name, variables: [] }]
      })),

      updateEnvironmentVariables: (id, variables) => set((state) => ({
        environments: state.environments.map(env => 
          env.id === id ? { ...env, variables } : env
        )
      })),

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      openTab: (requestId) => set((state) => {
        const alreadyOpen = state.tabs.includes(requestId);
        const nextTabs = alreadyOpen ? state.tabs : [...state.tabs, requestId];
        return {
          tabs: nextTabs,
          activeTabId: requestId
        };
      }),

      closeTab: (requestId) => set((state) => {
        const nextTabs = state.tabs.filter(t => t !== requestId);
        let nextActive = state.activeTabId;
        if (state.activeTabId === requestId) {
          nextActive = nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null;
        }
        return {
          tabs: nextTabs,
          activeTabId: nextActive
        };
      }),

      setActiveTab: (requestId) => set({ activeTabId: requestId })
    }),
    {
      name: 'api-client-storage', // saves setup into LocalStorage
      partialize: (state) => ({
        collections: state.collections,
        environments: state.environments,
        activeEnvironmentId: state.activeEnvironmentId
      })
    }
  )
);