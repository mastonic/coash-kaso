'use client';

import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { RtDashboardOverview } from '@/components/rt/RtDashboardOverview';

function DashboardContent() {
  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="rt-dashboard" />

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-2 md:mb-6">Tableau de Bord Responsable Technique</h1>
        <p className="text-[#9CA3AF] mb-6 md:mb-12 text-sm md:text-base">Vue d'ensemble des métriques tactiques et performance équipe</p>
        <RtDashboardOverview />
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AccessGate>
      <DashboardContent />
    </AccessGate>
  );
}
