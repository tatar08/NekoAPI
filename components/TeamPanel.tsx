'use client';

import React, { useState, useEffect } from 'react';
import { useApiStore } from '@/store/useApiStore';
import { nekoAlert, nekoConfirm } from '@/lib/alert';
import Swal from 'sweetalert2';

interface TeamMemberData {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface TeamData {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
  };
  members: TeamMemberData[];
}

interface InvitationData {
  id: string;
  teamId: string;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    username: string;
  };
}

export default function TeamPanel() {
  const { user: currentUser } = useApiStore();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [invitations, setInvitations] = useState<InvitationData[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const activeTeam = teams.find(t => t.id === activeTeamId);

  const fetchTeamsAndInvites = async () => {
    setLoading(true);
    try {
      const [teamsRes, invitesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/teams/invitations')
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
        if (teamsData.teams?.length > 0 && !activeTeamId) {
          setActiveTeamId(teamsData.teams[0].id);
        }
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvitations(invitesData.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load teams/invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndInvites();
  }, []);

  const handleCreateTeam = async () => {
    const { value: teamName } = await Swal.fire({
      title: 'Create New Team',
      input: 'text',
      inputPlaceholder: 'Enter team name (e.g., Appsupport, Developer)',
      showCancelButton: true,
      customClass: {
        popup: 'bg-[#0e1017] border border-white/[0.06] rounded-2xl shadow-xl p-6',
        title: 'text-base font-bold text-white pt-4',
        input: 'bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-4 py-2 text-white outline-none text-xs w-5/6 mx-auto',
        confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
        cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
      },
      buttonsStyling: false,
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Team name cannot be empty!';
        }
        return null;
      }
    });

    if (!teamName || !teamName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create team');
      }

      const data = await res.json();
      setTeams(prev => [...prev, data.team]);
      setActiveTeamId(data.team.id);
      nekoAlert('Success', `Team "${teamName.trim()}" created successfully!`, 'success');
    } catch (err: any) {
      nekoAlert('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const confirmed = await nekoConfirm(
      'Delete Team?',
      `Are you sure you want to delete the team "${teamName}"? This action will remove all members.`,
      'Delete'
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete team');
      }

      setTeams(prev => prev.filter(t => t.id !== teamId));
      if (activeTeamId === teamId) {
        setActiveTeamId(teams.find(t => t.id !== teamId)?.id || null);
      }
      nekoAlert('Deleted', 'Team deleted successfully', 'success');
    } catch (err: any) {
      nekoAlert('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!activeTeam) return;

    const { value: inviteeName } = await Swal.fire({
      title: 'Invite Team Member',
      input: 'text',
      inputPlaceholder: 'Enter user username to invite',
      showCancelButton: true,
      customClass: {
        popup: 'bg-[#0e1017] border border-white/[0.06] rounded-2xl shadow-xl p-6',
        title: 'text-base font-bold text-white pt-4',
        input: 'bg-[#090a0f] border border-white/[0.06] focus:border-violet-500/50 rounded-xl px-4 py-2 text-white outline-none text-xs w-5/6 mx-auto',
        confirmButton: 'px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
        cancelButton: 'px-4 py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ml-3',
      },
      buttonsStyling: false,
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Username is required!';
        }
        return null;
      }
    });

    if (!inviteeName || !inviteeName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${activeTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteeName.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send invite');
      }

      nekoAlert('Invitation Sent', `Invitation successfully sent to "${inviteeName.trim()}"!`, 'success');
    } catch (err: any) {
      nekoAlert('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/invitations/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process invitation');
      }

      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      nekoAlert('Success', `Invitation ${action === 'accept' ? 'accepted' : 'declined'} successfully!`, 'success');
      
      // Reload teams to show newly joined team
      await fetchTeamsAndInvites();
    } catch (err: any) {
      nekoAlert('Error', err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isOwnerOrAdmin = activeTeam && (activeTeam.creatorId === currentUser?.id || currentUser?.role === 'admin');

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 text-sm text-gray-200 select-none pb-12">
      {/* Title Header Card */}
      <div className="flex justify-between items-center bg-[#0e1017] p-5 rounded-xl border border-white/[0.04] shadow-md">
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Team Collaboration Hub
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Create work groups, manage rosters, and invite team members to collaborate on shared collections.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xl">
          👥
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Teams List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <button
            onClick={handleCreateTeam}
            disabled={actionLoading}
            className="w-full btn-primary py-3 text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-98 transition duration-200"
          >
            <span>➕</span>
            <span>Create New Team</span>
          </button>

          <div className="bg-[#0e1017] border border-white/[0.04] rounded-xl p-4 flex flex-col gap-3 min-h-[280px]">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Your Teams</span>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-600">
                <div className="spinner w-4 h-4 border-2" />
                <span className="text-[10px] font-mono">Syncing...</span>
              </div>
            ) : teams.length === 0 ? (
              <p className="text-gray-600 text-xs italic text-center py-10">No teams joined yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[350px] pr-0.5">
                {teams.map((t) => {
                  const isActive = activeTeamId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTeamId(t.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-semibold flex justify-between items-center transition cursor-pointer ${
                        isActive
                          ? 'bg-violet-950/20 border-violet-500/40 text-violet-300 shadow-sm'
                          : 'bg-white/[0.01] border-white/[0.03] text-gray-300 hover:bg-white/[0.02]'
                      }`}
                    >
                      <span className="truncate max-w-[100px]">{t.name}</span>
                      <span className="text-[9px] bg-white/[0.04] text-gray-500 px-1.5 py-0.5 rounded-full">
                        {t.members?.length || 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Roster & Pending Invites */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Active Team Details */}
          {activeTeam ? (
            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] overflow-hidden shadow-lg flex flex-col">
              
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.002] flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-gray-200">{activeTeam.name} Team</h3>
                  <span className="text-[10px] text-gray-500 mt-0.5">Created by {activeTeam.creator?.username || 'System'}</span>
                </div>
                
                <div className="flex gap-2.5">
                  {isOwnerOrAdmin && (
                    <>
                      <button
                        onClick={handleInviteMember}
                        disabled={actionLoading}
                        className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-violet-950/20 border border-violet-900/30 transition hover:bg-violet-950/35 cursor-pointer shadow-sm active:scale-95"
                      >
                        ✉️ Invite User
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(activeTeam.id, activeTeam.name)}
                        disabled={actionLoading}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg bg-rose-950/20 border border-rose-900/30 transition hover:bg-rose-950/35 cursor-pointer shadow-sm active:scale-95"
                      >
                        🗑️ Delete Team
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto select-text">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01] text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      <th className="px-5 py-3.5">Username</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {activeTeam.members?.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.01] transition">
                        <td className="px-5 py-3.5 font-semibold text-gray-200">
                          {m.user?.username}
                        </td>
                        <td className="px-5 py-3.5 text-gray-300 font-mono">
                          {m.user?.email}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`method-badge ${m.role === 'owner' ? 'method-patch' : 'method-get'}`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-mono text-right">
                          {new Date(m.joinedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-10 text-center text-gray-500 italic shadow-md">
              Select or create a team from the left sidebar to view its roster.
            </div>
          )}

          {/* Pending Invitations Card */}
          <div className="bg-[#0e1017] rounded-xl border border-white/[0.04] p-5 shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pending Team Invitations</span>
              <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950/20 px-2 py-0.5 rounded border border-violet-900/30">
                {invitations.length} pending
              </span>
            </div>

            {invitations.length === 0 ? (
              <p className="text-gray-600 text-xs italic py-4 text-center">You have no pending team invitations.</p>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-0.5 select-text">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex justify-between items-center px-4 py-3 rounded-lg border border-white/[0.03] bg-[#090a0f] hover:bg-[#11131c]/60 transition"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-200">
                        Join the <span className="text-violet-300 font-extrabold">{invite.team?.name}</span> team
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Invited by <span className="text-gray-400 font-bold">{invite.invitedBy?.username}</span> on {new Date(invite.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcessInvite(invite.id, 'accept')}
                        disabled={actionLoading}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition hover:scale-[1.03] active:scale-97 cursor-pointer"
                      >
                        Join Team
                      </button>
                      <button
                        onClick={() => handleProcessInvite(invite.id, 'decline')}
                        disabled={actionLoading}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition hover:scale-[1.03] active:scale-97 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
