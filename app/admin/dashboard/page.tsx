'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import teamsData from '@/data/teams.json';

interface Config {
  inviteToken: string;
  deadline: string | null;
  realChampion: string | null;
  realMVP: string | null;
  realTopScorer: string | null;
  points: {
    correctWinner: number;
    exactScore: number;
    advancesGroup: number;
    advancesKnockout: number;
    correctChampion: number;
    correctMVP: number;
    correctTopScorer: number;
    exactPos1: number;
    exactPos2: number;
    exactPos3: number;
    exactPos4: number;
  };
}

interface ExtraRow {
  userId: string;
  userName: string;
  champion: string;
  mvp: string;
  topScorer: string;
  championCorrect: boolean | null;
  mvpCorrect: boolean | null;
  topScorerCorrect: boolean | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [participants, setParticipants] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([]);
  const [extraSaving, setExtraSaving] = useState(false);
  const [extraSaved, setExtraSaved] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) { router.replace('/admin'); return; }

    fetch('/api/config').then(r => r.json()).then(setConfig);
    fetch('/api/users').then(r => r.json()).then((u: unknown[]) => setParticipants(u.length));
    fetch('/api/admin/extra-results', {
      headers: { 'x-admin-session': localStorage.getItem('adminSession') ?? '' },
    }).then(r => r.json()).then(setExtraRows);
  }, [router]);

  function adminHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-admin-session': localStorage.getItem('adminSession') ?? '',
    };
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    await fetch('/api/config', {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({
        deadline: config.deadline,
        points: config.points,
        inviteToken: config.inviteToken,
        realChampion: config.realChampion || null,
        realMVP: config.realMVP || null,
        realTopScorer: config.realTopScorer || null,
      }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function saveExtraResults() {
    setExtraSaving(true);
    const overrides = extraRows
      .filter(r => r.championCorrect !== null || r.mvpCorrect !== null || r.topScorerCorrect !== null)
      .map(r => ({
        userId: r.userId,
        championCorrect: r.championCorrect ?? false,
        mvpCorrect: r.mvpCorrect ?? false,
        topScorerCorrect: r.topScorerCorrect ?? false,
      }));
    await fetch('/api/admin/extra-results', {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ overrides }),
    });
    setExtraSaved(true);
    setExtraSaving(false);
    setTimeout(() => setExtraSaved(false), 3000);
  }

  function toggleCorrect(userId: string, field: 'championCorrect' | 'mvpCorrect' | 'topScorerCorrect', value: boolean) {
    setExtraRows(rows => rows.map(r => {
      if (r.userId !== userId) return r;
      const current = r[field];
      return { ...r, [field]: current === value ? null : value };
    }));
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 4) { setPwMsg('Mínimo 4 caracteres'); return; }
    await fetch('/api/config', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    setPwMsg('Contraseña actualizada ✓');
    setNewPassword('');
  }

  function handleLogout() {
    localStorage.removeItem('adminSession');
    router.push('/admin');
  }

  if (!config) return (
    <div className="flex items-center justify-center py-20 min-h-screen bg-gray-900">
      <div className="text-4xl">⏳</div>
    </div>
  );

  const teamMap = Object.fromEntries(teamsData.map(t => [t.id, { name: t.name, flag: t.flag }]));

  function CorrectBtn({ value, active, onClick }: { value: boolean; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
          active
            ? value ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
        }`}
      >
        {value ? '✓' : '✗'}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">🔐 Panel Admin</h1>
            <p className="text-gray-400 text-sm mt-0.5">{participants} participantes registrados</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/results"
              className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📊 Resultados
            </Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
              Salir
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Invite token */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">🔗 Enlace de invitación</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.inviteToken}
                onChange={e => setConfig(c => c ? { ...c, inviteToken: e.target.value } : c)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join?token=${config.inviteToken}`;
                  navigator.clipboard.writeText(url);
                }}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                📋 Copiar URL
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              URL de invitación: {typeof window !== 'undefined' ? window.location.origin : ''}/join?token={config.inviteToken}
            </p>
          </div>

          {/* Deadline */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">⏰ Fecha límite de predicciones</h2>
            <input
              type="datetime-local"
              value={config.deadline ? config.deadline.slice(0, 16) : ''}
              onChange={e => setConfig(c => c ? { ...c, deadline: e.target.value ? new Date(e.target.value).toISOString() : null } : c)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {config.deadline && (
              <button
                onClick={() => setConfig(c => c ? { ...c, deadline: null } : c)}
                className="ml-3 text-red-400 hover:text-red-300 text-sm"
              >
                ✕ Quitar límite
              </button>
            )}
            <p className="text-gray-400 text-xs mt-2">
              {config.deadline
                ? `Límite: ${new Date(config.deadline).toLocaleString('es-ES')}`
                : 'Sin fecha límite — se pueden hacer predicciones siempre'}
            </p>
          </div>

          {/* Points config */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">🎯 Sistema de puntos</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.points).map(([key, val]) => {
                const labels: Record<string, string> = {
                  correctWinner: 'Acertar ganador (1X2)',
                  exactScore: 'Resultado exacto',
                  advancesGroup: 'Pasa fase de grupos (top 2)',
                  advancesKnockout: 'Avanza en eliminatoria',
                  correctChampion: 'Campeón correcto',
                  correctMVP: 'MVP correcto',
                  correctTopScorer: 'Pichichi correcto',
                  exactPos1: 'Posición exacta 1º de grupo',
                  exactPos2: 'Posición exacta 2º de grupo',
                  exactPos3: 'Posición exacta 3º de grupo',
                  exactPos4: 'Posición exacta 4º de grupo',
                };
                return (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{labels[key] ?? key}</label>
                    <input
                      type="number"
                      min={0}
                      value={val}
                      onChange={e => setConfig(c => c ? {
                        ...c, points: { ...c.points, [key]: parseInt(e.target.value) || 0 }
                      } : c)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real results */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">🏆 Resultados reales</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Campeón del mundo</label>
                <select
                  value={config.realChampion ?? ''}
                  onChange={e => setConfig(c => c ? { ...c, realChampion: e.target.value || null } : c)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Sin determinar —</option>
                  {teamsData.map(t => (
                    <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Mejor jugador (MVP)</label>
                <input
                  type="text"
                  value={config.realMVP ?? ''}
                  onChange={e => setConfig(c => c ? { ...c, realMVP: e.target.value || null } : c)}
                  placeholder="Nombre del jugador"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Pichichi (máximo goleador)</label>
                <input
                  type="text"
                  value={config.realTopScorer ?? ''}
                  onChange={e => setConfig(c => c ? { ...c, realTopScorer: e.target.value || null } : c)}
                  placeholder="Nombre del jugador"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={saveConfig}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar configuración'}
          </button>

          {/* Extra results evaluation */}
          {extraRows.length > 0 && (
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="font-bold text-lg mb-2">⭐ Evaluación de extras</h2>
              <p className="text-gray-400 text-xs mb-4">
                Marca ✓ (acierto) o ✗ (fallo) para cada participante. Pulsa de nuevo el mismo botón para quitar la marca.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs border-b border-gray-700">
                      <th className="text-left py-2 pr-4">Participante</th>
                      <th className="text-left py-2 pr-2">Campeón</th>
                      <th className="text-center py-2 pr-4 w-16">✓✗</th>
                      <th className="text-left py-2 pr-2">MVP</th>
                      <th className="text-center py-2 pr-4 w-16">✓✗</th>
                      <th className="text-left py-2 pr-2">Pichichi</th>
                      <th className="text-center py-2 w-16">✓✗</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraRows.map(row => {
                      const champ = teamMap[row.champion];
                      return (
                        <tr key={row.userId} className="border-b border-gray-700/50">
                          <td className="py-2 pr-4 font-medium">{row.userName}</td>
                          <td className="py-2 pr-2 text-gray-300">
                            {champ
                              ? <span>{champ.flag} {champ.name}</span>
                              : <span className="text-gray-500 italic">{row.champion || '—'}</span>
                            }
                          </td>
                          <td className="py-2 pr-4 text-center">
                            <div className="flex gap-1 justify-center">
                              <CorrectBtn
                                value={true}
                                active={row.championCorrect === true}
                                onClick={() => toggleCorrect(row.userId, 'championCorrect', true)}
                              />
                              <CorrectBtn
                                value={false}
                                active={row.championCorrect === false}
                                onClick={() => toggleCorrect(row.userId, 'championCorrect', false)}
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-gray-300">
                            {row.mvp || <span className="text-gray-500 italic">—</span>}
                          </td>
                          <td className="py-2 pr-4 text-center">
                            <div className="flex gap-1 justify-center">
                              <CorrectBtn
                                value={true}
                                active={row.mvpCorrect === true}
                                onClick={() => toggleCorrect(row.userId, 'mvpCorrect', true)}
                              />
                              <CorrectBtn
                                value={false}
                                active={row.mvpCorrect === false}
                                onClick={() => toggleCorrect(row.userId, 'mvpCorrect', false)}
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-gray-300">
                            {row.topScorer || <span className="text-gray-500 italic">—</span>}
                          </td>
                          <td className="py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <CorrectBtn
                                value={true}
                                active={row.topScorerCorrect === true}
                                onClick={() => toggleCorrect(row.userId, 'topScorerCorrect', true)}
                              />
                              <CorrectBtn
                                value={false}
                                active={row.topScorerCorrect === false}
                                onClick={() => toggleCorrect(row.userId, 'topScorerCorrect', false)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                onClick={saveExtraResults}
                disabled={extraSaving}
                className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {extraSaving ? 'Guardando...' : extraSaved ? '✓ Evaluaciones guardadas' : 'Guardar evaluaciones'}
              </button>
            </div>
          )}

          {/* Change password */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">🔑 Cambiar contraseña</h2>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={changePassword}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cambiar
              </button>
            </div>
            {pwMsg && <p className="text-green-400 text-xs mt-2">{pwMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
