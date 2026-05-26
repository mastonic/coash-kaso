'use client';

import { useState, useEffect } from 'react';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  const ADMIN_PASSWORD = 'mastro2026!';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authenticated || !mounted) return;
    loadLeads();
  }, [authenticated, mounted]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');

      // Load from server API (uses Firebase Admin SDK)
      const response = await fetch('/api/leads');

      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Erreur lors du chargement des leads. Veuillez réessayer.');
      setLeads([]);
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

  const downloadCSV = () => {
    const headers = ['Email', 'Profil', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...leads.map((lead: any) => [
        lead.email,
        lead.category,
        new Date(lead.timestamp).toLocaleString('fr-FR'),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `mastro-leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-[#F3F4F6]">Leads ProSéance</h1>
          <div className="flex gap-3">
            <a
              href="/admin/users"
              className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] font-bold px-6 py-3 rounded-lg hover:scale-105 transition-all text-sm"
            >
              🔑 Gérer Accès
            </a>
            <button
              onClick={downloadCSV}
              className="bg-[#39FF14] text-[#0A0F0D] font-bold px-6 py-3 rounded-lg hover:scale-105 transition-all"
            >
              📥 Télécharger CSV
            </button>
          </div>
        </div>

        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[#9CA3AF]">Total: <span className="text-[#39FF14] font-bold">{leads.length}</span> leads</p>
            {!loading && (
              <button
                onClick={loadLeads}
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
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF]">Aucun lead pour le moment</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(57,255,20,0.2)]">
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">#</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Email</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Profil</th>
                    <th className="text-left py-3 px-4 text-[#39FF14] font-bold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: any, idx: number) => (
                    <tr key={lead.id} className="border-b border-[rgba(57,255,20,0.1)] hover:bg-[#0A0F0D] transition-colors">
                      <td className="py-3 px-4 text-[#9CA3AF]">{idx + 1}</td>
                      <td className="py-3 px-4 text-[#F3F4F6]">{lead.email}</td>
                      <td className="py-3 px-4">
                        <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-3 py-1 rounded-full text-xs font-bold">
                          {lead.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#9CA3AF]">
                        {new Date(lead.timestamp).toLocaleString('fr-FR')}
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
