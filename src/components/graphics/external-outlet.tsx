import React from "react";

export default function ExternalOutlet(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 500 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="480" height="260" rx="8" fill="#F0F4F8" stroke="#D1D9E0" strokeWidth="2"/>
      
      {/* Socket panel frame */}
      <rect x="175" y="40" width="150" height="150" rx="15" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="4"/>
      <circle cx="250" cy="115" r="55" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="2"/>
      
      {/* Pin holes (L, N) */}
      <circle cx="225" cy="115" r="8" fill="#37474F"/>
      <circle cx="275" cy="115" r="8" fill="#37474F"/>
      
      {/* Earth pin (PE) */}
      <circle cx="250" cy="80" r="9" fill="#B0BEC5" stroke="#78909C" strokeWidth="2"/>

      <text x="250" y="240" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#455A64" textAnchor="middle">230V SOCKET</text>
    </svg>
  );
}
