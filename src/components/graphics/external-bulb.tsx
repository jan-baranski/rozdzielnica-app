import React from "react";

export default function ExternalBulb(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="380" height="260" rx="8" fill="#F0F4F8" stroke="#D1D9E0" strokeWidth="2"/>
      
      {/* Lightbulb vector */}
      <circle cx="200" cy="110" r="50" fill="#FFD54F" stroke="#F57F17" strokeWidth="4"/>
      <path d="M170 150 L230 150 L220 190 L180 190 Z" fill="#B0BEC5" stroke="#90A4AE" strokeWidth="4"/>
      <path d="M190 190 L210 190 L210 210 L190 210 Z" fill="#78909C" stroke="#546E7A" strokeWidth="4"/>

      {/* Glow rays */}
      <line x1="200" y1="20" x2="200" y2="40" stroke="#FFD54F" strokeWidth="5" strokeLinecap="round"/>
      <line x1="280" y1="110" x2="300" y2="110" stroke="#FFD54F" strokeWidth="5" strokeLinecap="round"/>
      <line x1="100" y1="110" x2="120" y2="110" stroke="#FFD54F" strokeWidth="5" strokeLinecap="round"/>
      <line x1="140" y1="50" x2="155" y2="65" stroke="#FFD54F" strokeWidth="5" strokeLinecap="round"/>
      <line x1="260" y1="50" x2="245" y2="65" stroke="#FFD54F" strokeWidth="5" strokeLinecap="round"/>

      <text x="200" y="240" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#455A64" textAnchor="middle">LIGHTING</text>
    </svg>
  );
}
