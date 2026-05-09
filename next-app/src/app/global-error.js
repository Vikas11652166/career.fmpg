'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="bg-[#fcfcfc] text-[#0a0a0a] font-sans antialiased min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-xl w-full text-center border border-gray-100">
          <span className="text-red-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">System Fault Detected</span>
          <h2 className="text-4xl font-black tracking-tighter uppercase mb-6">Critical<br/>Error</h2>
          <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mb-8">An unexpected exception occurred during execution.</p>
          <button 
            onClick={() => reset()}
            className="bg-[#0a0a0a] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-lime-500 hover:text-black transition-all shadow-xl"
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
