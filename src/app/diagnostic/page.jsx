export default function Page() {
  return (
    <div className="min-h-screen pt-24 bg-[#0f0f0f] text-white px-4">
      <div className="container mx-auto max-w-3xl bg-[#1a1a1a] border border-[#d4af37]/30 rounded-xl p-8">
        <h1 className="text-2xl font-bold text-[#d4af37] mb-4">Diagnostics Disabled</h1>
        <p className="text-gray-300">
          Diagnostics were disabled for production deployment. Re-enable only in a temporary private preview build.
        </p>
      </div>
    </div>
  );
}
