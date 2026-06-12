'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
  photoUrl?: string;
  photoStoragePath?: string;
}

function TeamContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [number, setNumber] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [photoError, setPhotoError] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const response = await fetch(`/api/team?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch team');

      const data = await response.json();
      if (data.success) {
        setPlayers(data.players || []);
        // Clear localStorage after successful migration
        localStorage.removeItem('mastro_team');
      }
    } catch (error) {
      console.error('Error loading team from Firestore:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('mastro_team');
      if (stored) {
        try {
          setPlayers(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing team:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!name.trim() || !position.trim() || !number.trim()) {
      setFormError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const email = localStorage.getItem('mastro_user');
      if (!email) {
        setFormError('Pas d\'utilisateur connecté');
        return;
      }

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, position, number }),
      });

      if (!response.ok) throw new Error('Failed to create player');

      const data = await response.json();
      if (data.success) {
        setPlayers([...players, data.player]);
        setName('');
        setPosition('');
        setNumber('');
        setSuccessMessage(`✓ ${name} ajouté à l'équipe`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      setFormError('Erreur lors de l\'ajout du joueur');
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) return;

    try {
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to delete player');

      const data = await response.json();
      if (data.success) {
        setPlayers(players.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error removing player:', error);
      alert('Erreur lors de la suppression du joueur');
    }
  };

  const uploadPhoto = async (playerId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError({ ...photoError, [playerId]: 'Veuillez sélectionner une image' });
      setTimeout(() => setPhotoError(prev => { const next = { ...prev }; delete next[playerId]; return next; }), 3000);
      return;
    }

    try {
      setUploadingId(playerId);
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      if (!storage) {
        setPhotoError({ ...photoError, [playerId]: 'Stockage photo non configuré' });
        setTimeout(() => setPhotoError(prev => { const next = { ...prev }; delete next[playerId]; return next; }), 3000);
        return;
      }

      const storagePath = `teams/${email}/players/${playerId}/photo.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);

      const response = await fetch(`/api/team/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, photoUrl, photoStoragePath: storagePath }),
      });

      if (!response.ok) throw new Error('Failed to save photo URL');

      const data = await response.json();
      if (data.success) {
        setPlayers(players.map(p => (p.id === playerId ? data.player : p)));
        setPhotoError(prev => { const next = { ...prev }; delete next[playerId]; return next; });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPhotoError({ ...photoError, [playerId]: 'Erreur lors du téléchargement de la photo' });
      setTimeout(() => setPhotoError(prev => { const next = { ...prev }; delete next[playerId]; return next; }), 3000);
    } finally {
      setUploadingId(null);
    }
  };

  if (!mounted) return null;

  const POSITIONS = ['Gardien', 'Défenseur', 'Latéral', 'Milieu', 'Ailier', 'Attaquant'];

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="team" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-2">Gestion Effectif</h1>
        <p className="text-[#9CA3AF] mb-6 md:mb-8 text-sm md:text-base">Gérez les joueurs de votre équipe</p>

        {/* Add Player Form */}
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-base md:text-lg font-bold text-[#F3F4F6] mb-4">Ajouter un joueur</h2>
          <form onSubmit={addPlayer} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
              <input
                type="text"
                placeholder="Nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] min-h-[44px] disabled:opacity-50"
              />
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={loading}
                className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] min-h-[44px] disabled:opacity-50"
              >
                <option value="">Poste</option>
                {POSITIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Numéro"
                min="1"
                max="99"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                disabled={loading}
                className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] min-h-[44px] disabled:opacity-50"
              />
              <button
                type="submit"
                className="bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50 min-h-[44px]"
                disabled={!name || !position || !number || loading}
              >
                {loading ? '⏳ Ajout...' : '+ Ajouter'}
              </button>
            </div>
            {formError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm animate-fade-in">
                ⚠️ {formError}
              </div>
            )}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-4 py-3 text-green-400 text-sm animate-fade-in">
                {successMessage}
              </div>
            )}
          </form>
        </div>

        {/* Players Grid */}
        {players.length === 0 ? (
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8 md:p-12 text-center">
            <div className="text-3xl md:text-4xl mb-4">👥</div>
            <p className="text-[#9CA3AF] text-sm md:text-base">Aucun joueur pour le moment. Commencez par en ajouter un !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-6 hover:border-[rgba(57,255,20,0.4)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[rgba(57,255,20,0.1)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#39FF14] font-black text-sm md:text-lg">{player.number}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#F3F4F6] text-sm md:text-base truncate">{player.name}</h3>
                      <p className="text-[#9CA3AF] text-xs md:text-sm truncate">{player.position}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) uploadPhoto(player.id, file);
                      }}
                      disabled={uploadingId === player.id}
                      className="hidden"
                    />
                    <span className="block w-full text-xs md:text-sm bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-3 py-2 rounded hover:bg-[rgba(57,255,20,0.2)] transition-all cursor-pointer text-center disabled:opacity-50 min-h-[40px] md:min-h-[44px] flex items-center justify-center">
                      {uploadingId === player.id ? '⏳ Upload...' : '📷 Photo'}
                    </span>
                  </label>
                  {photoError[player.id] && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded px-2 py-1.5 text-red-400 text-xs">
                      {photoError[player.id]}
                    </div>
                  )}
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="w-full text-xs md:text-sm bg-red-500/20 text-red-400 px-3 py-2 rounded hover:bg-red-500/30 transition-all min-h-[40px] md:min-h-[44px]"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function TeamPage() {
  return (
    <AccessGate>
      <TeamContent />
    </AccessGate>
  );
}
