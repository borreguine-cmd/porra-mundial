'use client';

import { useEffect, useState } from 'react';
import type { PointsConfig } from '@/types';

interface Config { points: PointsConfig; deadline: string | null }

export default function RulesPage() {
  const [cfg, setCfg] = useState<Config | null>(null);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg);
  }, []);

  const pts = cfg?.points;

  const matchRules = [
    { label: 'Ganador / resultado correcto', desc: 'Aciertas quién gana (o empate) en un partido de grupo o eliminatoria.', pts: pts?.correctWinner },
    { label: 'Resultado exacto', desc: 'Aciertas el marcador exacto del partido (incluyendo penaltis si los hay).', pts: pts?.exactScore },
  ];

  const classRules = [
    { label: 'Posición exacta 1º de grupo', desc: 'Aciertas exactamente qué equipo queda primero en un grupo. Se puntúa grupo a grupo cuando el grupo está completo.', pts: pts?.exactPos1, color: 'text-yellow-500' },
    { label: 'Posición exacta 2º de grupo', desc: 'Aciertas exactamente qué equipo queda segundo en un grupo.', pts: pts?.exactPos2, color: 'text-gray-400' },
    { label: 'Posición exacta 3º de grupo', desc: 'Aciertas exactamente qué equipo queda tercero en un grupo.', pts: pts?.exactPos3, color: 'text-amber-600' },
    { label: 'Posición exacta 4º de grupo', desc: 'Aciertas exactamente qué equipo queda cuarto (último) en un grupo.', pts: pts?.exactPos4, color: 'text-gray-500' },
    { label: 'Equipo clasifica de grupo (top 2)', desc: 'Un equipo que predices entre los dos primeros de su grupo acaba efectivamente entre los dos primeros. Se computa cuando el grupo está completo (independiente de la posición exacta).', pts: pts?.advancesGroup },
    { label: 'Equipo avanza en eliminatorias', desc: 'Predices correctamente qué equipo pasa a la siguiente ronda en un partido de eliminatoria.', pts: pts?.advancesKnockout },
  ];

  const extraRules = [
    { label: 'Campeón', desc: 'Aciertas el equipo campeón del mundo.', pts: pts?.correctChampion },
    { label: 'MVP del torneo', desc: 'Aciertas el jugador elegido mejor jugador del torneo.', pts: pts?.correctMVP },
    { label: 'Pichichi', desc: 'Aciertas el máximo goleador del torneo.', pts: pts?.correctTopScorer },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reglas y puntuación</h1>
        {cfg?.deadline && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mt-2 inline-block">
            ⏰ Plazo para predicciones: <strong>{new Date(cfg.deadline).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'short' })}</strong>
          </p>
        )}
      </div>

      {/* Format */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3 text-lg">Formato del torneo</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-green-600 font-bold">📋</span><span><strong>Fase de grupos:</strong> 12 grupos de 4 equipos, 72 partidos. Clasifican los 2 primeros de cada grupo más los 8 mejores terceros (32 equipos en total).</span></li>
          <li className="flex gap-2"><span className="text-green-600 font-bold">⚡</span><span><strong>Eliminatorias:</strong> 32avos, octavos, cuartos, semifinales, final y tercer puesto. Los empates se resuelven con penaltis.</span></li>
          <li className="flex gap-2"><span className="text-green-600 font-bold">⭐</span><span><strong>Extras:</strong> Predice el campeón, el MVP y el Pichichi del torneo antes del plazo.</span></li>
        </ul>
      </section>

      {/* Match points */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Partidos</h2>
        <div className="space-y-2">
          {matchRules.map(r => (
            <div key={r.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-14 text-center">
                <span className="text-2xl font-black text-green-700">{r.pts ?? '…'}</span>
                <div className="text-[10px] text-gray-400 leading-tight">pts</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 px-1">Los puntos por ganador y exacto se acumulan: un resultado exacto suma ambos.</p>
        </div>
      </section>

      {/* Classification points */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Clasificación</h2>
        <div className="space-y-2">
          {classRules.map(r => (
            <div key={r.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-14 text-center">
                <span className={`text-2xl font-black ${r.color ?? 'text-blue-600'}`}>{r.pts ?? '…'}</span>
                <div className="text-[10px] text-gray-400 leading-tight">pts</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Extra points */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3 uppercase text-xs tracking-wider">Predicciones especiales</h2>
        <div className="space-y-2">
          {extraRules.map(r => (
            <div key={r.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <div className="flex-shrink-0 w-14 text-center">
                <span className="text-2xl font-black text-amber-500">{r.pts ?? '…'}</span>
                <div className="text-[10px] text-gray-400 leading-tight">pts</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
