import React from 'react';

export const DashboardIllustration = () => (
  <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="800" height="500" fill="#020617" />
    <rect x="20" y="20" width="200" height="460" rx="10" fill="#0F172A" stroke="#1E293B" />
    <rect x="240" y="20" width="540" height="340" rx="10" fill="#0F172A" stroke="#1E293B" />
    <rect x="240" y="380" width="540" height="100" rx="10" fill="#0F172A" stroke="#1E293B" />

    {/* Sidebar items */}
    <rect x="40" y="50" width="160" height="30" rx="4" fill="#2DD4BF" fillOpacity="0.1" />
    <rect x="40" y="100" width="160" height="30" rx="4" fill="#1E293B" />
    <rect x="40" y="150" width="160" height="30" rx="4" fill="#1E293B" />

    {/* Content items */}
    <circle cx="280" cy="60" r="20" fill="#2DD4BF" fillOpacity="0.2" />
    <rect x="320" y="50" width="200" height="20" rx="4" fill="#1E293B" />
    <rect x="280" y="100" width="460" height="10" rx="2" fill="#1E293B" />
    <rect x="280" y="120" width="460" height="10" rx="2" fill="#1E293B" />
    <rect x="280" y="140" width="300" height="10" rx="2" fill="#1E293B" />

    {/* Terminal lines */}
    <rect x="260" y="400" width="10" height="10" fill="#2DD4BF" />
    <rect x="280" y="400" width="200" height="10" rx="2" fill="#1E293B" />
    <rect x="260" y="420" width="300" height="10" rx="2" fill="#1E293B" />
  </svg>
);

export const ChatIllustration = () => (
  <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-8">
    <rect x="50" y="50" width="400" height="80" rx="20" fill="#1E293B" />
    <rect x="350" y="150" width="400" height="120" rx="20" fill="#2DD4BF" fillOpacity="0.1" stroke="#2DD4BF" strokeOpacity="0.3" />
    <rect x="50" y="290" width="500" height="100" rx="20" fill="#1E293B" />
    <circle cx="80" cy="90" r="15" fill="#334155" />
    <rect x="110" y="80" width="200" height="10" rx="5" fill="#334155" />
    <rect x="110" y="100" width="150" height="10" rx="5" fill="#334155" />
  </svg>
);

export const CodeIllustration = () => (
  <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-8">
    <rect width="800" height="500" rx="12" fill="#0F172A" />
    <rect x="0" y="0" width="800" height="40" rx="0" fill="#1E293B" />
    <circle cx="20" cy="20" r="5" fill="#EF4444" />
    <circle cx="40" cy="20" r="5" fill="#F59E0B" />
    <circle cx="60" cy="20" r="5" fill="#10B981" />

    <text x="40" y="80" fill="#2DD4BF" fontFamily="monospace" fontSize="16">class</text>
    <text x="100" y="80" fill="#7DD3FC" fontFamily="monospace" fontSize="16">EngunityEngine</text>
    <text x="240" y="80" fill="#F1F5F9" fontFamily="monospace" fontSize="16">:</text>

    <text x="60" y="110" fill="#2DD4BF" fontFamily="monospace" fontSize="16">def</text>
    <text x="100" y="110" fill="#7DD3FC" fontFamily="monospace" fontSize="16">optimize_context</text>
    <text x="250" y="110" fill="#F1F5F9" fontFamily="monospace" fontSize="16">(self, data):</text>

    <rect x="60" y="140" width="400" height="20" rx="4" fill="#2DD4BF" fillOpacity="0.1" />
    <text x="80" y="155" fill="#94A3B8" fontFamily="monospace" fontSize="12"># Initializing neural weights...</text>
  </svg>
);

export const DocsIllustration = () => (
  <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-12">
    <rect x="100" y="40" width="600" height="420" rx="4" fill="#F1F5F9" />
    <rect x="100" y="40" width="600" height="60" rx="0" fill="#E2E8F0" />
    <rect x="140" y="140" width="520" height="10" rx="2" fill="#CBD5E1" />
    <rect x="140" y="170" width="520" height="10" rx="2" fill="#CBD5E1" />
    <rect x="140" y="200" width="400" height="10" rx="2" fill="#CBD5E1" />

    <rect x="140" y="260" width="520" height="120" rx="8" fill="#2DD4BF" fillOpacity="0.1" stroke="#2DD4BF" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="8 4" />
    <circle cx="400" cy="320" r="25" stroke="#2DD4BF" strokeWidth="2" />
    <line x1="418" y1="338" x2="435" y2="355" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const NotebookIllustration = () => (
  <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-8">
    <rect x="50" y="50" width="340" height="180" rx="12" fill="#1E293B" stroke="#334155" />
    <rect x="410" y="50" width="340" height="180" rx="12" fill="#1E293B" stroke="#334155" />
    <rect x="50" y="250" width="700" height="200" rx="12" fill="#1E293B" stroke="#334155" />

    <rect x="80" y="80" width="60" height="60" rx="8" fill="#2DD4BF" fillOpacity="0.2" />
    <rect x="160" y="80" width="200" height="15" rx="4" fill="#334155" />
    <rect x="160" y="110" width="150" height="10" rx="4" fill="#334155" />

    <circle cx="450" cy="140" r="40" stroke="#7DD3FC" strokeWidth="4" strokeDasharray="20 10" />
    <text x="510" y="130" fill="#7DD3FC" fontSize="24" fontWeight="bold">84%</text>
  </svg>
);
