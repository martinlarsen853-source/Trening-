'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const SCREENS = [
  {
    emoji: '📅',
    title: 'Din timeplan',
    body: 'Se hva barnet ditt skal gjøre i dag og resten av uken — med tid, sted og hvem som leder.',
  },
  {
    emoji: '💬',
    title: 'Kontakt lederen',
    body: 'Send meldinger direkte til leder, eller skriv i gruppechatten med de andre ledsagerne.',
  },
  {
    emoji: '🚨',
    title: 'Meld avbud enkelt',
    body: 'Trykk på en aktivitet og meld avbud med ett trykk — lederen ser det med én gang.',
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  function next() {
    if (step < SCREENS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('onboardingDone', 'true');
      onDone();
    }
  }

  const s = SCREENS[step];

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center px-6 pb-12"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}>

      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {SCREENS.map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-white w-6' : 'bg-white/30'}`} />
        ))}
      </div>

      <div className="text-center max-w-sm">
        <p className="text-7xl mb-6" role="img" aria-hidden>{s.emoji}</p>
        <h2 className="text-3xl font-black text-white mb-4 leading-tight">{s.title}</h2>
        <p className="text-blue-100 text-lg leading-relaxed">{s.body}</p>
      </div>

      <button
        onClick={next}
        aria-label={step < SCREENS.length - 1 ? 'Neste' : 'Kom i gang'}
        className="mt-12 flex items-center gap-2 bg-white text-blue-700 font-black text-lg px-8 py-4 rounded-3xl shadow-xl active:scale-95 transition-transform"
      >
        {step < SCREENS.length - 1 ? (
          <>Neste <ChevronRight size={20} aria-hidden /></>
        ) : (
          'Kom i gang 🎉'
        )}
      </button>

      {step < SCREENS.length - 1 && (
        <button
          onClick={() => { localStorage.setItem('onboardingDone', 'true'); onDone(); }}
          className="mt-4 text-blue-300 text-sm"
          aria-label="Hopp over introduksjonen"
        >
          Hopp over
        </button>
      )}
    </div>
  );
}
