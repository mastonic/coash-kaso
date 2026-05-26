import { FootballFixturesBoard } from '@/components/FootballFixturesBoard';

export default function FootballFixturesPage() {
  return (
    <main className="min-h-screen bg-[#0A0F0D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-[#F3F4F6] mb-2">
            ⚽ ProSéance Football
          </h1>
          <p className="text-[#A0AEA8]">
            Calendrier des matchs professionnels et amateurs en France
          </p>
        </div>

        <FootballFixturesBoard />

        <div className="mt-12 p-6 bg-[#141E1A] border border-[#39FF14]/20 rounded-2xl">
          <h2 className="text-xl font-bold text-[#39FF14] mb-4">📋 À propos</h2>
          <ul className="space-y-2 text-sm text-[#A0AEA8]">
            <li>
              ✓ <strong>Ligue 1/2/National</strong> : Données en direct d'API-Football
            </li>
            <li>
              ✓ <strong>Divisions amateurs</strong> : Calendrier officiel FFF via epreuves.fff.fr
            </li>
            <li>
              ✓ <strong>Mise à jour automatique</strong> : Scores et statuts en temps réel
            </li>
            <li>
              ✓ <strong>Multi-plateformes</strong> : Compatible desktop et mobile
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
