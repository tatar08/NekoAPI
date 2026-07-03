'use client';

import React, { useState } from 'react';
import { useApiStore } from '@/store/useApiStore';
import Sidebar from '@/components/Sidebar';
import RequestEditor from '@/components/RequestEditor';
import ResponsePanel from '@/components/ResponsePanel';
import RunnerEngine from '@/components/RunnerEngine';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminPanel from '@/components/AdminPanel';
import Dashboard from '@/components/Dashboard';
import Swal from 'sweetalert2';

export default function DashboardPage() {
  const { tabs, activeTabId, collections, setActiveTab, closeTab, user, setUser, fetchData, loading, addCollection, addRequestToCollection } = useApiStore();
  const [activeView, setActiveView] = useState<'workspace' | 'runner' | 'admin' | 'dashboard'>('dashboard');
  const router = useRouter();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('neko_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('neko_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetchData();
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [setUser, fetchData, router]);

  // Helper to locate active request data across collections
  const activeRequest = collections
    .flatMap((c) => c.requests)
    .find((r) => r.id === activeTabId);

  const getMethodDotClass = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
      case 'POST': return 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]';
      case 'PUT': return 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
      case 'DELETE': return 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]';
      case 'PATCH': return 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]';
      default: return 'bg-gray-500';
    }
  };

  const handleCreateRequestClick = async () => {
    if (collections.length === 0) {
      const { value: colName } = await Swal.fire({
        title: 'Create Your First Collection',
        text: 'You need a collection to organize your requests. Please enter a collection name:',
        input: 'text',
        inputPlaceholder: 'e.g. My API Collection',
        showCancelButton: true,
        background: '#0c0d14',
        color: '#e2e8f0',
        confirmButtonText: 'Create Collection',
        customClass: {
          popup: 'border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-2xl font-sans',
          title: 'text-base font-bold text-white pt-4',
          htmlContainer: 'text-xs text-gray-400 mt-2',
          input: 'bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-4 py-2 text-white outline-none text-xs w-5/6 mx-auto',
          confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
          cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
        },
        buttonsStyling: false,
        inputValidator: (value) => {
          if (!value.trim()) {
            return 'Collection name cannot be empty!';
          }
          return null;
        }
      });

      if (!colName || !colName.trim()) return;

      Swal.fire({
        title: 'Creating Collection...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const newCol = await addCollection(colName.trim());
        if (newCol) {
          await addRequestToCollection(newCol.id, {
            name: 'New Request',
            method: 'GET',
            url: '',
            headers: [],
            params: [],
            bodyType: 'none',
            body: '',
            auth: { type: 'none' }
          });
          setActiveView('workspace');
        }
        Swal.close();
      } catch (err) {
        Swal.close();
        console.error(err);
      }
    } else {
      const collectionOptions = collections.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      
      const { value: formValues } = await Swal.fire({
        title: 'Create New Request',
        html: `
          <div class="flex flex-col gap-3 text-left px-4 font-sans text-xs">
            <div class="flex flex-col gap-1">
              <label class="text-gray-400 font-semibold">Request Name</label>
              <input id="swal-req-name" class="swal2-input bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-3 py-2 text-white outline-none text-xs w-full m-0" value="Untitled Request">
            </div>
            <div class="flex gap-2">
              <div class="flex flex-col gap-1 w-1/3">
                <label class="text-gray-400 font-semibold">Method</label>
                <select id="swal-req-method" class="swal2-input bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-3 py-2 text-white outline-none text-xs w-full m-0">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div class="flex flex-col gap-1 w-2/3">
                <label class="text-gray-400 font-semibold">Collection</label>
                <select id="swal-req-col" class="swal2-input bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-3 py-2 text-white outline-none text-xs w-full m-0">
                  ${collectionOptions}
                </select>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-gray-400 font-semibold">URL (Optional)</label>
              <input id="swal-req-url" class="swal2-input bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-3 py-2 text-white outline-none text-xs w-full m-0" placeholder="https://api.example.com/endpoint">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        background: '#0c0d14',
        color: '#e2e8f0',
        confirmButtonText: 'Create Request',
        customClass: {
          popup: 'border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-2xl font-sans max-w-sm',
          title: 'text-base font-bold text-white pt-4 pb-2',
          confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
          cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
        },
        buttonsStyling: false,
        preConfirm: () => {
          const name = (document.getElementById('swal-req-name') as HTMLInputElement).value;
          const method = (document.getElementById('swal-req-method') as HTMLSelectElement).value;
          const colId = (document.getElementById('swal-req-col') as HTMLSelectElement).value;
          const url = (document.getElementById('swal-req-url') as HTMLInputElement).value;
          
          if (!name.trim()) {
            Swal.showValidationMessage('Request name cannot be empty');
            return false;
          }
          return { name, method, colId, url };
        }
      });

      if (!formValues) return;

      Swal.fire({
        title: 'Creating Request...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await addRequestToCollection(formValues.colId, {
          name: formValues.name.trim(),
          method: formValues.method as any,
          url: formValues.url.trim(),
          headers: [],
          params: [],
          bodyType: 'none',
          body: '',
          auth: { type: 'none' }
        });
        setActiveView('workspace');
        Swal.close();
      } catch (err) {
        Swal.close();
        console.error(err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080c] text-gray-200 antialiased font-sans select-none">
      
      {/* Sidebar Panel Section */}
      <aside className="w-80 border-r border-white/[0.04] flex flex-col bg-[#0e1017] z-10">
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-white/[0.04] flex flex-col gap-3 bg-white/[0.005]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Custom glowing gradient logo */}
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-pulse-glow">
                N
              </div>
              <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-200 to-blue-400 text-sm">
                NEKOAPI
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-white/[0.06] bg-[#161822] hover:bg-[#232740] text-gray-400 hover:text-white transition duration-200 cursor-pointer flex items-center justify-center shadow-inner"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464-4.95a1 1 0 111.414 1.414L14.12 7.293a1 1 0 01-1.414-1.414l.828-.828zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-2.293 4.293a1 1 0 010 1.414L13.88 17.54a1 1 0 01-1.414-1.414l.828-.828a1 1 0 011.414 0zM11 17a1 1 0 11-2 0v-1a1 1 0 112 0v1zm-7.071-3.071a1 1 0 010-1.414l.828-.828a1 1 0 111.414 1.414l-.828.828a1 1 0 01-1.414 0zM4 10a1 1 0 100-2H3a1 1 0 000 2h1zm1.464-4.95a1 1 0 11-1.414-1.414l.828-.828a1 1 0 111.414 1.414l-.828.828z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          {/* Toggle pill buttons */}
          <div className="flex bg-[#161822] p-0.5 rounded-lg border border-white/[0.06] shadow-inner w-full">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold tracking-wide uppercase transition duration-200 text-center ${
                activeView === 'dashboard'
                  ? 'bg-violet-600/90 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('workspace')}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold tracking-wide uppercase transition duration-200 text-center ${
                activeView === 'workspace'
                  ? 'bg-violet-600/90 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => setActiveView('runner')}
              className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold tracking-wide uppercase transition duration-200 text-center ${
                activeView === 'runner'
                  ? 'bg-violet-600/90 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Runner
            </button>
          </div>
        </div>

        {/* Sidebar contents list */}
        <div className="flex-1 overflow-y-auto">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
        </div>

        {/* User Profile & Logout Panel */}
        {user && (
          <div className="p-4 border-t border-white/[0.04] bg-white/[0.002] flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                  {user.username.slice(0, 2)}
                </div>
                <div className="flex flex-col overflow-hidden text-xs">
                  <span className="font-bold text-gray-200 truncate">{user.username}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold tracking-wider">{user.role}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
              >
                Logout
              </button>
            </div>

            {user.role === 'admin' && (
              <button
                onClick={() => setActiveView('admin')}
                className="w-full px-3 py-2 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg text-[9px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
              >
                <span>🛡️</span>
                <span>Open Admin Panel</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Panel workstation layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0b10] z-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-3">
            <div className="spinner" />
            <span className="text-xs font-mono">Syncing workspace records from SQLite...</span>
          </div>
        ) : activeView === 'runner' ? (
          <div className="flex-1 overflow-auto p-8 bg-[#0c0d14]/30 animate-fade-up">
            <RunnerEngine />
          </div>
        ) : activeView === 'admin' ? (
          <div className="flex-1 overflow-auto p-8 bg-[#0c0d14]/30 animate-fade-up">
            <AdminPanel />
          </div>
        ) : activeView === 'dashboard' ? (
          <div className="flex-1 overflow-auto p-8 bg-[#0c0d14]/30 animate-fade-up">
            <Dashboard setActiveView={setActiveView} />
          </div>
        ) : (
          <>
            {/* Tabs Tracker */}
            {tabs.length > 0 ? (
              <div className="flex border-b border-white/[0.04] bg-[#0c0e15] overflow-x-auto select-none no-scrollbar h-[39px]">
                {tabs.map((tabId) => {
                  const req = collections.flatMap(c => c.requests).find(r => r.id === tabId);
                  if (!req) return null;
                  const isActive = activeTabId === tabId;

                  return (
                    <div
                      key={tabId}
                      className={`group flex items-center gap-2.5 px-4 cursor-pointer text-xs font-semibold transition duration-200 relative h-full border-r border-white/[0.03] ${
                        isActive
                          ? 'bg-[#0f1118]/80 text-violet-300'
                          : 'text-gray-400 hover:bg-[#0f1118]/40 hover:text-gray-200'
                      }`}
                      onClick={() => setActiveTab(tabId)}
                    >
                      {/* Left glowing dot indicating method type */}
                      <span className={`w-1.5 h-1.5 rounded-full ${getMethodDotClass(req.method)}`} />
                      
                      <span className="truncate max-w-[120px]">{req.name}</span>
                      
                      {/* Close button with simple scale/fade animations */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tabId);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] w-4.5 h-4.5 rounded-md flex items-center justify-center text-gray-500 hover:text-rose-400 transition duration-150 text-[13px] ml-1"
                      >
                        &times;
                      </button>

                      {/* Accent glow line below active tab */}
                      {isActive && (
                        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] rounded-t" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Content view Workspace pane */}
            {activeRequest ? (
              <div className="flex-1 flex flex-col divide-y divide-white/[0.04] overflow-hidden animate-fade-in">
                
                {/* Request input box panel */}
                <div className="p-5 bg-[#0f1118]/50 border-b border-white/[0.02]">
                  <RequestEditor request={activeRequest} />
                </div>
                
                {/* Response renderer box panel */}
                <div className="flex-1 overflow-y-auto p-5 bg-[#0a0b10]">
                  <ResponsePanel request={activeRequest} />
                </div>
                
              </div>
            ) : (
              // Enhanced Empty State with animations
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-radial from-[#131522] via-[#0a0b10] to-[#0a0b10] relative">
                
                {/* Glowing decorative blur backdrop */}
                <div className="absolute w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

                {/* Main animated landing illustration */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 text-3xl shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-pulse-glow">
                    🐱
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0b10] animate-bounce" />
                </div>

                <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  Ready to test some APIs?
                </h3>
                <p className="text-gray-500 text-xs mt-2 max-w-sm leading-relaxed">
                  Select an existing request from the sidebar, create a collection to organize them, or click &quot;Runner&quot; to start automated testing runs.
                </p>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={handleCreateRequestClick}
                    className="btn-primary"
                  >
                    Create Request
                  </button>
                  <button
                    onClick={() => setActiveView('runner')}
                    className="btn-ghost"
                  >
                    Open Bulk Runner
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}