'use client';

import { useState, useEffect } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  time: string;
  venue: string;
  competition?: string;
  availablePlayerIds: string[];
}

interface Training {
  id: string;
  type: string;
  date: string;
  time: string;
  location: string;
  availablePlayerIds: string[];
  notes?: string;
}

type ScheduleEvent = (Match & { type: 'match' }) | (Training & { type: 'training' });

function ScheduleContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'add'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventType, setEventType] = useState<'match' | 'training'>('match');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    opponent: '',
    venue: '',
    competition: '',
    type: 'Tactique',
    location: '',
    notes: '',
    date: '',
    time: '',
    playerIds: [] as string[],
  });

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      // Load players
      const playersRes = await fetch(`/api/team?email=${encodeURIComponent(email)}`);
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData.players || []);
      }

      // Load matches and trainings for current year
      const year = new Date().getFullYear();
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;

      const matchesRes = await fetch(
        `/api/schedule/matches?email=${encodeURIComponent(email)}&from=${from}&to=${to}`
      );
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches || []);
      }

      const trainingsRes = await fetch(
        `/api/schedule/trainings?email=${encodeURIComponent(email)}&from=${from}&to=${to}`
      );
      if (trainingsRes.ok) {
        const trainingsData = await trainingsRes.json();
        setTrainings(trainingsData.trainings || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      setIsSubmitting(true);
      const email = localStorage.getItem('mastro_user');
      if (!email || !formData.date || !formData.time) {
        setFormError('Veuillez remplir la date et l\'heure');
        setIsSubmitting(false);
        return;
      }

      if (eventType === 'match') {
        if (!formData.opponent || !formData.venue) {
          setFormError('Veuillez remplir tous les champs du match');
          setIsSubmitting(false);
          return;
        }

        const response = await fetch('/api/schedule/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            opponent: formData.opponent,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            competition: formData.competition || undefined,
            availablePlayerIds: formData.playerIds,
          }),
        });

        if (!response.ok) throw new Error('Failed to create match');

        const data = await response.json();
        setMatches([...matches, data.match]);
      } else {
        if (!formData.location || !formData.type) {
          setFormError('Veuillez remplir tous les champs d\'entraînement');
          setIsSubmitting(false);
          return;
        }

        const response = await fetch('/api/schedule/trainings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            type: formData.type,
            date: formData.date,
            time: formData.time,
            location: formData.location,
            notes: formData.notes || undefined,
            availablePlayerIds: formData.playerIds,
          }),
        });

        if (!response.ok) throw new Error('Failed to create training');

        const data = await response.json();
        setTrainings([...trainings, data.training]);
      }

      // Reset form
      setFormData({
        opponent: '',
        venue: '',
        competition: '',
        type: 'Tactique',
        location: '',
        notes: '',
        date: '',
        time: '',
        playerIds: [],
      });
      setActiveTab('calendar');
    } catch (error) {
      console.error('Error adding event:', error);
      setFormError('Erreur lors de l\'ajout de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEvent = async (id: string, type: 'match' | 'training') => {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const endpoint = type === 'match' ? `/api/schedule/matches/${id}` : `/api/schedule/trainings/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      if (type === 'match') {
        setMatches(matches.filter(m => m.id !== id));
      } else {
        setTrainings(trainings.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (!mounted) return null;

  const allEvents: ScheduleEvent[] = [
    ...matches.map(m => ({ ...m, type: 'match' as const })),
    ...trainings.map(t => ({ ...t, type: 'training' as const })),
  ].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Generate calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  const getEventsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter(e => e.date === dateStr);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="schedule" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-4xl md:text-5xl font-black text-[#F3F4F6] mb-2">Programmation</h1>
        <p className="text-[#9CA3AF] text-lg mb-8">Gérez votre saison : matchs et entraînements</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[rgba(57,255,20,0.1)]">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'calendar'
                ? 'text-[#39FF14] border-b-2 border-[#39FF14]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            📅 Calendrier
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'list'
                ? 'text-[#39FF14] border-b-2 border-[#39FF14]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            📋 Liste
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'add'
                ? 'text-[#39FF14] border-b-2 border-[#39FF14]'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            ➕ Ajouter
          </button>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#F3F4F6]">
                {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(year, month - 1))}
                  className="px-4 py-2 bg-[rgba(57,255,20,0.1)] text-[#39FF14] rounded-lg hover:bg-[rgba(57,255,20,0.2)]"
                >
                  ◀ Préc
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-[rgba(57,255,20,0.1)] text-[#39FF14] rounded-lg hover:bg-[rgba(57,255,20,0.2)]"
                >
                  Auj
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(year, month + 1))}
                  className="px-4 py-2 bg-[rgba(57,255,20,0.1)] text-[#39FF14] rounded-lg hover:bg-[rgba(57,255,20,0.2)]"
                >
                  Suiv ▶
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-[#9CA3AF] text-sm font-bold py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const today = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`aspect-square p-2 rounded-lg border-2 flex flex-col justify-start ${
                      day
                        ? today
                          ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                          : 'border-[rgba(57,255,20,0.1)] hover:border-[rgba(57,255,20,0.3)]'
                        : 'border-transparent'
                    }`}
                  >
                    {day && (
                      <>
                        <span className="text-sm font-bold text-[#F3F4F6]">{day}</span>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {dayEvents.map((evt, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                evt.type === 'match' ? 'bg-[#39FF14]' : 'bg-blue-400'
                              }`}
                              title={evt.type === 'match' ? evt.opponent : evt.type}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#39FF14]" />
                <span className="text-[#9CA3AF]">Matchs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-[#9CA3AF]">Entraînements</span>
              </div>
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {allEvents.length === 0 ? (
              <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-12 text-center">
                <p className="text-[#9CA3AF]">Aucun événement programmé</p>
              </div>
            ) : (
              allEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-xl p-4 md:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            event.type === 'match'
                              ? 'bg-[#39FF14]/20 text-[#39FF14]'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {event.type === 'match' ? '⚽ Match' : '🏋️ Entraînement'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">
                        {event.type === 'match' ? `vs ${event.opponent}` : event.type}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#9CA3AF]">📅 Date</p>
                          <p className="text-[#F3F4F6] font-semibold">
                            {new Date(event.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">🕐 Heure</p>
                          <p className="text-[#F3F4F6] font-semibold">{event.time}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">📍 Lieu</p>
                          <p className="text-[#F3F4F6] font-semibold">
                            {event.type === 'match' ? event.venue : event.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">👥 Joueurs</p>
                          <p className="text-[#F3F4F6] font-semibold">{event.availablePlayerIds.length}</p>
                        </div>
                      </div>

                      {event.type === 'match' && event.competition && (
                        <div className="mt-2">
                          <p className="text-[#9CA3AF] text-sm">Compétition</p>
                          <p className="text-[#F3F4F6]">{event.competition}</p>
                        </div>
                      )}

                      {event.type === 'training' && event.notes && (
                        <div className="mt-2">
                          <p className="text-[#9CA3AF] text-sm">Notes</p>
                          <p className="text-[#F3F4F6]">{event.notes}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteEvent(event.id, event.type)}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm font-bold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Tab */}
        {activeTab === 'add' && (
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">Ajouter un événement</h2>

            {/* Event type selector */}
            <div className="flex gap-3 mb-6">
              {(['match', 'training'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setEventType(type);
                    setFormData({ ...formData, date: '', time: '' });
                  }}
                  className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${
                    eventType === type
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                      : 'border-[rgba(57,255,20,0.1)] text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {type === 'match' ? '⚽ Match' : '🏋️ Entraînement'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">📅 Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    title="Sélectionnez la date de l'événement"
                    className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">🕐 Heure *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    title="Entrez l'heure de l'événement (HH:MM)"
                    className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
                    required
                  />
                </div>

                {/* Event-specific fields */}
                {eventType === 'match' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">⚽ Adversaire *</label>
                      <input
                        type="text"
                        placeholder="Ex: Paris SG"
                        value={formData.opponent}
                        onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                        title="Entrez le nom de l'équipe adverse"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">📍 Lieu de match *</label>
                      <input
                        type="text"
                        placeholder="Ex: Stade Vélodrome"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        title="Où aura lieu le match"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">🏆 Compétition</label>
                      <input
                        type="text"
                        placeholder="Ex: Ligue 1 (optionnel)"
                        value={formData.competition}
                        onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                        title="Type de compétition (optionnel)"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">🎯 Type d'entraînement *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        title="Choisissez le type d'entraînement"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
                      >
                        <option value="Tactique">Tactique</option>
                        <option value="Physique">Physique</option>
                        <option value="Technique">Technique</option>
                        <option value="Pressing">Pressing</option>
                        <option value="Possession">Possession</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">📍 Lieu d'entraînement *</label>
                      <input
                        type="text"
                        placeholder="Ex: Terrain annexe"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        title="Où aura lieu l'entraînement"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#F3F4F6] mb-2">📝 Notes</label>
                      <textarea
                        placeholder="Notes optionnelles..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        title="Ajoutez des notes sur l'entraînement (optionnel)"
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] h-20"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Player selection */}
              <div>
                <label className="block text-sm font-semibold text-[#F3F4F6] mb-3">Joueurs disponibles</label>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-[#0A0F0D] rounded-lg p-3 border border-[rgba(57,255,20,0.1)]">
                  {players.map(player => (
                    <label key={player.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.playerIds.includes(player.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, playerIds: [...formData.playerIds, player.id] });
                          } else {
                            setFormData({
                              ...formData,
                              playerIds: formData.playerIds.filter(id => id !== player.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-[#F3F4F6]">
                        {player.name} (#{player.number})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error display */}
              {formError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                  ⚠️ {formError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-3 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? '⏳ Ajout en cours...' : '✓ Ajouter l\'événement'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SchedulePage() {
  return (
    <AccessGate>
      <ScheduleContent />
    </AccessGate>
  );
}
