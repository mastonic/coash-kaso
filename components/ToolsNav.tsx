'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ToolsNavProps {
  currentPage?: 'session' | 'history' | 'team' | 'video' | 'coach-dashboard' | 'rt-dashboard' | 'presence' | 'schedule';
}

export function ToolsNav({ currentPage }: ToolsNavProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('mastro_user');
    router.push('/login');
  };

  const navLinks = [
    { href: '/coach-dashboard', label: 'Dashboard', icon: '🏠', key: 'coach-dashboard' },
    { href: '/session', label: 'Générer', icon: '⚡', key: 'session' },
    { href: '/schedule', label: 'Programme', icon: '📅', key: 'schedule' },
    { href: '/team', label: 'Équipe', icon: '👥', key: 'team' },
    { href: '/presence', label: 'Présence', icon: '✅', key: 'presence' },
    { href: '/video', label: 'Vidéo', icon: '🎬', key: 'video' },
    { href: '/history', label: 'Historique', icon: '📋', key: 'history' },
    { href: '/rt-dashboard', label: 'RT', icon: '📊', key: 'rt-dashboard' },
  ];

  const getLinkClass = (key: string) => `
    flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 font-semibold text-sm
    ${
      currentPage === key
        ? 'bg-[rgba(57,255,20,0.1)] text-[#39FF14] border border-[rgba(57,255,20,0.2)]'
        : 'text-[#9CA3AF] hover:text-[#39FF14] hover:bg-[rgba(57,255,20,0.05)]'
    }
  `.trim();

  return (
    <header className="border-b border-[rgba(57,255,20,0.1)] px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/dashboard" className="text-xl md:text-3xl font-black tracking-tighter text-[#F3F4F6] hover:text-[#39FF14] transition-colors flex-shrink-0">
          <span>PROSEANCE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-1 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={getLinkClass(link.key)}
            >
              <span className="text-base">{link.icon}</span>
              <span className="hidden lg:inline text-xs uppercase">{link.label}</span>
            </Link>
          ))}

          <div className="border-l border-[rgba(57,255,20,0.2)] ml-2 pl-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[#9CA3AF] hover:text-red-400 transition-all duration-200 font-semibold text-xs uppercase px-3 py-2 rounded-md"
              title="Déconnexion"
            >
              <span>→</span>
              <span className="hidden lg:inline">Déco</span>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[#39FF14] hover:text-[#39FF14]/80 transition-colors flex items-center gap-2"
          title="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden mt-4 pb-4 space-y-3 border-t border-[rgba(57,255,20,0.1)] pt-4">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2 rounded-md ${getLinkClass(link.key)}`}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="w-full text-left text-[#9CA3AF] hover:text-red-400 transition-all duration-200 font-semibold text-sm uppercase tracking-wide px-4 py-2 rounded-md pt-3 border-t border-[rgba(57,255,20,0.1)]"
          >
            → Déco
          </button>
        </nav>
      )}
    </header>
  );
}
