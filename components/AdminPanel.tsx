'use client';

import React, { useState, useEffect } from 'react';
import { useApiStore } from '@/store/useApiStore';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { user: currentUser } = useApiStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user role');
      }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const regularCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-sm text-gray-200 select-none pb-12">
      {/* Title Header Card */}
      <div className="flex justify-between items-center bg-[#0e1017] p-5 rounded-xl border border-white/[0.04] shadow-md">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            User Management Console
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Manage users, view roles, and configure accessibility settings for NekoAPI.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xl">
          🛡️
        </div>
      </div>

      {/* Stats indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0e1017] border border-white/[0.04] p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Total Registers</span>
          <span className="text-2xl font-black text-white mt-1 font-mono">{totalUsers}</span>
          <div className="absolute right-4 bottom-2 text-3xl opacity-10">👥</div>
        </div>
        <div className="bg-[#0e1017] border border-white/[0.04] p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Administrator Accounts</span>
          <span className="text-2xl font-black text-violet-400 mt-1 font-mono">{adminCount}</span>
          <div className="absolute right-4 bottom-2 text-3xl opacity-10">🛡️</div>
        </div>
        <div className="bg-[#0e1017] border border-white/[0.04] p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Standard User Accounts</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 font-mono">{regularCount}</span>
          <div className="absolute right-4 bottom-2 text-3xl opacity-10">👤</div>
        </div>
      </div>

      {/* Main Users Table Card */}
      <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-white/[0.04] flex justify-between items-center bg-white/[0.002]">
          <span className="font-bold text-gray-300">Registered Directory</span>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg bg-violet-950/20 border border-violet-900/30 transition flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/15 border-b border-rose-950/30 text-rose-400 text-xs flex gap-2">
            <span>⚠️</span>
            <span>Error: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <div className="spinner" />
            <span className="text-xs font-mono">Retrieving directory records...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-600 text-xs italic">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto select-text">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {users.map((item) => {
                  const isSelf = item.id === currentUser?.id;
                  const isLoading = actionLoadingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition">
                      <td className="px-5 py-3.5 font-semibold text-gray-200">
                        <div className="flex items-center gap-2">
                          <span>{item.username}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-violet-900/40 text-violet-400 border border-violet-850 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 font-mono">
                        {item.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`method-badge ${item.role === 'admin' ? 'method-patch' : 'method-get'}`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex gap-2.5 justify-end items-center">
                          <button
                            onClick={() => handleToggleRole(item.id, item.role)}
                            disabled={isSelf || isLoading}
                            className="text-violet-400 hover:text-violet-300 font-medium hover:underline disabled:opacity-40 disabled:hover:no-underline transition"
                          >
                            {isLoading && actionLoadingId === item.id
                              ? 'Saving...'
                              : `Make ${item.role === 'admin' ? 'User' : 'Admin'}`}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item.id, item.username)}
                            disabled={isSelf || isLoading}
                            className="text-rose-400 hover:text-rose-300 font-medium hover:underline disabled:opacity-40 disabled:hover:no-underline transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
