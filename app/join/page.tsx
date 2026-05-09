'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in, go to predictions
    const existing = localStorage.getItem('userToken');
    if (existing) router.replace('/predictions');

    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [router, searchParams]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), inviteToken: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al unirse');
        return;
      }

      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userName', data.name);
      router.push('/predictions');
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold text-green-800">Porra Mundial 2026</h1>
          <p className="text-gray-600 mt-1">USA · Canadá · México</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Únete a la porra
          </h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: María García"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                required
                minLength={2}
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token de invitación
              </label>
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Pídelo al organizador"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar a la porra'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Mundial 2026 · 48 equipos · 104 partidos
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-5xl">⚽</div></div>}>
      <JoinForm />
    </Suspense>
  );
}
