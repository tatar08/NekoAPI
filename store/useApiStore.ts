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
    data: unknown;
    time: number;
    size: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  isShared?: boolean;
  userId?: string;
  requests: RequestModel[];
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValueItem[];
}

interface ApiStoreState {
  user: { id: string; username: string; role: string } | null;
  loading: boolean;
  collections: Collection[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  tabs: string[]; // List of active Request IDs
  activeTabId: string | null;
  history: { requestId: string; timestamp: number }[];
  passedRunsCount: number;
  failedRunsCount: number;
  tempRequests: RequestModel[]; // List of active temporary unsaved Requests
  
  // Actions
  setUser: (user: { id: string; username: string; role: string } | null) => void;
  fetchData: () => Promise<void>;
  
  addCollection: (name: string) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  addRequestToCollection: (collectionId: string, request: Partial<RequestModel>) => Promise<RequestModel | null>;
  updateRequest: (requestId: string, updates: Partial<RequestModel>) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
  
  addEnvironment: (name: string) => Promise<void>;
  updateEnvironmentVariables: (id: string, variables: KeyValueItem[]) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => void;
  
  openTab: (requestId: string) => void;
  closeTab: (requestId: string) => void;
  setActiveTab: (requestId: string | null) => void;
  incrementPassedRuns: (count?: number) => void;
  incrementFailedRuns: (count?: number) => void;
  resetRunStats: () => void;
  addTempRequest: () => string;
  saveTempRequest: (tempId: string, collectionId: string, name: string) => Promise<RequestModel | null>;
}

export const useApiStore = create<ApiStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      collections: [],
      environments: [],
      activeEnvironmentId: null,
      tabs: [],
      activeTabId: null,
      history: [],
      passedRunsCount: 0,
      failedRunsCount: 0,
      tempRequests: [],

      setUser: (user) => set({ user }),

      fetchData: async () => {
        set({ loading: true });
        try {
          const [colRes, envRes] = await Promise.all([
            fetch('/api/collections'),
            fetch('/api/environments')
          ]);
          
          if (colRes.ok && envRes.ok) {
            const colData = await colRes.json();
            const envData = await envRes.json();
            set({
              collections: colData.collections || [],
              environments: envData.environments || []
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          set({ loading: false });
        }
      },

      addCollection: async (name) => {
        const tempId = crypto.randomUUID();
        let createdCol: Collection | null = null;
        set((state) => ({
          collections: [...state.collections, { id: tempId, name, requests: [] }]
        }));

        try {
          const res = await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          const data = await res.json();
          if (res.ok && data.collection) {
            set((state) => ({
              collections: state.collections.map((c) => c.id === tempId ? data.collection : c)
            }));
            createdCol = data.collection;
          }
        } catch (err) {
          console.error(err);
        }
        return createdCol;
      },

      deleteCollection: async (id) => {
        set((state) => ({
          collections: state.collections.filter(c => c.id !== id)
        }));

        await fetch(`/api/collections/${id}`, {
          method: 'DELETE'
        }).catch(console.error);
      },

      updateCollection: async (id, updates) => {
        set((state) => ({
          collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c)
        }));

        const body: Record<string, any> = {};
        if ('name' in updates) body.name = updates.name;
        if ('isShared' in updates) body.isShared = updates.isShared;

        if (Object.keys(body).length > 0) {
          await fetch(`/api/collections/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(console.error);
        }
      },

      addRequestToCollection: async (collectionId, request) => {
        const tempId = crypto.randomUUID();
        const defaultReq: RequestModel = {
          id: tempId,
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

        set((state) => ({
          collections: state.collections.map((col) => {
            if (col.id === collectionId) {
              return { ...col, requests: [...col.requests, defaultReq] };
            }
            return col;
          }),
          tabs: [...state.tabs, tempId],
          activeTabId: tempId
        }));

        let createdReq: RequestModel | null = null;
        try {
          const res = await fetch(`/api/collections/${collectionId}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultReq),
          });
          const data = await res.json();
          if (res.ok && data.request) {
            set((state) => ({
              collections: state.collections.map((col) => {
                if (col.id === collectionId) {
                  return {
                    ...col,
                    requests: col.requests.map((r) => r.id === tempId ? data.request : r)
                  };
                }
                return col;
              }),
              tabs: state.tabs.map((t) => t === tempId ? data.request.id : t),
              activeTabId: state.activeTabId === tempId ? data.request.id : state.activeTabId
            }));
            createdReq = data.request;
          }
        } catch (err) {
          console.error(err);
        }
        return createdReq;
      },

