'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MiniGeneratorDemo } from '@/components/landing/MiniGeneratorDemo';
import { LeadModal } from '@/components/landing/LeadModal';
import { HeroPitch } from '@/components/landing/HeroPitch';
import { ProductTour } from '@/components/landing/ProductTour';
import { StatsBand } from '@/components/landing/StatsBand';
import { Reveal } from '@/components/landing/Reveal';

export default function ProSéanceLanding() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handlePricingClick = async (plan: 'trial' | 'coach_pro' | 'rt_manager') => {
    if (plan === 'trial') {
      setIsModalOpen(true);
      return;
    }

    const email = localStorage.getItem('userEmail');
    if (!email) {
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

  const navLinks = [
    { href: '#demo', label: 'La démo' },
    { href: '#features', label: 'Capacités' },
    { href: '#pricing', label: 'Tarifs' },
  ];

  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-[#0A0F0D] text-[#F3F4F6]">
      {/* Fond : grille néon + halos */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(57,255,20,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(57,255,20,0.02)_1px,transparent_1px)] bg-[60px_60px]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] animate-pulse rounded-full bg-[#39FF14] opacity-5 blur-3xl sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]" />
        <div className="absolute bottom-20 left-0 h-[250px] w-[250px] rounded-full bg-[#10B981] opacity-3 blur-3xl sm:h-[300px] sm:w-[300px] lg:h-[400px] lg:w-[400px]" />
      </div>

      <div className="relative z-10">
        {/* ── Navigation ── */}
        <nav className="sticky top-0 z-50 border-b border-[rgba(57,255,20,0.1)] bg-[#0A0F0D]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
            <div className="text-2xl font-black tracking-tighter md:text-3xl">
              <span className="text-[#F3F4F6]">PRO</span>
              <span className="anim-text-shine">SÉANCE</span>
            </div>

            <div className="hidden items-center gap-10 md:flex">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF] transition-all duration-200 hover:text-[#39FF14] hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.4)]"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-lg border border-[rgba(57,255,20,0.4)] px-5 py-2 text-sm font-bold uppercase text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.1)] hover:shadow-[0_0_20px_rgba(57,255,20,0.3)]"
              >
                Se connecter
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#39FF14] transition-colors md:hidden"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-[rgba(57,255,20,0.1)] bg-[#0A0F0D]/95 backdrop-blur-md md:hidden">
              <div className="mx-auto max-w-7xl space-y-2 px-4 py-4">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-semibold uppercase tracking-wide text-[#9CA3AF] transition-colors hover:text-[#39FF14]"
                  >
                    {l.label}
                  </a>
                ))}
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg border border-[rgba(57,255,20,0.4)] py-2.5 text-center text-sm font-bold uppercase text-[#39FF14]"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ── Héros ── */}
        <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 md:px-6 md:pb-20 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Texte */}
            <div className="space-y-6 text-center lg:text-left">
              <Reveal>
                <span className="inline-block rounded-full border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.1)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#39FF14]">
                  ⚡ Méthodologie FFF · PWA hors-ligne
                </span>
              </Reveal>

              <Reveal delay={120}>
                <h1 className="text-4xl font-black leading-[1.05] tracking-tighter sm:text-5xl xl:text-6xl">
                  Ta séance complète,
                  <br />
                  <span className="anim-text-shine">plan d&apos;exercice inclus.</span>
                </h1>
              </Reveal>

              <Reveal delay={240}>
                <p className="mx-auto max-w-xl text-base leading-relaxed text-[#9CA3AF] md:text-lg lg:mx-0">
                  ProSéance génère des séances d&apos;entraînement selon la méthodologie FFF :
                  4 phases, fiches détaillées, et le <span className="font-bold text-[#F3F4F6]">schéma tactique de chaque exercice</span> —
                  joueurs, plots, passes, conduite, tir.
                </p>
              </Reveal>

              <Reveal delay={360}>
                <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-[#39FF14] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0A0F0D] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(57,255,20,0.8)] md:text-base"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-20" />
                    <span className="relative z-10">⚡ Essai gratuit 7 jours</span>
                  </button>
                  <a
                    href="#demo"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[rgba(57,255,20,0.4)] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.08)] md:text-base"
                  >
                    ▶ Voir la démo
                  </a>
                </div>
              </Reveal>

              <Reveal delay={480}>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9CA3AF] md:text-sm lg:justify-start">
                  <span className="flex items-center gap-1.5"><span className="text-[#39FF14]">✓</span> Sans carte bancaire</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#39FF14]">✓</span> U6 → Seniors</span>
                  <span className="flex items-center gap-1.5"><span className="text-[#39FF14]">✓</span> Marche hors-ligne</span>
                </div>
              </Reveal>
            </div>

            {/* Terrain animé */}
            <Reveal delay={200}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-[#39FF14] opacity-[0.06] blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-[rgba(57,255,20,0.25)] shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                  <HeroPitch />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Stats + marquee ── */}
        <StatsBand />

        {/* ── La démo en motion ── */}
        <section id="demo" className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <Reveal>
            <div className="mb-10 space-y-3 text-center md:mb-14">
              <h2 className="text-3xl font-black tracking-tighter md:text-5xl">
                Vois ProSéance <span className="anim-text-shine">en action</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[#9CA3AF] md:text-base">
                De la configuration au bord du terrain : la démo se joue toute seule.
                Clique sur un chapitre pour naviguer.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <ProductTour />
          </Reveal>
        </section>

        {/* ── Comment ça marche ── */}
        <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-20">
          <Reveal>
            <h2 className="mb-12 text-center text-3xl font-black tracking-tighter md:text-4xl">
              3 étapes, <span className="text-[#39FF14]">0 papier-crayon</span>
            </h2>
          </Reveal>

          <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            {/* Ligne de connexion (desktop) */}
            <div className="absolute left-[16%] right-[16%] top-9 hidden h-0.5 bg-gradient-to-r from-[#39FF14]/10 via-[#39FF14]/50 to-[#39FF14]/10 md:block" />
            {[
              {
                n: '1',
                titre: 'Décris ta séance',
                desc: 'Thème, catégorie, effectif, durée, charge du jour. 5 choix, 10 secondes.',
                icon: '🎛',
              },
              {
                n: '2',
                titre: 'ProSéance construit',
                desc: 'Mise en train → jeu → situation → match. Chaque fiche avec son plan illustré.',
                icon: '🧠',
              },
              {
                n: '3',
                titre: 'Coache, c’est prêt',
                desc: 'Sur ton téléphone (même hors-ligne) ou imprimée en PDF. Partage-la à ton staff.',
                icon: '📲',
              },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="relative rounded-2xl border border-[rgba(57,255,20,0.15)] bg-[#141E1A] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.2)]">
                  <div className="mx-auto -mt-12 mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#39FF14] bg-[#0A0F0D] text-2xl shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                    {s.icon}
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#39FF14]">Étape {s.n}</p>
                  <h3 className="mt-1 text-xl font-bold text-[#F3F4F6]">{s.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Essaie toi-même ── */}
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-20">
          <Reveal>
            <div className="mb-10 space-y-3 text-center">
              <h2 className="text-3xl font-black tracking-tighter md:text-4xl">
                À toi de jouer : <span className="text-[#39FF14]">génère une vraie séance</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[#9CA3AF] md:text-base">
                Pas une maquette : le vrai moteur ProSéance, dans ton navigateur.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <MiniGeneratorDemo />
          </Reveal>
        </section>

        {/* ── Capacités ── */}
        <section id="features" className="mx-auto max-w-7xl space-y-10 px-4 py-12 md:px-6 md:py-24">
          <Reveal>
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-black tracking-tighter md:text-5xl">
                <span className="text-[#F3F4F6]">Bien plus qu&apos;un</span>{' '}
                <span className="anim-text-shine">générateur</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {[
              {
                icon: '📐',
                title: 'Séances FFF illustrées',
                desc: 'Méthodologie FFF : mise en train, jeu, situation, match. Chaque exercice avec son plan.',
                details: [
                  'Plan illustré : joueurs, plots, ballons, buts, zones',
                  'Fiches : but, consignes, variantes, critères de réussite',
                  'Toutes catégories : U6-U7 → Seniors',
                  'Impression / export PDF de la fiche',
                  'Historique de vos 50 dernières séances',
                ],
              },
              {
                icon: '🎬',
                title: 'Analyser tes vidéos',
                desc: 'Gemini Vision : forces, faiblesses, axes de progression.',
                details: [
                  'Vision IA pour la tactique',
                  'Analyse de formation détaillée',
                  'Support vidéo match / entraînement',
                  'Recommandations personnalisées',
                  'Illimité sur RT Manager',
                ],
              },
              {
                icon: '📅',
                title: 'Piloter la saison',
                desc: 'Programmation, présences, charges adaptées, multi-équipes.',
                details: [
                  'Calendrier matchs & entraînements',
                  'Appel par reconnaissance photo',
                  'Gestion multi-équipes (RT)',
                  'Dashboards coach & RT',
                  'Partage de séances au staff',
                ],
              },
            ].map((feat, idx) => (
              <Reveal key={idx} delay={idx * 120}>
                <div className="group relative h-full rounded-2xl border border-[#141E1A] bg-[#141E1A] p-6 transition-all duration-300 hover:scale-[1.03] hover:border-[#39FF14] hover:bg-[rgba(57,255,20,0.05)] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] md:p-8">
                  <div className="mb-4 text-4xl transition-transform duration-300 group-hover:scale-110 md:text-5xl">
                    {feat.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#F3F4F6] transition-colors group-hover:text-[#39FF14] md:text-xl">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#9CA3AF] md:text-sm">{feat.desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {feat.details.map((d, di) => (
                      <li key={di} className="flex items-start gap-2 text-xs text-[#9CA3AF]">
                        <span className="mt-0.5 flex-shrink-0 text-[#39FF14]">✓</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Tarifs ── */}
        <section id="pricing" className="mx-auto max-w-7xl space-y-10 px-4 py-12 md:px-6 md:py-24">
          <Reveal>
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-black tracking-tighter md:text-4xl">
                Tarifs <span className="text-[#39FF14]">transparents</span>
              </h2>
              <p className="text-xs text-[#9CA3AF] md:text-base">7 jours gratuits. Pas de CB. Annulable en 1 clic.</p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {[
              {
                type: 'trial' as const,
                name: 'Essai',
                price: 'Gratuit',
                duration: '7 jours',
                icon: '🚀',
                description: 'Découvre la puissance de ProSéance',
                features: [
                  'Génération de séances illustrées',
                  '2 analyses vidéo',
                  '1 équipe',
                  '10 séances / mois',
                  'Accès complet à tous les outils',
                  'Pas de CB requise',
                ],
                cta: 'Commencer gratuitement',
              },
              {
                type: 'coach_pro' as const,
                name: 'Coach Pro',
                price: '14',
                duration: '€/mois',
                icon: '🎯',
                description: 'Pour un entraîneur principal',
                features: [
                  'Génération illimitée',
                  '5 analyses vidéo / mois',
                  '1 équipe de A à Z',
                  'Historique 50 séances',
                  'Programmation saison',
                  'Présence automatique',
                  'Dashboard entraîneur',
                  'Support prioritaire',
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
                  'Génération illimitée',
                  'Analyses vidéo illimitées',
                  'Multi-équipes (10+)',
                  'Génération collective',
                  'Programmation saison auto',
                  'Présence multi-groupes',
                  'Dashboard RT temps réel',
                  'Support dédié',
                ],
                cta: 'Passer à RT Manager',
              },
            ].map((plan, idx) => (
              <Reveal key={idx} delay={idx * 120} className="h-full">
                <div
                  className={`relative flex h-full flex-col rounded-2xl border-2 p-5 transition-all duration-300 hover:scale-[1.03] md:p-8 ${
                    plan.highlight
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)] hover:shadow-[0_0_50px_rgba(57,255,20,0.5)] lg:scale-105'
                      : 'border-[#141E1A] bg-[#141E1A] hover:border-[#39FF14] hover:shadow-[0_0_30px_rgba(57,255,20,0.3)]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#39FF14] px-4 py-1 text-xs font-black uppercase tracking-wider text-[#0A0F0D]">
                      ⭐ Plus populaire
                    </div>
                  )}

                  <div className="mb-3 text-3xl md:text-4xl">{plan.icon}</div>
                  <h3 className="mb-1 text-xl font-bold text-[#F3F4F6] md:text-2xl">{plan.name}</h3>
                  <p className="mb-4 flex h-10 items-center text-xs text-[#9CA3AF] md:text-sm">{plan.description}</p>

                  <div className="mb-6 border-b border-[rgba(57,255,20,0.2)] pb-6">
                    <span className="text-4xl font-black text-[#39FF14] md:text-5xl">{plan.price}</span>
                    <span className="ml-1 text-sm text-[#9CA3AF] md:text-base">{plan.duration}</span>
                    {plan.price !== 'Gratuit' && <p className="mt-2 text-xs text-[#9CA3AF]">Annulable en 1 clic</p>}
                  </div>

                  <ul className="mb-6 flex-grow space-y-2 md:mb-8 md:space-y-3">
                    {plan.features.map((f, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-xs text-[#9CA3AF] md:text-sm">
                        <span className="mt-0.5 flex-shrink-0 text-[#39FF14]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePricingClick(plan.type)}
                    disabled={isCheckingOut && plan.type !== 'trial'}
                    className={`group relative w-full rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 md:py-4 md:text-sm ${
                      plan.highlight
                        ? 'bg-[#39FF14] text-[#0A0F0D] hover:shadow-[0_0_40px_rgba(57,255,20,0.6)]'
                        : 'border-2 border-[#39FF14] text-[#39FF14] hover:bg-[rgba(57,255,20,0.1)]'
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute inset-0 rounded-lg bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
                    )}
                    <span className="relative z-10">
                      {isCheckingOut && plan.type !== 'trial' ? 'Redirection...' : plan.cta}
                    </span>
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="mx-auto max-w-7xl border-t border-[rgba(57,255,20,0.1)] px-4 py-12 md:px-6 md:py-20">
          <Reveal>
            <div className="space-y-5 text-center">
              <h2 className="text-2xl font-black tracking-tighter md:text-4xl">
                Ta prochaine séance est <span className="anim-text-shine">déjà prête</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-block rounded-lg bg-[#39FF14] px-8 py-4 text-sm font-bold uppercase tracking-wide text-[#0A0F0D] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(57,255,20,0.6)] md:text-base"
              >
                <div className="absolute inset-0 rounded-lg bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
                <span className="relative z-10 whitespace-nowrap">Génère ta première séance (gratuit)</span>
              </button>
              <p className="text-xs text-[#9CA3AF] md:text-sm">Aucune CB. Démo fonctionnelle. 7 jours complets.</p>
            </div>
          </Reveal>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[rgba(57,255,20,0.1)] py-8 md:py-12">
          <div className="mx-auto max-w-7xl space-y-3 px-4 text-center text-xs text-[#9CA3AF] md:px-6 md:text-sm">
            <p className="font-bold text-[#F3F4F6]">© 2026 ProSéance</p>
            <p>L&apos;assistant des entraîneurs et clubs de football • Méthodologie FFF • PWA installable</p>
            <p className="space-x-4">
              <Link href="/login" className="transition-colors hover:text-[#39FF14]">Connexion</Link>
              <Link href="/admin/leads" className="transition-colors hover:text-[#39FF14]">Admin</Link>
            </p>
          </div>
        </footer>

        <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}
