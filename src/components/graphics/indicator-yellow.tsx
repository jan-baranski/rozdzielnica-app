export default function IndicatorYellow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="100" height="280" viewBox="0 0 100 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="90" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>
      <rect x="5" y="5" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>
      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>
      <rect x="20" y="100" width="60" height="80" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>
      <rect x="23" y="103" width="54" height="74" rx="2" fill="#F5F5F5"/>
      <circle cx="50" cy="130" r="20" fill="#FDD835"/>
      <circle cx="50" cy="130" r="16" fill="#FFEE58" opacity="0.9"/>
      <circle cx="45" cy="125" r="6" fill="#FFF9C4" opacity="0.7"/>
      <text x="50" y="168" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="normal" fill="#1A1A1A" textAnchor="middle">230V</text>
      <rect x="5" y="230" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>
      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>
    </svg>
  );
}
