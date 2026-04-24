export default function Mcb1pB10(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="100" height="280" viewBox="0 0 100 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main housing */}
      <rect x="5" y="5" width="90" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>

      {/* Top terminal */}
      <rect x="5" y="5" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>
      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>
      <rect x="20" y="15" width="8" height="3" rx="1" fill="#B0B0B0"/>
      <rect x="72" y="15" width="8" height="3" rx="1" fill="#B0B0B0"/>

      {/* Red separator line */}
      <line x1="10" y1="55" x2="90" y2="55" stroke="#C62828" strokeWidth="2"/>

      {/* Rating label */}
      <text x="50" y="90" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">B10</text>

      {/* I-ON indicator */}
      <rect x="35" y="115" width="30" height="14" rx="1" fill="#C62828"/>
      <text x="50" y="125" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>

      {/* Toggle switch housing */}
      <rect x="30" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>
      <rect x="33" y="143" width="34" height="59" rx="2" fill="#F5F5F5"/>

      {/* Toggle switch handle - UP position */}
      <rect x="42" y="148" width="16" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>
      <rect x="44" y="150" width="12" height="24" rx="1" fill="#3A3A3A"/>

      {/* Bottom terminal */}
      <rect x="5" y="230" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>
      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>
      <rect x="20" y="262" width="8" height="3" rx="1" fill="#B0B0B0"/>
      <rect x="72" y="262" width="8" height="3" rx="1" fill="#B0B0B0"/>
    </svg>
  );
}

