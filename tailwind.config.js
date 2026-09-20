export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        indigo: { 50:"#eef2ff",100:"#e0e7ff",200:"#c7d2fe",300:"#a5b4fc",400:"#818cf8",500:"#6366f1",600:"#4f46e5",700:"#4338ca",800:"#3730a3",900:"#312e81",950:"#1e1b4b" },
        primary: { DEFAULT:"#4f46e5", 50:"#eef2ff", 100:"#e0e7ff", 500:"#6366f1", 600:"#4f46e5", 700:"#4338ca", 800:"#3730a3", 900:"#312e81" },
        secondary:{ DEFAULT:"#059669", 50:"#ecfdf5", 100:"#d1fae5", 500:"#10b981", 600:"#059669", 700:"#047857", 800:"#065f46", 900:"#064e3b" },
        accent:   { DEFAULT:"#f59e0b", 50:"#fffbeb", 100:"#fef3c7", 400:"#fbbf24", 500:"#f59e0b", 600:"#d97706" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: {
        card:     "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)",
        elevated: "0 4px 16px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.06)",
        glow:     "0 0 0 3px rgba(99,102,241,0.15)",
        "glow-emerald": "0 0 0 3px rgba(16,185,129,0.15)",
      },
      borderRadius: { "2xl":"1rem", "3xl":"1.5rem", "4xl":"2rem" },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-slow":"pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { from:{ opacity:"0" },                              to:{ opacity:"1" } },
        slideUp: { from:{ opacity:"0", transform:"translateY(12px)" },to:{ opacity:"1", transform:"translateY(0)" } },
        scaleIn: { from:{ opacity:"0", transform:"scale(0.95)" },     to:{ opacity:"1", transform:"scale(1)" } },
      },
    }
  },
  plugins: []
};