      updateRequest: async (requestId, updates) => {
        if (requestId.startsWith('temp-')) {
          set((state) => ({
            tempRequests: (state.tempRequests || []).map((req) =>
              req.id === requestId ? { ...req, ...updates } : req
            )
          }));
          return;
        }

        let colId = '';
        set((state) => {
          state.collections.forEach(c => {
            if (c.requests.some(r => r.id === requestId)) colId = c.id;
          });
          
          return {
            collections: state.collections.map((col) => ({
              ...col,
              requests: col.requests.map((req) => 
                req.id === requestId ? { ...req, ...updates } : req
              )
            }))
          };
        });

        if (colId) {
          await fetch(`/api/collections/${colId}/requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }).catch(console.error);
        }
      },

      deleteRequest: async (collectionId, requestId) => {
        const nextTabs = get().tabs.filter(t => t !== requestId);
        let nextActive = get().activeTabId;
        if (get().activeTabId === requestId) {
          nextActive = nextTabs.length > 0 ? nextTabs[0] : null;
        }

        set({
          tabs: nextTabs,
          activeTabId: nextActive,
          collections: get().collections.map((col) => {
            if (col.id === collectionId) {
              return { ...col, requests: col.requests.filter(r => r.id !== requestId) };
            }
            return col;
          })
        });

        await fetch(`/api/collections/${collectionId}/requests/${requestId}`, {
          method: 'DELETE'
        }).catch(console.error);
      },

      addEnvironment: async (name) => {
        const tempId = crypto.randomUUID();
        set((state) => ({
          environments: [...state.environments, { id: tempId, name, variables: [] }]
        }));

        try {
          const res = await fetch('/api/environments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
          const data = await res.json();
          if (res.ok && data.environment) {
            set((state) => ({
              environments: state.environments.map(e => e.id === tempId ? data.environment : e)
            }));
          }
        } catch (err) {
          console.error(err);
        }
      },

      updateEnvironmentVariables: async (id, variables) => {
        set((state) => ({
          environments: state.environments.map(env => 
            env.id === id ? { ...env, variables } : env
          )
        }));

        await fetch(`/api/environments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variables }),
        }).catch(console.error);
      },

      deleteEnvironment: async (id) => {
        set((state) => {
          const nextActive = state.activeEnvironmentId === id ? null : state.activeEnvironmentId;
          return {
            activeEnvironmentId: nextActive,
            environments: state.environments.filter(env => env.id !== id)
          };
        });

        await fetch(`/api/environments/${id}`, {
          method: 'DELETE'
        }).catch(console.error);
      },

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
        
        const nextTempReqs = requestId.startsWith('temp-')
          ? (state.tempRequests || []).filter(r => r.id !== requestId)
          : (state.tempRequests || []);

        return {
          tabs: nextTabs,
          activeTabId: nextActive,
          tempRequests: nextTempReqs
        };
      }),

      setActiveTab: (requestId) => set({ activeTabId: requestId }),
      incrementPassedRuns: (count = 1) => set((state) => ({
        passedRunsCount: state.passedRunsCount + count
      })),
      incrementFailedRuns: (count = 1) => set((state) => ({
        failedRunsCount: state.failedRunsCount + count
      })),
      resetRunStats: () => set({ passedRunsCount: 0, failedRunsCount: 0 }),

      addTempRequest: () => {
        const tempId = `temp-${crypto.randomUUID()}`;
        const defaultReq: RequestModel = {
          id: tempId,
          name: 'Untitled Request',
          method: 'GET',
          url: '',
          headers: [],
          params: [],
          bodyType: 'none',
          body: '',
          auth: { type: 'none' },
        };
        set((state) => ({
          tempRequests: [...(state.tempRequests || []), defaultReq],
          tabs: [...state.tabs, tempId],
          activeTabId: tempId
        }));
        return tempId;
      },

      saveTempRequest: async (tempId, collectionId, name) => {
        const tempReq = (get().tempRequests || []).find(r => r.id === tempId);
        if (!tempReq) return null;

        const createdReq = await get().addRequestToCollection(collectionId, {
          name: name,
          method: tempReq.method,
          url: tempReq.url,
          headers: tempReq.headers,
          params: tempReq.params,
          bodyType: tempReq.bodyType,
          body: tempReq.body,
          auth: tempReq.auth
        });

        if (createdReq) {
          set((state) => {
            const nextTabs = state.tabs.map(t => t === tempId ? createdReq.id : t);
            const nextTempReqs = (state.tempRequests || []).filter(r => r.id !== tempId);
            return {
              tabs: nextTabs,
              activeTabId: state.activeTabId === tempId ? createdReq.id : state.activeTabId,
              tempRequests: nextTempReqs
            };
          });
        }

        return createdReq;
      }
    }),
    {
      name: 'api-client-storage', // saves tabs and environment selections locally
      partialize: (state) => ({
        activeEnvironmentId: state.activeEnvironmentId,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        passedRunsCount: state.passedRunsCount,
        failedRunsCount: state.failedRunsCount,
        tempRequests: state.tempRequests || []
      })
    }
  )
);