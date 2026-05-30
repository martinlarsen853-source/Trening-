export default function InfoPage() {
  return (
    <div
      className="min-h-screen px-5 py-10"
      style={{ background: 'linear-gradient(150deg, #071630 0%, #0d3070 40%, #1458a8 72%, #2e86d4 100%)' }}
    >
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white leading-none tracking-tight">Beitostølen</h1>
          <p className="text-[10px] font-bold tracking-[0.28em] text-blue-300 uppercase mt-2">Helsesportsenter</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white/10 border border-white/20 rounded-3xl px-5 py-5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Om senteret</p>
            <p className="text-white font-semibold text-sm leading-relaxed">
              Beitostølen Helsesportsenter er et nasjonalt senter for habilitering og rehabilitering av barn, unge og voksne med funksjonsvariasjon. Vi tilbyr opphold med aktiviteter og behandling tilpasset den enkeltes behov.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-3xl px-5 py-5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Adresse og kontakt</p>
            <p className="text-white text-sm">Beitostølen Helsesportsenter</p>
            <p className="text-blue-200 text-sm">Lindelienveien 1</p>
            <p className="text-blue-200 text-sm">2953 Beitostølen</p>
            <p className="text-blue-200 text-sm mt-2">Tlf: 61 34 08 00</p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-3xl px-5 py-5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Åpningstider fellesrom</p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-blue-200">Mandag–fredag</span><span className="text-white font-semibold">07:00–22:00</span></div>
              <div className="flex justify-between"><span className="text-blue-200">Lørdag–søndag</span><span className="text-white font-semibold">08:00–21:00</span></div>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-3xl px-5 py-5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">Nyttige lenker</p>
            <a href="https://www.bhs.no" target="_blank" rel="noopener noreferrer"
              className="text-blue-200 text-sm underline block mb-1">bhs.no — offisiell nettside</a>
          </div>
        </div>

        <p className="text-blue-300/50 text-xs text-center mt-8">
          Denne siden er åpen for alle — ingen innlogging nødvendig.
        </p>
        <div className="text-center mt-4">
          <a href="/login" className="text-blue-200 text-sm font-semibold underline">Logg inn på appen →</a>
        </div>
      </div>
    </div>
  );
}
