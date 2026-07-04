'use client';

import React, { useState, useRef } from 'react';
import { useApiStore, KeyValueItem, RequestModel } from '@/store/useApiStore';
import { nekoConfirm, nekoAlert } from '@/lib/alert';
import Swal from 'sweetalert2';

interface SidebarProps {
  activeView: 'workspace' | 'runner' | 'admin' | 'dashboard';
  setActiveView: (view: 'workspace' | 'runner' | 'admin' | 'dashboard') => void;
}

const NEW_REQ_METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  DELETE: 'text-rose-400',
  PATCH: 'text-purple-400',
};

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const {
    collections,
    environments,
    activeEnvironmentId,
    activeTabId,
    addCollection,
    deleteCollection,
    updateCollection,
    addRequestToCollection,
    deleteRequest,
    updateRequest,
    addEnvironment,
    updateEnvironmentVariables,
    deleteEnvironment,
    setActiveEnvironment,
    openTab,
    user,
    setUser,
    moveRequestToCollection
  } = useApiStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportCollection = (col: any) => {
    try {
      const exportData = {
        name: col.name,
        requests: col.requests.map((r: any) => ({
          name: r.name,
          method: r.method,
          url: r.url,
          headers: r.headers,
          params: r.params,
          bodyType: r.bodyType,
          body: r.body,
          auth: r.auth,
        }))
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${col.name.replace(/\s+/g, '_')}_collection.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.name) {
          nekoAlert('Invalid File', 'This file is not a valid NekoAPI collection. Missing collection "name".', 'error');
          return;
        }

        Swal.fire({
          title: 'Importing...',
          text: `Creating collection "${data.name}" and importing requests.`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // 1. Create collection
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name }),
        });
        const resData = await res.json();
        if (!res.ok || !resData.collection) {
          throw new Error(resData.error || 'Failed to create collection');
        }

        const newCol = resData.collection;

        // 2. Import requests
        if (Array.isArray(data.requests)) {
          for (const req of data.requests) {
            const defaultReq = {
              name: req.name || 'Untitled Request',
              method: req.method || 'GET',
              url: req.url || '',
              headers: req.headers || [],
              params: req.params || [],
              bodyType: req.bodyType || 'none',
              body: req.body || '',
              auth: req.auth || { type: 'none' },
            };
            await fetch(`/api/collections/${newCol.id}/requests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(defaultReq),
            });
          }
        }

        // 3. Reload store
        await useApiStore.getState().fetchData();
        
        Swal.close();
        nekoAlert('Import Success', `Collection "${data.name}" imported successfully with ${data.requests?.length || 0} requests!`, 'success');
      } catch (err: any) {
        Swal.close();
        nekoAlert('Import Error', err.message || 'Could not parse collection file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Request creation state
  const [newReqName, setNewReqName] = useState('');
  const [newReqMethod, setNewReqMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [newReqUrl, setNewReqUrl] = useState('');
  const [addingReqToColId, setAddingReqToColId] = useState<string | null>(null);

  // Environment state
  const [showEnvManager, setShowEnvManager] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  // Collapsed state for collections
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});

  // Renaming state
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editingReqName, setEditingReqName] = useState('');

  const activeEnv = environments.find(e => e.id === activeEnvironmentId);

  const handleRenameCollection = (colId: string) => {
    if (editingColName.trim()) {
      updateCollection(colId, { name: editingColName.trim() });
    }
    setEditingColId(null);
  };

  const handleRenameRequest = (reqId: string) => {
    if (editingReqName.trim()) {
      updateRequest(reqId, { name: editingReqName.trim() });
    }
    setEditingReqId(null);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    addCollection(newColName.trim());
    setNewColName('');
    setShowAddCol(false);
  };

  const handleCreateRequest = (colId: string) => {
    if (!newReqName.trim()) return;
    addRequestToCollection(colId, {
      name: newReqName.trim(),
      method: newReqMethod,
      url: newReqUrl.trim(),
      headers: [],
      params: [],
      bodyType: 'none',
      body: '',
      auth: { type: 'none' }
    });
    setNewReqName('');
    setNewReqUrl('');
    setAddingReqToColId(null);
    // Auto expand collection when request is added
    setCollapsedCols(prev => ({ ...prev, [colId]: false }));
    setActiveView('workspace');
  };

  const handleCreateEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    addEnvironment(newEnvName.trim());
    setNewEnvName('');
  };

  const handleAddVariable = () => {
    if (!activeEnv) return;
    const newVar: KeyValueItem = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    updateEnvironmentVariables(activeEnv.id, [...activeEnv.variables, newVar]);
  };

  const handleUpdateVariable = (varId: string, updates: Partial<KeyValueItem>) => {
    if (!activeEnv) return;
    const nextVars = activeEnv.variables.map(v => 
      v.id === varId ? { ...v, ...updates } : v
    );
    updateEnvironmentVariables(activeEnv.id, nextVars);
  };

  const handleDeleteVariable = (varId: string) => {
    if (!activeEnv) return;
    const nextVars = activeEnv.variables.filter(v => v.id !== varId);
    updateEnvironmentVariables(activeEnv.id, nextVars);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-patch';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  // Filter collections and requests based on search query
  const filteredCollections = collections.map(col => {
    const matchedRequests = col.requests.filter(req => 
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.method.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isColMatch = col.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (isColMatch || matchedRequests.length > 0) {
      return {
        ...col,
        requests: isColMatch ? col.requests : matchedRequests
      };
    }
    return null;
  }).filter(Boolean) as typeof collections;

  const personalCollections = filteredCollections.filter(c => !c.isShared && c.userId === user?.id);
  const sharedCollections = filteredCollections.filter(c => c.isShared);

  const renderCollectionCard = (col: any, isSharedSection: boolean) => {
    const isCollapsed = collapsedCols[col.id];
    const isOwnerOrAdmin = col.userId === user?.id || user?.role === 'admin';

    return (
      <div 
        key={col.id} 
        className={`border rounded-lg transition duration-200 overflow-hidden shadow-sm ${
          dragOverColId === col.id
            ? 'border-violet-500 bg-violet-950/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
            : 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.015]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragEnter={() => {
          setDragOverColId(col.id);
        }}
        onDragLeave={() => {
          setDragOverColId(null);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOverColId(null);
          try {
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            const { reqId, sourceColId } = JSON.parse(dataStr);
            if (sourceColId === col.id) return;
            await moveRequestToCollection(reqId, sourceColId, col.id);
          } catch (err) {
            console.error(err);
          }
        }}
      >
        
        {/* Collection Row Header */}
        <div 
          className="flex items-center justify-between p-2.5 bg-white/[0.02] cursor-pointer group"
          onClick={() => toggleCollapse(col.id)}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="text-gray-500 transition duration-200" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </div>
            {editingColId === col.id ? (
              <input
                type="text"
                value={editingColName}
                onChange={(e) => setEditingColName(e.target.value)}
                onBlur={() => handleRenameCollection(col.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameCollection(col.id);
                  if (e.key === 'Escape') setEditingColId(null);
                }}
                className="flex-1 min-w-0 bg-[#090a0f] border border-violet-500/50 px-1.5 py-0.5 rounded text-white outline-none text-xs"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="font-semibold text-gray-200 html-light-text-slate-800 truncate max-w-[130px]"
                onDoubleClick={(e) => {
                  if (isSharedSection && !isOwnerOrAdmin) return;
                  e.stopPropagation();
                  setEditingColId(col.id);
                  setEditingColName(col.name);
                }}
                title={isSharedSection && !isOwnerOrAdmin ? undefined : "Double-click to rename"}
              >
                {col.name}
              </span>
            )}
            <span className="text-[9px] bg-white/[0.06] text-gray-400 px-1.5 py-0.5 rounded-full">{col.requests.length}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
            {(!isSharedSection || isOwnerOrAdmin) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingColId(col.id);
                  setEditingColName(col.name);
                }}
                title="Rename Collection"
                className="text-gray-500 hover:text-violet-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingReqToColId(addingReqToColId === col.id ? null : col.id);
              }}
              title="Add Request"
              className="text-violet-400 hover:text-violet-300 font-semibold text-[10px] bg-violet-500/10 border border-violet-500/20 rounded px-1.5 py-0.5 transition"
            >
              + Add
            </button>
            
            {isSharedSection ? (
              isOwnerOrAdmin && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = await nekoConfirm('Make Collection Private?', `Do you want to unshare collection "${col.name}" and make it private again?`, 'Make Private');
                    if (confirmed) {
                      updateCollection(col.id, { isShared: false });
                    }
                  }}
                  title="Make Private (Unshare)"
                  className="text-gray-500 hover:text-amber-400 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              )
            ) : (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await nekoConfirm('Share Collection?', `Do you want to share collection "${col.name}" with the team? Everyone will be able to see and edit its requests.`, 'Share');
                  if (confirmed) {
                    updateCollection(col.id, { isShared: true });
                  }
                }}
                title="Share with Team"
                className="text-gray-500 hover:text-violet-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                exportCollection(col);
              }}
              title="Export Collection"
              className="text-gray-500 hover:text-emerald-400 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            
            {(!isSharedSection || isOwnerOrAdmin) && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = await nekoConfirm('Delete Collection?', 'Are you sure you want to delete this collection and all its requests?', 'Delete');
                  if (confirmed) {
                    deleteCollection(col.id);
                  }
                }}
                title="Delete Collection"
                className="text-gray-500 hover:text-rose-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Add Request Form inside Collection */}
        {addingReqToColId === col.id && (
          <div className="p-3 border-b border-white/[0.04] bg-[#0c0d13]/80 flex flex-col gap-2 animate-slide-down">
            <span className="text-[9px] uppercase font-semibold text-gray-500">Create New Request</span>
            <input
              type="text"
              placeholder="Request name..."
              value={newReqName}
              onChange={(e) => setNewReqName(e.target.value)}
              className="w-full bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded text-white outline-none text-xs"
              autoFocus
            />
            <div className="flex gap-1.5">
              <select
                value={newReqMethod}
                onChange={(e) => setNewReqMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')}
                className={`w-20 bg-[#11131c] border border-white/[0.06] px-2 py-1.5 rounded-lg outline-none text-xs font-bold transition cursor-pointer ${NEW_REQ_METHOD_COLORS[newReqMethod] || 'text-white'}`}
              >
                <option value="GET" className="text-emerald-400">GET</option>
                <option value="POST" className="text-blue-400">POST</option>
                <option value="PUT" className="text-amber-400">PUT</option>
                <option value="DELETE" className="text-rose-400">DELETE</option>
                <option value="PATCH" className="text-purple-400">PATCH</option>
              </select>
              <input
                type="text"
                placeholder="https://api.com/path or {{baseUrl}}/path"
                value={newReqUrl}
                onChange={(e) => setNewReqUrl(e.target.value)}
                className="flex-1 min-w-0 bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1.5 rounded-lg text-white outline-none text-xs font-mono transition placeholder-gray-600"
              />
            </div>
            <div className="flex justify-end gap-1.5 mt-1">
              <button
                onClick={() => setAddingReqToColId(null)}
                className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] rounded text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateRequest(col.id)}
                className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 rounded text-white transition"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Requests List */}
        {!isCollapsed && (
          <div className="flex flex-col bg-white/[0.005] animate-slide-down">
            {col.requests.length === 0 && (
              <div className="text-[10px] text-gray-500 italic p-3 text-center border-t border-white/[0.02]">
                No requests inside this collection.
              </div>
            )}
            {col.requests.map((req: RequestModel) => {
              const isTabActive = activeTabId === req.id;
              return (
                <div
                  key={req.id}
                  className={`flex items-center justify-between px-3 py-2.5 border-t border-white/[0.02] cursor-pointer group transition duration-150 select-none ${
                    isTabActive ? 'bg-violet-950/20' : 'hover:bg-white/[0.02]'
                  }`}
                  style={{ borderLeft: isTabActive ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
                  onClick={() => {
                    openTab(req.id);
                    setActiveView('workspace');
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ reqId: req.id, sourceColId: col.id }));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                    <span className={`method-badge ${getMethodBadgeClass(req.method)}`}>
                      {req.method}
                    </span>
                    {editingReqId === req.id ? (
                      <input
                        type="text"
                        value={editingReqName}
                        onChange={(e) => setEditingReqName(e.target.value)}
                        onBlur={() => handleRenameRequest(req.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameRequest(req.id);
                          if (e.key === 'Escape') setEditingReqId(null);
                        }}
                        className="flex-1 min-w-0 bg-[#090a0f] border border-violet-500/50 px-1.5 py-0.5 rounded text-white outline-none text-xs font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className={`truncate max-w-[130px] text-xs transition-colors duration-150 ${
                          isTabActive ? 'text-violet-300 html-light-text-violet-700 font-semibold' : 'text-gray-400 html-light-text-gray-700'
                        }`}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingReqId(req.id);
                          setEditingReqName(req.name);
                        }}
                        title="Double-click to rename"
                      >
                        {req.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReqId(req.id);
                        setEditingReqName(req.name);
                      }}
                      title="Rename Request"
                      className="text-gray-500 hover:text-violet-400 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await nekoConfirm('Delete Request?', `Are you sure you want to delete request "${req.name}"?`, 'Delete');
                        if (confirmed) {
                          deleteRequest(col.id, req.id);
                        }
                      }}
                      className="text-gray-500 hover:text-rose-400 transition"
                      title="Delete Request"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full text-xs text-gray-300 select-none">
      
      {/* Search and Settings buttons */}
      <div className="p-4 flex flex-col gap-3 border-b border-white/[0.04] bg-[#0c0e15]/50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search collections or paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#11131c] border border-white/[0.06] focus:border-violet-500/50 pl-8 pr-3 py-1.5 rounded-md text-gray-200 outline-none transition duration-200 placeholder-gray-500 text-xs"
          />
          <div className="absolute left-2.5 top-2 text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Collections Panel Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/[0.01]">
        <span className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Collections</span>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-gray-200 font-medium text-[10px] bg-white/[0.02] hover:bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.06] hover:border-white/10 transition duration-200 cursor-pointer"
            title="Import Collection"
          >
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => setShowAddCol(!showAddCol)}
            className="text-violet-400 hover:text-violet-300 font-medium text-xs bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20 hover:border-violet-500/40 transition duration-200"
          >
            + New
          </button>
        </div>
      </div>

      {/* Add Collection input */}
      {showAddCol && (
        <form onSubmit={handleCreateCollection} className="mx-3 mb-2 p-2 border border-white/[0.06] rounded-md bg-[#10121a] flex gap-1.5 animate-slide-down">
          <input
            type="text"
            placeholder="Collection name..."
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            className="flex-1 bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 px-2.5 py-1 rounded text-white outline-none"
            autoFocus
          />
          <button type="submit" className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 rounded text-white font-medium transition">Add</button>
        </form>
      )}

      {/* Collections & Requests List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4">
        {filteredCollections.length === 0 && (
          <div className="text-center text-gray-500 py-12 select-none border border-dashed border-white/[0.04] rounded-lg bg-white/[0.005]">
            {searchQuery ? 'No match found' : 'No collections created'}
          </div>
        )}

        {/* Personal Workspace */}
        {filteredCollections.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1 py-1 border-b border-white/[0.02]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">👤 Personal Workspace</span>
            </div>
            {personalCollections.length === 0 ? (
              <div className="text-center text-gray-600 py-6 italic border border-dashed border-white/[0.03] rounded-lg bg-white/[0.002] text-[11px]">
                No personal collections.
              </div>
            ) : (
              personalCollections.map(col => renderCollectionCard(col, false))
            )}
          </div>
        )}

        {/* Team Workspace */}
        {filteredCollections.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1 py-1 border-b border-white/[0.02]">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">👥 Team Workspace</span>
            </div>
            {sharedCollections.length === 0 ? (
              <div className="text-center text-gray-600 py-6 italic border border-dashed border-white/[0.03] rounded-lg bg-white/[0.002] text-[11px]">
                No shared collections.
              </div>
            ) : (
              sharedCollections.map(col => renderCollectionCard(col, true))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
