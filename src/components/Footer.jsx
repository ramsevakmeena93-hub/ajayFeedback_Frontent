export default function Footer() {
  return (
    <footer className="bg-[#1a1d29] border-t border-slate-800 text-white py-8">
      <div className="max-w-6xl mx-auto px-4 text-center">
        {/* Main Text */}
        <p className="text-slate-300 text-sm mb-2">
          <span className="text-slate-400">©</span> 2026 MITS Gwalior Examination Management System.
        </p>
        
        {/* Under Section */}
        <p className="text-slate-400 text-sm mb-6">
          Under <span className="text-blue-400 font-semibold">SDC Club</span> & <span className="text-blue-400 font-semibold">TechForge Club</span>
        </p>

        {/* Powered By Section */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Powered By</span>
        </div>

        {/* Club Logos */}
        <div className="flex items-center justify-center gap-6">
          {/* MITS Logo */}
          <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center p-2 hover:border-blue-500/50 transition-all">
            <img 
              src="/mits-logo.png" 
              alt="MITS"
              className="w-full h-full object-contain opacity-90"
              onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="text-blue-400 text-xs font-bold">MITS</div>'; }}
            />
          </div>

          {/* SDC Club Logo */}
          <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center p-2 hover:border-blue-500/50 transition-all">
            <img 
              src="/sdc-logo.png" 
              alt="SDC Club"
              className="w-full h-full object-contain opacity-90"
              onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="text-orange-400 text-xs font-bold">SDC</div>'; }}
            />
          </div>

          {/* TechForge Club Logo */}
          <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center p-2 hover:border-blue-500/50 transition-all">
            <img 
              src="/techforge-logo.png" 
              alt="TechForge Club"
              className="w-full h-full object-contain opacity-90"
              onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="text-cyan-400 text-xs font-bold">TF</div>'; }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
