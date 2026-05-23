'use client';

import { useTheme } from '@/components/ThemeProvider';

function Toggle({ on, onToggle, label, description }: {
  on: boolean; onToggle: () => void; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
          on ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        aria-pressed={on}
        aria-label={label}
      >
        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
          on ? 'translate-x-8' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

export default function InnstillingerPage() {
  const { dark, largeText, setDark, setLargeText } = useTheme();

  return (
    <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Innstillinger</h2>
      <p className="text-sm text-gray-500 mb-6">Visning og tilgjengelighet</p>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-100">
        <Toggle
          on={dark}
          onToggle={() => setDark(!dark)}
          label="Mørk modus"
          description="Mørk bakgrunn — lettere på øynene i svakt lys"
        />
        <Toggle
          on={largeText}
          onToggle={() => setLargeText(!largeText)}
          label="Større tekst"
          description="Øker skriftstørrelsen i hele appen"
        />
      </div>
    </div>
  );
}
