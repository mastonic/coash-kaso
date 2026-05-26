'use client';

import { useState, useEffect } from 'react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('amateur');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadNumber, setLeadNumber] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setLoading(true);

    try {
      // Save to server API (reliable, server-side Firestore)
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), category }),
      });

      if (response.ok) {
        const data = await response.json();
        setLeadNumber(data.leadNumber);
      } else {
        throw new Error('API error');
      }

      // Also save to localStorage for offline access
      const existingLeads = localStorage.getItem('mastro_leads');
      const leadsArray = existingLeads ? JSON.parse(existingLeads) : [];
      leadsArray.push({ email: email.toLowerCase(), category, timestamp: new Date().toISOString() });
      localStorage.setItem('mastro_leads', JSON.stringify(leadsArray));

      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting lead:', error);
      setLoading(false);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setCategory('amateur');
    setSubmitted(false);
    setLeadNumber(0);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(57,255,20,0.2)] animate-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Fermer la fenêtre"
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#39FF14] transition-colors"
        >
          ✕
        </button>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="mb-6 animate-fade-in-up">
              <h3 id="modal-title" className="text-2xl font-black text-[#F3F4F6] mb-2">
                Rejoins l'Avant-Garde
              </h3>
              <p className="text-[#9CA3AF] text-sm">
                Sois parmi les premiers à accéder à ProSéance et reçois des conseils tactiques exclusifs.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {/* Email Input */}
              <div>
                <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@example.fr"
                  aria-label="Votre email"
                  className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all"
                  required
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">
                  Profil
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Sélectionnez votre profil"
                  className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all"
                >
                  <option value="amateur">Entraîneur Amateur</option>
                  <option value="club">Club Professionnel</option>
                  <option value="academy">Académie</option>
                  <option value="federation">Fédération</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                aria-label="Débloquer l'accès à ProSéance"
                className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-3 rounded-lg transition-all duration-300 uppercase hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] disabled:opacity-50 disabled:hover:scale-100 group animate-pop"
                style={{ animationDelay: '200ms' }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-[#0A0F0D] border-t-transparent rounded-full animate-spin" />
                    Validation...
                  </span>
                ) : (
                  '⚡ Débloquer l\'Accès'
                )}
              </button>

              {/* Privacy Note */}
              <p className="text-[#5A6B6B] text-xs text-center">
                Tes données restent confidentielles. Pas de spam, c'est promis.
              </p>
            </form>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="text-center space-y-6 animate-fade-in-up">
              {/* Success Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(57,255,20,0.2)] border border-[#39FF14] animate-pulse">
                <span className="text-3xl">✨</span>
              </div>

              {/* Success Message */}
              <div className="space-y-2">
                <h4 className="text-xl font-black text-[#39FF14]">
                  Inscription validée !
                </h4>
                <p className="text-[#F3F4F6] font-bold">
                  Vous êtes <span className="text-[#39FF14]">numéro {leadNumber}</span> sur la liste d'attente.
                </p>
                <p className="text-[#9CA3AF] text-sm">
                  Votre conseiller technique IA vous contactera très vite.
                </p>
              </div>

              {/* Checkmark Animation */}
              <div className="text-5xl animate-pop">
                ✓
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
