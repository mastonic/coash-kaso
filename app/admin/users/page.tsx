'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  category: string;
  timestamp: string;
  access: {
    status: 'active' | 'pending' | 'expired';
    activatedAt?: string;
  };
  plan?: string | null;
  trialEndsAt?: string | null;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  expired?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>('');

  const ADMIN_PASSWORD = 'mastro2026!';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated || !mounted) return;
    loadUsers();
  }, [authenticated, mounted]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/users');

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats(data.stats || { total: 0, active: 0, pending: 0 });
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs. Veuillez réessayer.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPassword('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handleActivate = async (email: string) => {
    setActionLoading(email);
    try {
      const response = await fetch('/api/admin/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        await loadUsers();
      } else {
        setError('Erreur lors de l\'activation');
      }
    } catch (err) {
      console.error('Error activating user:', err);
      setError('Erreur lors de l\'activation');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeactivate = async (email: string) => {
    setActionLoading(email);
    try {
      const response = await fetch('/api/admin/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        await loadUsers();
      } else {
        setError('Erreur lors de la désactivation');
      }
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError('Erreur lors de la désactivation');
    } finally {
      setActionLoading('');
    }
  };

  const handleActivateAll = async () => {
    setActionLoading('all');
    try {
      for (const user of users.filter(u => u.access.status !== 'active')) {
        await fetch('/api/admin/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });
      }
      await loadUsers();
    } catch (err) {
      console.error('Error activating all:', err);
      setError('Erreur lors de l\'activation de tous les utilisateurs');
    } finally {
      setActionLoading('');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center p-4">
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-black text-[#F3F4F6] mb-6">Accès Admin</h1>
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe admin"
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-3 rounded-lg hover:scale-105 transition-all"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-[#F3F4F6]">Gestion Accès</h1>
            <Link
              href="/admin/leads"
              className="text-sm bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-4 py-2 rounded hover:bg-[rgba(57,255,20,0.2)] transition-all"
            >
              📊 Voir tous les Leads
            </Link>
          </div>
        </div>

        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-[rgba(57,255,20,0.1)] p-4 rounded-lg">
              <p className="text-[#9CA3AF] text-sm">Total</p>
              <p className="text-2xl font-black text-[#39FF14]">{stats.total}</p>
            </div>
            <div className="bg-[rgba(57,255,20,0.1)] p-4 rounded-lg">
              <p className="text-[#9CA3AF] text-sm">Activés</p>
              <p className="text-2xl font-black text-[#39FF14]">{stats.active}</p>
            </div>
            <div className="bg-[rgba(248,113,113,0.08)] p-4 rounded-lg">
              <p className="text-[#9CA3AF] text-sm">Expirés</p>
              <p className="text-2xl font-black text-red-400">{stats.expired ?? 0}</p>
            </div>
            <div className="bg-[rgba(57,255,20,0.1)] p-4 rounded-lg">
              <p className="text-[#9CA3AF] text-sm">En attente</p>
              <p className="text-2xl font-black text-[#39FF14]">{stats.pending}</p>
            </div>
          </div>

          {stats.pending + (stats.expired ?? 0) > 0 && (
            <button
              onClick={handleActivateAll}
              disabled={actionLoading === 'all'}
              className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-2 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {actionLoading === 'all'
                ? '⏳ Activation...'
                : `⚡ Tout activer — 7 jours (${stats.pending + (stats.expired ?? 0)})`}
            </button>
          )}
        </div>

        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[#9CA3AF]">Total: <span className="text-[#39FF14] font-bold">{users.length}</span> utilisateurs</p>
            {!loading && (
              <button
                onClick={loadUsers}
                className="text-sm bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-3 py-1 rounded hover:bg-[rgba(57,255,20,0.2)] transition-all"
              >
                🔄 Actualiser
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-[#9CA3AF]">
              <div className="inline-block">Chargement...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF]">Aucun utilisateur pour le moment</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(57,255,20,0.2)]">
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">#</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Email</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Profil</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Date</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Plan</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Accès</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id} className="border-b border-[rgba(57,255,20,0.1)] hover:bg-[#0A0F0D] transition-colors">
                      <td className="py-3 px-4 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="py-3 px-4 text-[#F3F4F6]">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-3 py-1 rounded-full text-xs font-bold">
                          {user.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#9CA3AF]">
                        {new Date(user.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-[rgba(16,185,129,0.1)] text-[#10B981] px-3 py-1 rounded-full text-xs font-bold">
                          {user.plan ? (user.plan === 'trial' ? 'Essai' : user.plan === 'coach_pro' ? 'Coach Pro' : 'RT Manager') : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.access.status === 'active'
                              ? 'bg-[rgba(57,255,20,0.2)] text-[#39FF14]'
                              : user.access.status === 'expired'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-[rgba(156,163,175,0.1)] text-[#9CA3AF]'
                          }`}
                          title={
                            user.access.status === 'active' && user.plan === 'trial' && user.trialEndsAt
                              ? `Essai jusqu'au ${new Date(user.trialEndsAt).toLocaleDateString('fr-FR')}`
                              : undefined
                          }
                        >
                          {user.access.status === 'active'
                            ? '✓ ACTIF'
                            : user.access.status === 'expired'
                              ? '⏰ EXPIRÉ'
                              : '⏳ EN ATTENTE'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.access.status !== 'active' ? (
                          <button
                            onClick={() => handleActivate(user.email)}
                            disabled={actionLoading === user.email}
                            className="text-sm bg-[#39FF14] text-[#0A0F0D] px-3 py-1 rounded font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {actionLoading === user.email
                              ? '⏳'
                              : user.access.status === 'expired'
                                ? '🔄 Réactiver 7 j'
                                : '⚡ Activer'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(user.email)}
                            disabled={actionLoading === user.email}
                            className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                          >
                            {actionLoading === user.email ? '⏳' : '🚫 Révoquer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
