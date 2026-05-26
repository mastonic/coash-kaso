'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingSuccessPage() {
  const router = useRouter();
  const [planName, setPlanName] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const selectedPlan = localStorage.getItem('selectedPlan');

    if (selectedPlan) {
      const planLabels: Record<string, string> = {
        coach_pro: 'Coach Pro',
        rt_manager: 'RT Manager',
      };
      setPlanName(planLabels[selectedPlan] || selectedPlan);
      localStorage.removeItem('selectedPlan');
    }

    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      setIsRedirecting(true);
      router.push('/coach-dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    setIsRedirecting(true);
    router.push('/coach-dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Success Card */}
        <div className="bg-[#141E1A] border border-[#39FF14] rounded-2xl p-8 space-y-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#39FF14] to-[#10B981] rounded-full flex items-center justify-center animate-pop">
              <svg
                className="w-10 h-10 text-[#0A0F0D]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black text-[#F3F4F6]">
              Paiement Confirmé!
            </h1>
            <p className="text-[#9CA3AF]">
              Merci d'avoir choisi{' '}
              <span className="text-[#39FF14] font-bold">{planName}</span>
            </p>
          </div>

          {/* Details */}
          <div className="bg-[#0A0F0D] rounded-lg p-4 space-y-2 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Plan Activé:</span>
              <span className="text-[#39FF14] font-bold">{planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Statut:</span>
              <span className="text-[#39FF14] font-bold">Actif</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleRedirect}
            disabled={isRedirecting}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#10B981] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 uppercase text-sm"
          >
            {isRedirecting ? 'Redirection...' : '→ Accéder au Tableau de Bord'}
          </button>

          {/* Auto-redirect message */}
          <p className="text-xs text-[#9CA3AF] animate-pulse">
            Redirection automatique en cours...
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-[#9CA3AF]">
            Des questions? Contactez notre support
          </p>
          <a
            href="mailto:support@proseance.fr"
            className="text-[#39FF14] hover:text-[#10B981] text-sm font-bold transition-colors"
          >
            support@proseance.fr
          </a>
        </div>
      </div>
    </div>
  );
}
