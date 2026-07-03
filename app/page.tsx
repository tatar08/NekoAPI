'use client';

import React, { useState } from 'react';
import { useApiStore } from '@/store/useApiStore';
import Sidebar from '@/components/Sidebar';
import RequestEditor from '@/components/RequestEditor';
import ResponsePanel from '@/components/ResponsePanel';
import RunnerEngine from '@/components/RunnerEngine';

export default function DashboardPage() {
  const { tabs, activeTabId, collections, setActiveTab, closeTab } = useApiStore();
  const [showRunner, setShowRunner] = useState<boolean>(false);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07080c] text-gray-200 antialiased font-sans select-none">
      
      {/* Sidebar Panel Section */}
      <aside className="w-80 border-r border-white/[0.04] flex flex-col bg-[#0e1017] z-10">
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.005]">
          <div className="flex items-center gap-2">
            {/* Custom glowing gradient logo */}
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-500 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-pulse-glow">
              N
            </div>
            <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-200 to-blue-400 text-sm">
              NEKOAPI
            </span>
          </div>

          {/* Toggle pill buttons */}
          <div className="flex bg-[#161822] p-0.5 rounded-lg border border-white/[0.06] shadow-inner">
            <button
              onClick={() => setShowRunner(false)}
              className={`px-3 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase transition duration-200 ${
                !showRunner
                  ? 'bg-violet-600/90 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setShowRunner(true)}
              className={`px-3 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase transition duration-200 ${
                showRunner
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
          <Sidebar />
        </div>
      </aside>

      {/* Main Panel workstation layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0b10] z-0">
        {showRunner ? (
          <div className="flex-1 overflow-auto p-8 bg-[#0c0d14]/30 animate-fade-up">
            <RunnerEngine />
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
                  Select an existing request from the sidebar, create a collection to organize them, or click "Runner" to start automated testing runs.
                </p>

                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => {
                      const btn = document.querySelector('[title="Add Request"]') as HTMLButtonElement;
                      if (btn) btn.click();
                    }}
                    className="btn-primary"
                  >
                    Create Request
                  </button>
                  <button
                    onClick={() => setShowRunner(true)}
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