export default function BusPe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="800" height="280" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pe-stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="20" fill="#FBC02D"/>
          <rect x="10" width="10" height="20" fill="#388E3C"/>
        </pattern>
      </defs>
      <rect x="5" y="120" width="790" height="40" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <rect x="10" y="125" width="780" height="30" rx="1" fill="url(#pe-stripes)"/>
      <circle cx="50" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="45" y1="140" x2="55" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="50" y1="135" x2="50" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="150" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="145" y1="140" x2="155" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="150" y1="135" x2="150" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="250" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="245" y1="140" x2="255" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="250" y1="135" x2="250" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="350" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="345" y1="140" x2="355" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="350" y1="135" x2="350" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="450" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="445" y1="140" x2="455" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="450" y1="135" x2="450" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="550" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="545" y1="140" x2="555" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="550" y1="135" x2="550" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="650" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="645" y1="140" x2="655" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="650" y1="135" x2="650" y2="145" stroke="#606060" strokeWidth="2"/>
      <circle cx="750" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>
      <line x1="745" y1="140" x2="755" y2="140" stroke="#606060" strokeWidth="2"/>
      <line x1="750" y1="135" x2="750" y2="145" stroke="#606060" strokeWidth="2"/>
    </svg>
  );
}
