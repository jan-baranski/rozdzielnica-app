export default function Blank2p(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="200" height="280" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="190" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>
      <rect x="5" y="5" width="190" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <rect x="5" y="230" width="190" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>
      <line x1="10" y1="55" x2="190" y2="55" stroke="#C62828" strokeWidth="2"/>
    </svg>
  );
}
