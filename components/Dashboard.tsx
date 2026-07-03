'use client';

import React, { useState, useEffect } from 'react';
import { useApiStore } from '@/store/useApiStore';
import Swal from 'sweetalert2';

interface DashboardStats {
  totalCollections: number;
  totalRequests: number;
  totalEnvironments: number;
  totalUsers: number;
}

interface RecentCollection {
  id: string;
  name: string;
  requestCount: number;
  createdAt: string;
}

interface DashboardProps {
  setActiveView: (view: 'workspace' | 'runner' | 'admin' | 'dashboard') => void;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  GET: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]' },
  POST: { bg: 'bg-blue-500/15', text: 'text-blue-400', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]' },
  PUT: { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]' },
  DELETE: { bg: 'bg-rose-500/15', text: 'text-rose-400', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.2)]' },
  PATCH: { bg: 'bg-purple-500/15', text: 'text-purple-400', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.2)]' },
};

export default function Dashboard({ setActiveView }: DashboardProps) {
  const { user, collections, environments } = useApiStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [methodDist, setMethodDist] = useState<Record<string, number>>({});
  const [recentCols, setRecentCols] = useState<RecentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setMethodDist(data.methodDistribution || {});
          setRecentCols(data.recentCollections || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalMethodRequests = Object.values(methodDist).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-3">
        <div className="spinner" />
        <span className="text-xs font-mono">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-sm text-gray-200 select-none pb-12 animate-fade-in">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-950/30 via-[#0e1017] to-indigo-950/20 p-6 rounded-2xl border border-white/[0.04] shadow-lg">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-500/5 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-500/5 blur-[60px] pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wide">
              {greeting()}, {user?.username || 'User'} 🐱
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Welcome to your NekoAPI workspace dashboard. Here&apos;s an overview of your API testing activity.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-mono font-bold text-white/80 tabular-nums tracking-wider">
              {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
              user?.role === 'admin'
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Collections', value: stats?.totalCollections ?? collections.length, icon: '📁', color: 'from-violet-500/20 to-violet-600/5', accent: 'text-violet-400' },
          { label: 'API Requests', value: stats?.totalRequests ?? 0, icon: '🚀', color: 'from-blue-500/20 to-blue-600/5', accent: 'text-blue-400' },
          { label: 'Environments', value: stats?.totalEnvironments ?? environments.length, icon: '🌐', color: 'from-emerald-500/20 to-emerald-600/5', accent: 'text-emerald-400' },
          { label: 'Team Members', value: stats?.totalUsers ?? 0, icon: '👥', color: 'from-amber-500/20 to-amber-600/5', accent: 'text-amber-400', adminOnly: true },
        ].map((card) => {
          if (card.adminOnly && user?.role !== 'admin') return null;
          return (
            <div key={card.label} className={`relative overflow-hidden bg-gradient-to-br ${card.color} bg-[#0e1017] border border-white/[0.04] p-5 rounded-xl shadow-md group hover:border-white/[0.08] transition-all duration-300`}>
              <div className="absolute top-3 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 group-hover:scale-110 transform">
                {card.icon}
              </div>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">{card.label}</span>
              <span className={`text-3xl font-black mt-1 block font-mono tabular-nums ${card.accent}`}>
                {card.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column - Quick Actions + Method Distribution */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Quick Actions */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">⚡ Quick Actions</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveView('workspace')}
                className="bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 hover:border-violet-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">📝</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-violet-300 transition-colors">Workspace</span>
              </button>
              <button
                onClick={() => setActiveView('runner')}
                className="bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">🏃</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-300 transition-colors">Bulk Runner</span>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveView('admin')}
                  className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform duration-200">🛡️</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-amber-300 transition-colors">Admin Panel</span>
                </button>
              )}
              <button
                className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center gap-2 transition-all duration-200 group cursor-pointer"
                onClick={async () => {
                  const { addCollection } = useApiStore.getState();
                  
                  const { value: colName } = await Swal.fire({
                    title: 'Create New Collection',
                    text: 'Please enter a name for your new collection:',
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
                    await addCollection(colName.trim());
                    setActiveView('workspace');
                    Swal.close();
                  } catch (err) {
                    Swal.close();
                    console.error(err);
                  }
                }}
              >
                <span className="text-xl group-hover:scale-110 transition-transform duration-200">➕</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-emerald-300 transition-colors">New Collection</span>
              </button>
            </div>
          </div>

          {/* Method Distribution */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">📊 HTTP Method Distribution</span>
            </div>
            <div className="p-5">
              {totalMethodRequests === 0 ? (
                <p className="text-gray-600 text-xs text-center py-6 italic">No requests created yet. Start by adding a collection!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(methodDist).sort(([,a], [,b]) => b - a).map(([method, count]) => {
                    const pct = Math.round((count / totalMethodRequests) * 100);
                    const colors = METHOD_COLORS[method] || { bg: 'bg-gray-500/15', text: 'text-gray-400', glow: '' };
                    return (
                      <div key={method} className="flex items-center gap-3">
                        <span className={`w-14 text-[10px] font-bold tracking-wider ${colors.text}`}>{method}</span>
                        <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bg} ${colors.glow} transition-all duration-700`}
                            style={{ width: `${pct}%`, background: method === 'GET' ? 'rgba(16,185,129,0.5)' : method === 'POST' ? 'rgba(59,130,246,0.5)' : method === 'PUT' ? 'rgba(245,158,11,0.5)' : method === 'DELETE' ? 'rgba(239,68,68,0.5)' : method === 'PATCH' ? 'rgba(168,85,247,0.5)' : 'rgba(107,114,128,0.5)' }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{count} <span className="text-gray-600">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Environment */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002]">
              <span className="font-bold text-gray-300 text-xs">🌐 Active Environment</span>
            </div>
            <div className="p-5">
              {environments.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-4 italic">No environments configured.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {environments.slice(0, 4).map((env) => (
                    <div key={env.id} className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.06] rounded-lg px-4 py-2.5 transition">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                        <span className="font-semibold text-gray-200 text-xs">{env.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{env.variables.length} vars</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Collections + System Info */}
        <div className="lg:col-span-3 flex flex-col gap-6">

          {/* Recent Collections */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-md">
            <div className="px-5 py-3.5 border-b border-white/[0.04] bg-white/[0.002] flex justify-between items-center">
              <span className="font-bold text-gray-300 text-xs">📁 Recent Collections</span>
              <button
                onClick={() => setActiveView('workspace')}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-medium transition cursor-pointer"
              >
                View All →
              </button>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {recentCols.length === 0 ? (
                <p className="text-gray-600 text-xs text-center py-10 italic">No collections yet. Create your first one!</p>
              ) : (
                recentCols.map((col) => (
                  <div key={col.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.01] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm">
                        📁
                      </div>
                      <div>
                        <span className="font-semibold text-gray-200 text-xs block">{col.name}</span>
                        <span className="text-[9px] text-gray-500">{col.requestCount} request{col.requestCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono">
                      {new Date(col.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workspace Overview - mini cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-3">🔧 Workspace Health</span>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Database</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Auth System</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-gray-300 font-mono text-[10px]">PostgreSQL</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-md">
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-3">ℹ️ System Info</span>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Version</span>
                  <span className="text-gray-300 font-mono text-[10px]">v0.1.0</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Framework</span>
                  <span className="text-gray-300 font-mono text-[10px]">Next.js 16</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Your Role</span>
                  <span className={`font-bold text-[10px] ${user?.role === 'admin' ? 'text-violet-400' : 'text-emerald-400'}`}>
                    {user?.role || 'user'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Shortcuts */}
          <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/10 rounded-xl border border-violet-500/10 p-5 shadow-md">
            <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider block mb-3">💡 Tips & Shortcuts</span>
            <div className="grid grid-cols-1 gap-2">
              {[
                { tip: 'Use the Workspace view to create and manage API requests in collections.', icon: '📝' },
                { tip: 'The Bulk Runner lets you execute multiple requests at once for testing.', icon: '🏃' },
                { tip: 'Configure Environments to swap variable sets between dev, staging, and production.', icon: '🌐' },
                { tip: 'Admin users can manage team members and assign roles from the Admin Panel.', icon: '🛡️' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed">
                  <span className="text-sm mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
