import Link from 'next/link';

export const metadata = {
  title: 'Hors-ligne — ProSéance',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A0F0D] px-6 text-center">
      <p className="text-6xl">📡</p>
      <h1 className="mt-6 text-3xl font-black text-[#F3F4F6]">Vous êtes hors-ligne</h1>
      <p className="mt-3 max-w-md text-[#9CA3AF]">
        Pas de connexion internet. Vos séances déjà générées restent
        disponibles dans l’historique.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/history"
          className="rounded-lg bg-[#39FF14] px-6 py-3 font-bold text-[#0A0F0D] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]"
        >
          📚 Voir l’historique
        </Link>
        <Link
          href="/session"
          className="rounded-lg border border-[rgba(57,255,20,0.4)] px-6 py-3 font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.1)]"
        >
          Réessayer
        </Link>
      </div>
    </main>
  );
}
