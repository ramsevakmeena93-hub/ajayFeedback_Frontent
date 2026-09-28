export default function Footer() {
  return (
    <footer className="mt-auto bg-gradient-to-b from-slate-900 to-black border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Copyright & Credits */}
        <div className="text-center space-y-3">
          <p className="text-slate-400 text-sm">
            © 2026 MITS Gwalior Faculty Feedback System.
          </p>
          
          <p className="text-slate-500 text-sm">
            Under{" "}
            <a 
              href="https://sdcmits.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              SDC Club
            </a>
            {" & "}
            <a 
              href="https://techforge.mitsgwalior.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              TechForge Club
            </a>
          </p>

          {/* Powered By Section */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
              POWERED BY
            </span>
            <div className="flex items-center gap-4">
              {/* Logo 1 - TechForge */}
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://techforge.mitsgwalior.in/logo.png" 
                  alt="TechForge"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-blue-400 font-bold text-xs">TF</span>';
                  }}
                />
              </div>

              {/* Logo 2 - SDC */}
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://sdcmits.in/logo.png" 
                  alt="SDC Club"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-blue-400 font-bold text-xs">SDC</span>';
                  }}
                />
              </div>

              {/* Logo 3 - MITS */}
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                <span className="text-blue-400 font-bold text-xs">MITS</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-slate-600 text-xs pt-2">
            Deemed to be University · Estd. 1957 · Academic Year 2025–26
          </p>
        </div>
      </div>
    </footer>
  );
}
