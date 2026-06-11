'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MiniGeneratorDemo } from '@/components/landing/MiniGeneratorDemo';
import { LeadModal } from '@/components/landing/LeadModal';

export default function ProSéanceLanding() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handlePricingClick = async (plan: 'trial' | 'coach_pro' | 'rt_manager') => {
    if (plan === 'trial') {
      setIsModalOpen(true);
      return;
    }

    // For paid plans, initiate checkout
    const email = localStorage.getItem('userEmail');
    if (!email) {
      // Show login/signup first
      setIsModalOpen(true);
      localStorage.setItem('selectedPlan', plan);
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();
      localStorage.setItem('selectedPlan', plan);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Erreur lors de la création du paiement');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#0A0F0D] text-[#F3F4F6] overflow-x-hidden">
      {/* Animated neon grid background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(57,255,20,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(57,255,20,0.02)_1px,transparent_1px)] bg-[60px_60px]"></div>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-[#39FF14] rounded-full blur-3xl opacity-5 animate-pulse"></div>
        <div className="absolute bottom-20 left-0 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] bg-[#10B981] rounded-full blur-3xl opacity-3"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-[rgba(57,255,20,0.1)] backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
            <div className="text-2xl md:text-3xl font-black tracking-tighter animate-fade-in-up">
              <span className="text-[#F3F4F6]">PROSEANCE</span>
              <span className="text-[#39FF14] ml-1 md:ml-2">AI</span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-12 items-center">
              <a href="#features" className="text-[#9CA3AF] hover:text-[#39FF14] hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all duration-200 text-sm font-semibold uppercase tracking-wide">
                Capacités
              </a>
              <a href="#roles" className="text-[#9CA3AF] hover:text-[#39FF14] hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all duration-200 text-sm font-semibold uppercase tracking-wide">
                Pour Qui
              </a>
              <a href="#pricing" className="text-[#9CA3AF] hover:text-[#39FF14] hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all duration-200 text-sm font-semibold uppercase tracking-wide">
                Tarifs
              </a>
              <div className="border-l border-[rgba(57,255,20,0.2)] md:pl-12 flex gap-4">
                <Link href="/login" className="text-[#39FF14] hover:text-[#10B981] font-bold py-2 px-4 rounded hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-sm">
                  🔑 Se Connecter
                </Link>
                <Link href="/admin/leads" className="text-[#9CA3AF] hover:text-[#39FF14] font-bold py-2 px-4 rounded hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-sm">
                  ⚙️ Admin
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#39FF14] hover:text-[#39FF14]/80 transition-colors flex items-center gap-2"
              title="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[rgba(57,255,20,0.1)] bg-[#0A0F0D]/95 backdrop-blur-md">
              <div className="px-4 py-4 space-y-3 max-w-7xl mx-auto">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#9CA3AF] hover:text-[#39FF14] font-semibold text-sm uppercase tracking-wide py-2 transition-colors"
                >
                  Capacités
                </a>
                <a
                  href="#roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#9CA3AF] hover:text-[#39FF14] font-semibold text-sm uppercase tracking-wide py-2 transition-colors"
                >
                  Pour Qui
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#9CA3AF] hover:text-[#39FF14] font-semibold text-sm uppercase tracking-wide py-2 transition-colors"
                >
                  Tarifs
                </a>
                <div className="border-t border-[rgba(57,255,20,0.2)] pt-3 mt-3 space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#39FF14] hover:text-[#10B981] font-bold py-2 px-3 rounded hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-xs text-center"
                  >
                    🔑 Se Connecter
                  </Link>
                  <Link
                    href="/admin/leads"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#9CA3AF] hover:text-[#39FF14] font-bold py-2 px-3 rounded hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-xs text-center"
                  >
                    ⚙️ Admin
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section - Product First with Mini Demo */}
        <section className="relative overflow-hidden py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Hero Text */}
            <div className="text-center mb-12 md:mb-20 space-y-4 md:space-y-6 animate-fade-in-up">
              <div className="inline-block">
                <span className="text-xs font-black uppercase tracking-widest text-[#39FF14] bg-[rgba(57,255,20,0.1)] px-3 md:px-4 py-2 rounded-full border border-[rgba(57,255,20,0.3)]">
                  ⚡ L'assistant IA de ton terrain
                </span>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tighter">
                  <span className="text-[#F3F4F6]">Génère des</span>
                  <br />
                  <span className="text-[#39FF14] drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]">séances en 3 sec</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto px-2">
                  ProSéance génère des séances complètes selon la méthodologie FFF — chaque exercice avec son plan illustré, ses consignes et ses critères de réussite. Installable sur ton téléphone, utilisable au bord du terrain.
                </p>
              </div>

              {/* Mini CTA */}
              <div className="flex flex-col gap-3 justify-center pt-2 md:pt-4 w-full sm:w-auto sm:mx-auto">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group relative inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 font-bold text-[#0A0F0D] bg-[#39FF14] rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(57,255,20,0.8)] uppercase tracking-wide animate-pop text-sm md:text-base"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                  <span className="relative z-10 whitespace-nowrap">⚡ Accès Complet (7j)</span>
                </button>
              </div>

              {/* Login Link for Existing Users */}
              <div className="text-center pt-2">
                <p className="text-[#9CA3AF] text-xs md:text-sm px-2">
                  Déjà inscrit?{' '}
                  <Link href="/login" className="text-[#39FF14] font-bold hover:text-[#10B981] hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.5)] transition-all duration-200">
                    Se connecter →
                  </Link>
                </p>
              </div>
            </div>

            {/* Mini Generator Demo - Center Product */}
            <div className="mb-12 md:mb-24 animate-fade-in-up overflow-x-hidden" style={{ animationDelay: '100ms' }}>
              <MiniGeneratorDemo />
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 pt-6 md:pt-12 pb-12 md:pb-24 text-xs md:text-sm text-[#9CA3AF] animate-fade-in-up px-4" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14] text-lg">✓</span>
                <span>Gratuit 7 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14] text-lg">✓</span>
                <span>Sans code carte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14] text-lg">✓</span>
                <span>Annulable 1 clic</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 space-y-8 md:space-y-16 animate-fade-in-up">
          <div className="text-center space-y-3 md:space-y-4 animate-fade-in-up px-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter">
              <span className="text-[#F3F4F6]">Triple Force</span>
              <br />
              <span className="text-[#39FF14]">du Coaching IA</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: '⚡',
                title: 'Séances FFF illustrées',
                desc: 'Méthodologie FFF : mise en train, jeu, situation, match. Chaque exercice avec son plan.',
                details: [
                  '📐 Plan illustré de chaque exercice (joueurs, plots, flèches)',
                  '📋 Fiches complètes : but, consignes, variantes, critères de réussite',
                  '👶 Toutes catégories : U6-U7 → Seniors',
                  '🖨 Impression / export PDF de la fiche de séance',
                  '💾 Historique de vos 50 dernières séances',
                ]
              },
              {
                icon: '🎬',
                title: 'Analyser Vidéos',
                desc: 'Gemini Vision : forces, faiblesses, axes progression.',
                details: [
                  '🤖 Vision IA pour tactique',
                  '🎬 Analyse de formation détaillée',
                  '📹 Support vidéo match/entraînement',
                  '💡 Recommandations personnalisées',
                  '🔄 Illimité sur Pro',
                ]
              },
              {
                icon: '📅',
                title: 'Piloter la Saison',
                desc: 'Programmation auto. Charges adaptées. Multi-équipes.',
                details: [
                  '🗓️ Calendrier saison automatique',
                  '⚽ Adaptation J-4 à J+1 des matchs',
                  '👥 Gestion multi-équipes (RT)',
                  '📊 Dashboard temps réel',
                  '📋 Programmation matchs/entraînements',
                ]
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="group relative p-6 md:p-8 rounded-lg border border-[#141E1A] bg-[#141E1A] hover:border-[#39FF14] hover:bg-[rgba(57,255,20,0.05)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl mb-4 transition-transform duration-300 group-hover:scale-110">{feat.icon}</div>
                <h3 className="text-lg md:text-xl font-bold text-[#F3F4F6] mb-2 group-hover:text-[#39FF14] transition-colors">{feat.title}</h3>
                <p className="text-xs md:text-sm text-[#9CA3AF] leading-relaxed">{feat.desc}</p>
                <div className="mt-4 md:mt-6 flex items-center gap-2 text-[#39FF14] font-bold text-xs md:text-sm group-hover:translate-x-2 transition-transform">
                  Explorer <span>→</span>
                </div>

                {/* Hover Details */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 p-6 md:p-8 rounded-lg bg-[#0A0F0D]/95 backdrop-blur-sm border border-[#39FF14] flex flex-col justify-start">
                    <p className="text-[#39FF14] font-bold text-sm mb-3">Inclus:</p>
                    <ul className="space-y-2">
                      {feat.details.map((detail, didx) => (
                        <li key={didx} className="text-xs text-[#9CA3AF] flex items-start gap-2">
                          <span className="text-[#39FF14] flex-shrink-0 mt-0.5">{detail.split(' ')[0]}</span>
                          <span>{detail.substring(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section id="roles" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 space-y-8 md:space-y-12 animate-fade-in-up">
          <div className="text-center space-y-3 md:space-y-4 animate-fade-in-up px-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-[#F3F4F6]">
              Deux chemins. Une vision : <span className="text-[#39FF14]">gagner du temps</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-12">
            {/* Coach */}
            <div className="space-y-4 md:space-y-6 p-6 md:p-8 rounded-lg border border-[#141E1A] bg-[#141E1A] hover:border-[#39FF14] transition-all duration-300 hover:shadow-[0_0_30px_rgba(57,255,20,0.2)] animate-fade-in-up">
              <div>
                <div className="text-5xl md:text-6xl mb-3 md:mb-4">🎯</div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#F3F4F6] mb-2">Entraîneur Principal</h3>
                <p className="text-xs md:text-base text-[#9CA3AF]">Gagne 2h/semaine. Focus équipe.</p>
              </div>
              <ul className="space-y-2 md:space-y-3">
                {[
                  'Séance générée en 3s adaptée à TON effectif',
                  'Upload vidéo → Analyse IA immédiate',
                  'Historique : vois tes 50 meilleures séances',
                  'Charge du jour : adaptation physique auto',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 md:gap-3 animate-fade-in-up text-xs md:text-sm" style={{ animationDelay: `${idx * 50}ms` }}>
                    <span className="text-[#39FF14] text-lg md:text-xl flex-shrink-0">✓</span>
                    <span className="text-[#9CA3AF]">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative block text-center mt-4 md:mt-6 px-6 py-2 md:py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all uppercase tracking-wide hover:scale-105 w-full text-xs md:text-sm"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
                <span className="relative z-10">Essayer Maintenant</span>
              </button>
            </div>

            {/* RT */}
            <div className="space-y-4 md:space-y-6 p-6 md:p-8 rounded-lg border border-[#39FF14] bg-[rgba(57,255,20,0.05)] hover:shadow-[0_0_40px_rgba(57,255,20,0.3)] transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div>
                <div className="text-5xl md:text-6xl mb-3 md:mb-4">📋</div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#F3F4F6] mb-2">Responsable Technique</h3>
                <p className="text-xs md:text-base text-[#9CA3AF]">Pilote la stratégie. Multi-équipes.</p>
              </div>
              <ul className="space-y-2 md:space-y-3">
                {[
                  'Calendrier saison : charge auto J-4 à J+1',
                  'Génère pour chaque entraîneur, une fois',
                  'Analyses vidéo illimitées : tous matchs',
                  'Rapports hebdo : points forts/axes équipes',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 md:gap-3 animate-fade-in-up text-xs md:text-sm" style={{ animationDelay: `${idx * 50}ms` }}>
                    <span className="text-[#39FF14] text-lg md:text-xl flex-shrink-0">✓</span>
                    <span className="text-[#9CA3AF]">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-4 md:mt-6 px-6 py-2 md:py-3 border-2 border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase tracking-wide hover:scale-105 text-xs md:text-sm"
              >
                Voir Tarif RT →
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-24 space-y-8 md:space-y-12 animate-fade-in-up">
          <div className="text-center space-y-3 md:space-y-4 animate-fade-in-up px-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter text-[#F3F4F6]">
              Tarifs <span className="text-[#39FF14]">Transparent</span>
            </h2>
            <p className="text-xs md:text-base text-[#9CA3AF]">
              7 jours gratuits. Pas de CB. Annulable 1 clic.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                type: 'trial' as const,
                name: 'Essai',
                price: 'Gratuit',
                duration: '7 jours',
                icon: '🚀',
                description: 'Découvre la puissance de ProSéance',
                features: [
                  '⚡ Génération séance en 3s',
                  '🎬 2 analyses vidéo',
                  '👥 1 équipe',
                  '📋 10 séances/mois',
                  '🔍 Accès complet à tous les outils',
                  '❌ Pas de CB requise',
                ],
                cta: 'Commencer Gratuitement',
              },
              {
                type: 'coach_pro' as const,
                name: 'Coach Pro',
                price: '14',
                duration: '€/mois',
                icon: '🎯',
                description: 'Pour un entraîneur principal',
                features: [
                  '⚡ Génération illimitée',
                  '🎬 5 analyses vidéo/mois',
                  '👥 1 équipe de A-Z',
                  '📋 Historique 50 séances',
                  '📅 Programmation saison',
                  '✅ Présence automatique',
                  '📊 Dashboard entraîneur',
                  '💬 Support prioritaire',
                ],
                cta: 'Passer à Coach Pro',
                highlight: true,
              },
              {
                type: 'rt_manager' as const,
                name: 'RT Manager',
                price: '49',
                duration: '€/mois',
                icon: '📊',
                description: 'Pour un responsable technique',
                features: [
                  '⚡ Génération illimitée',
                  '🎬 Analyses illimitées',
                  '👥 Multi-équipes (10+)',
                  '📋 Génération collective',
                  '📅 Programmation saison auto',
                  '✅ Présence multi-groupes',
                  '📊 Dashboard RT temps réel',
                  '📈 Rapports hebdo détaillés',
                  '🔐 Accès administrateur',
                  '💬 Support dédié',
                ],
                cta: 'Passer à RT Manager',
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative p-5 md:p-8 rounded-lg border-2 transition-all duration-300 hover:scale-105 animate-fade-in-up flex flex-col ${
                  plan.highlight
                    ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)] lg:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.5)]'
                    : 'border-[#141E1A] bg-[#141E1A] hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-3 md:px-4 py-1 bg-[#39FF14] text-[#0A0F0D] text-xs font-black rounded-full uppercase tracking-wider">
                    ⭐ Plus Populaire
                  </div>
                )}

                <div className="text-3xl md:text-4xl mb-3">{plan.icon}</div>
                <h3 className="text-xl md:text-2xl font-bold text-[#F3F4F6] mb-1">{plan.name}</h3>
                <p className="text-xs md:text-sm text-[#9CA3AF] mb-4 h-10 flex items-center">{plan.description}</p>

                <div className="mb-6 pb-6 border-b border-[rgba(57,255,20,0.2)]">
                  <span className="text-4xl md:text-5xl font-black text-[#39FF14]">{plan.price}</span>
                  <span className="text-[#9CA3AF] text-sm md:text-base ml-1">{plan.duration}</span>
                  {plan.price !== 'Gratuit' && <p className="text-xs text-[#9CA3AF] mt-2">Annulable 1 clic</p>}
                </div>

                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-grow">
                  {plan.features.map((f, fidx) => (
                    <li key={fidx} className="flex items-start gap-2 text-[#9CA3AF] text-xs md:text-sm">
                      <span className="text-[#39FF14] flex-shrink-0 mt-0.5">{f.split(' ')[0]}</span>
                      <span>{f.substring(2)}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePricingClick(plan.type)}
                  disabled={isCheckingOut && plan.type !== 'trial'}
                  className={`w-full py-3 md:py-4 px-4 rounded-lg font-bold uppercase tracking-wide transition-all group relative hover:scale-105 text-xs md:text-sm disabled:opacity-50 disabled:hover:scale-100 ${
                    plan.highlight
                      ? 'bg-[#39FF14] text-[#0A0F0D] hover:shadow-[0_0_40px_rgba(57,255,20,0.6)]'
                      : 'border-2 border-[#39FF14] text-[#39FF14] hover:bg-[rgba(57,255,20,0.1)]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
                  )}
                  <span className="relative z-10">
                    {isCheckingOut && plan.type !== 'trial' ? 'Redirection...' : plan.cta}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-[rgba(57,255,20,0.1)] max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          <div className="text-center space-y-4 md:space-y-6 animate-fade-in-up px-2">
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-[#F3F4F6]">
              Prêt à <span className="text-[#39FF14]">dominer ton calendrier</span> ?
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative inline-block px-6 md:px-8 py-3 md:py-4 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] transition-all uppercase tracking-wide hover:scale-105 animate-pop text-xs md:text-base"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
              <span className="relative z-10 whitespace-nowrap">Génère ta première séance (gratuit)</span>
            </button>
            <p className="text-[#9CA3AF] text-xs md:text-sm px-2">Aucune CB. Démo fonctionnelle. 7 jours complets.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[rgba(57,255,20,0.1)] mt-8 md:mt-16 py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-[#9CA3AF] text-xs md:text-sm space-y-3 md:space-y-4">
            <p className="font-bold text-[#F3F4F6]">© 2026 ProSéance</p>
            <p>Assistant IA des entraîneurs et clubs de football • Méthodologie FFF</p>
          </div>
        </footer>

        {/* Lead Modal */}
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
