'use client';

import { useState } from 'react';

interface NotationSeanceProps {
  sessionId: string;
  initialRating?: number;
  initialFeedback?: string;
  initialWasExecuted?: boolean;
}

export function NotationSeance({
  sessionId,
  initialRating,
  initialFeedback,
  initialWasExecuted,
}: NotationSeanceProps) {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hovered, setHovered] = useState<number>(0);
  const [feedback, setFeedback] = useState(initialFeedback ?? '');
  const [wasExecuted, setWasExecuted] = useState(initialWasExecuted ?? false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>(
    initialRating ? 'done' : 'idle'
  );

  const displayRating = hovered || rating;

  async function submit() {
    if (rating === 0) return;
    setStatus('submitting');

    const email =
      typeof window !== 'undefined' ? localStorage.getItem('mastro_user') : null;

    try {
      const res = await fetch('/api/rate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email, rating, feedback, wasExecuted }),
      });
      const json = await res.json();
      setStatus(json.success ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const STAR_LABELS = ['', 'Mauvaise', 'Passable', 'Bien', 'Très bien', 'Excellente'];

  if (status === 'done') {
    return (
      <div className="mt-8 rounded-2xl border border-[rgba(57,255,20,0.25)] bg-[rgba(57,255,20,0.06)] p-6">
        <p className="text-center text-sm font-bold text-[#39FF14]">
          ✓ Merci pour votre retour !
        </p>
        {rating > 0 && (
          <div className="mt-2 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`text-xl ${s <= rating ? 'text-[#39FF14]' : 'text-[rgba(57,255,20,0.2)]'}`}
              >
                ★
              </span>
            ))}
          </div>
        )}
        {feedback && (
          <p className="mt-2 text-center text-xs text-[#9CA3AF] italic">"{feedback}"</p>
        )}
        <button
          onClick={() => setStatus('idle')}
          className="mt-3 block mx-auto text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-[rgba(57,255,20,0.15)] bg-[#0D1510] p-6">
      <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-[#39FF14]">
        Évaluer cette séance
      </h3>

      {/* Étoiles */}
      <div className="mb-1 flex items-center gap-2">
        <div
          className="flex gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHovered(s)}
              className={`text-3xl transition-all duration-100 ${
                s <= displayRating
                  ? 'text-[#39FF14] scale-110'
                  : 'text-[rgba(57,255,20,0.2)] hover:text-[rgba(57,255,20,0.5)]'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        {displayRating > 0 && (
          <span className="text-xs text-[#9CA3AF]">{STAR_LABELS[displayRating]}</span>
        )}
      </div>

      {/* Réalisée sur le terrain */}
      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <div
          role="checkbox"
          aria-checked={wasExecuted}
          tabIndex={0}
          onClick={() => setWasExecuted((v) => !v)}
          onKeyDown={(e) => e.key === ' ' && setWasExecuted((v) => !v)}
          className={`h-5 w-5 flex-shrink-0 rounded border transition-all ${
            wasExecuted
              ? 'border-[#39FF14] bg-[#39FF14]'
              : 'border-[rgba(57,255,20,0.3)] bg-[#0A0F0D]'
          } flex items-center justify-center`}
        >
          {wasExecuted && <span className="text-[10px] font-black text-[#0A0F0D]">✓</span>}
        </div>
        <span className="text-xs text-[#9CA3AF]">J&apos;ai réalisé cette séance sur le terrain</span>
      </label>

      {/* Feedback texte */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Commentaire libre (optionnel) — ressenti, ajustements, points de vigilance…"
        rows={3}
        className="mt-4 w-full resize-none rounded-lg border border-[rgba(57,255,20,0.15)] bg-[#0A0F0D] px-4 py-3 text-xs text-[#F3F4F6] placeholder-[#4B5563] focus:border-[#39FF14] focus:outline-none focus:shadow-[0_0_15px_rgba(57,255,20,0.2)] transition-all"
      />

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">
          Erreur lors de l&apos;envoi. Vérifiez votre connexion.
        </p>
      )}

      <button
        onClick={submit}
        disabled={rating === 0 || status === 'submitting'}
        className="mt-4 w-full rounded-lg bg-[#39FF14] py-3 text-sm font-bold text-[#0A0F0D] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'submitting' ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0F0D] border-t-transparent" />
            Envoi…
          </span>
        ) : (
          'Envoyer mon évaluation'
        )}
      </button>

      {rating === 0 && (
        <p className="mt-2 text-center text-xs text-[#4B5563]">
          Sélectionnez une note pour continuer.
        </p>
      )}
    </div>
  );
}
