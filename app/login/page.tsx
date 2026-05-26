'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la vérification');
        setLoading(false);
        return;
      }

      if (data.hasAccess) {
        localStorage.setItem('mastro_user', email.toLowerCase());
        router.push('/coach-dashboard');
      } else {
        setError('Email non reconnu ou accès non encore activé.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4 md:px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 md:p-8">
          <h1 className="text-3xl font-black tracking-tighter text-[#F3F4F6] mb-2">
            <span>PROSEANCE</span>
            <span className="text-[#39FF14] ml-2">AI</span>
          </h1>
          <p className="text-[#9CA3AF] mb-8">L'assistant IA de ton terrain</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#F3F4F6] text-sm font-bold uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="coach@example.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#39FF14]"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-3 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-[#0A0F0D] border-t-transparent rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                '⚡ Accéder'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#9CA3AF] mt-8">
          <Link href="/" className="text-[#39FF14] hover:text-[#10B981] transition-colors">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
