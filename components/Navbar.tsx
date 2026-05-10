'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const userName = typeof window !== 'undefined' ? localStorage.getItem('userName') ?? '' : '';

  const links = [
    { href: '/predictions', label: '📋 Mis predicciones' },
    { href: '/standings', label: '🏆 Clasificación' },
    { href: '/players', label: '👀 Ver todos' },
    { href: '/rules', label: '📖 Reglas' },
  ];

  function handleLogout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    router.push('/join');
  }

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-lg hidden sm:block">Porra Mundial 2026</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {userName && (
            <span className="text-sm text-green-200 hidden sm:block">
              Hola, <strong>{userName}</strong>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-green-300 hover:text-white transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
