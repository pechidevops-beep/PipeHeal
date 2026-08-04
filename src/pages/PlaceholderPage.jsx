export default function PlaceholderPage({ title, icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-[#111827] border border-white/[0.08] flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-[#9CA3AF]">{icon}</span>
      </div>
      <h2 className="font-bold text-3xl text-[#F9FAFB] mb-2" style={{ fontFamily: 'Geist, sans-serif' }}>{title}</h2>
      <p className="text-[#9CA3AF] max-w-md">
        This section is under active development by the autonomous AI build pipeline. Estimated completion: very soon™
      </p>
      <div className="mt-6 flex items-center gap-2 bg-[#4cd7f6]/10 border border-[#4cd7f6]/30 px-4 py-2 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]"></span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4cd7f6]" style={{ fontFamily: 'Inter, sans-serif' }}>
          AI Agent Building...
        </span>
      </div>
    </div>
  );
}
