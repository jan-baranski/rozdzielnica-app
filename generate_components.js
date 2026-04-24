const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'components', 'graphics');

const wrapSvg = (name, content) => 'export default function ' + name + '(props: React.SVGProps<SVGSVGElement>) {\n  return (\n' + content + '\n  );\n}\n';

const mcb3pBase = (label) => '    <svg {...props} width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="270" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="270" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="60" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="55" y1="27" x2="65" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="60" y1="22" x2="60" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="140" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="135" y1="27" x2="145" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="140" y1="22" x2="140" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="220" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="215" y1="27" x2="225" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="220" y1="22" x2="220" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="270" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="140" y="90" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">' + label + '</text>\n' +
'      <rect x="110" y="115" width="60" height="14" rx="1" fill="#C62828"/>\n' +
'      <text x="140" y="125" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>\n' +
'      <rect x="40" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="43" y="143" width="34" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="52" y="148" width="16" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="54" y="150" width="12" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="120" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="123" y="143" width="34" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="132" y="148" width="16" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="134" y="150" width="12" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="200" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="203" y="143" width="34" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="212" y="148" width="16" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="214" y="150" width="12" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="5" y="230" width="270" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="60" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="55" y1="252" x2="65" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="60" y1="247" x2="60" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="140" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="135" y1="252" x2="145" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="140" y1="247" x2="140" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="220" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="215" y1="252" x2="225" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="220" y1="247" x2="220" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const rcd2pBase = '    <svg {...props} width="200" height="280" viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="190" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="190" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="27" x2="155" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="22" x2="150" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="190" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="100" y="90" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">40A</text>\n' +
'      <text x="100" y="110" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">30mA</text>\n' +
'      <rect x="85" y="125" width="30" height="14" rx="1" fill="#C62828"/>\n' +
'      <text x="100" y="135" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>\n' +
'      <rect x="50" y="145" width="100" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="53" y="148" width="94" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="62" y="153" width="76" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="64" y="155" width="72" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="155" y="145" width="30" height="20" rx="3" fill="#1976D2" stroke="#1565C0" strokeWidth="1"/>\n' +
'      <text x="170" y="158" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">TEST</text>\n' +
'      <rect x="5" y="230" width="190" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="252" x2="155" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="247" x2="150" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const rcd4pBase = '    <svg {...props} width="400" height="280" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="390" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="390" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="27" x2="155" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="22" x2="150" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="27" x2="255" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="22" x2="250" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="350" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="345" y1="27" x2="355" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="350" y1="22" x2="350" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="390" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="200" y="90" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">40A</text>\n' +
'      <text x="200" y="110" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">30mA</text>\n' +
'      <rect x="185" y="125" width="30" height="14" rx="1" fill="#C62828"/>\n' +
'      <text x="200" y="135" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>\n' +
'      <rect x="150" y="145" width="100" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="153" y="148" width="94" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="162" y="153" width="76" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="164" y="155" width="72" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="355" y="145" width="30" height="20" rx="3" fill="#1976D2" stroke="#1565C0" strokeWidth="1"/>\n' +
'      <text x="370" y="158" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">TEST</text>\n' +
'      <rect x="5" y="230" width="390" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="252" x2="155" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="247" x2="150" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="252" x2="255" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="247" x2="250" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="350" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="345" y1="252" x2="355" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="350" y1="247" x2="350" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const rcboBase = (label) => '    <svg {...props} width="100" height="280" viewBox="0 0 100 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="90" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="90" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="50" y="90" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">' + label + '</text>\n' +
'      <text x="50" y="110" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">30mA</text>\n' +
'      <rect x="35" y="125" width="30" height="14" rx="1" fill="#C62828"/>\n' +
'      <text x="50" y="135" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>\n' +
'      <rect x="30" y="145" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="33" y="148" width="34" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="42" y="153" width="16" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="44" y="155" width="12" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="70" y="145" width="20" height="14" rx="2" fill="#1976D2" stroke="#1565C0" strokeWidth="1"/>\n' +
'      <text x="80" y="155" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold" fill="white" textAnchor="middle">T</text>\n' +
'      <rect x="5" y="230" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const isolator3pBase = '    <svg {...props} width="300" height="280" viewBox="0 0 300 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="290" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="290" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="27" x2="155" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="22" x2="150" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="27" x2="255" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="22" x2="250" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="290" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="150" y="90" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">63A</text>\n' +
'      <rect x="120" y="115" width="60" height="14" rx="1" fill="#C62828"/>\n' +
'      <text x="150" y="125" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">I-ON</text>\n' +
'      <rect x="90" y="140" width="120" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="93" y="143" width="114" height="59" rx="2" fill="#F5F5F5"/>\n' +
'      <rect x="100" y="148" width="100" height="28" rx="2" fill="#2C2C2C" stroke="#1A1A1A" strokeWidth="1"/>\n' +
'      <rect x="102" y="150" width="96" height="24" rx="1" fill="#3A3A3A"/>\n' +
'      <rect x="5" y="230" width="290" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="252" x2="155" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="247" x2="150" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="252" x2="255" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="247" x2="250" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const spd3pBase = '    <svg {...props} width="300" height="280" viewBox="0 0 300 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="290" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="290" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="27" x2="155" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="22" x2="150" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="27" x2="255" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="22" x2="250" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="10" y1="55" x2="290" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'      <text x="150" y="90" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#1A1A1A" textAnchor="middle">SPD</text>\n' +
'      <rect x="30" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="40" y="160" width="20" height="20" rx="2" fill="#43A047"/>\n' +
'      <rect x="130" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="140" y="160" width="20" height="20" rx="2" fill="#43A047"/>\n' +
'      <rect x="230" y="140" width="40" height="65" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="240" y="160" width="20" height="20" rx="2" fill="#43A047"/>\n' +
'      <rect x="5" y="230" width="290" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="150" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="145" y1="252" x2="155" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="150" y1="247" x2="150" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'      <circle cx="250" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="245" y1="252" x2="255" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="250" y1="247" x2="250" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const indicatorBase = (color) => '    <svg {...props} width="100" height="280" viewBox="0 0 100 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="90" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="27" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="27" x2="55" y2="27" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="22" x2="50" y2="32" stroke="#606060" strokeWidth="2"/>\n' +
'      <rect x="20" y="100" width="60" height="80" rx="3" fill="#E8E8E8" stroke="#B0B0B0" strokeWidth="1"/>\n' +
'      <rect x="23" y="103" width="54" height="74" rx="2" fill="#F5F5F5"/>\n' +
'      <circle cx="50" cy="130" r="20" fill="' + color.main + '"/>\n' +
'      <circle cx="50" cy="130" r="16" fill="' + color.inner + '" opacity="0.9"/>\n' +
'      <circle cx="45" cy="125" r="6" fill="' + color.hl + '" opacity="0.7"/>\n' +
'      <text x="50" y="168" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="normal" fill="#1A1A1A" textAnchor="middle">230V</text>\n' +
'      <rect x="5" y="230" width="90" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <circle cx="50" cy="252" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
'      <line x1="45" y1="252" x2="55" y2="252" stroke="#606060" strokeWidth="2"/>\n' +
'      <line x1="50" y1="247" x2="50" y2="257" stroke="#606060" strokeWidth="2"/>\n' +
'    </svg>';

const blankBase = (modules) => {
  const width = modules * 100;
  const housingWidth = width - 10;
  return '    <svg {...props} width="' + width + '" height="280" viewBox="0 0 ' + width + ' 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="5" width="' + housingWidth + '" height="270" rx="2" fill="#FAFAFA" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="5" width="' + housingWidth + '" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="5" y="230" width="' + housingWidth + '" height="45" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <line x1="10" y1="55" x2="' + housingWidth + '" y2="55" stroke="#C62828" strokeWidth="2"/>\n' +
'    </svg>';
};

const makeBus = (colorStr, pe) => {
  let inner = '';
  for (let i = 0; i < 8; i++) {
    inner += '      <circle cx="' + (50 + i * 100) + '" cy="140" r="12" fill="#D0D0D0" stroke="#A0A0A0" strokeWidth="1"/>\n' +
             '      <line x1="' + (45 + i * 100) + '" y1="140" x2="' + (55 + i * 100) + '" y2="140" stroke="#606060" strokeWidth="2"/>\n' +
             '      <line x1="' + (50 + i * 100) + '" y1="135" x2="' + (50 + i * 100) + '" y2="145" stroke="#606060" strokeWidth="2"/>\n';
  }
  
  if (pe) {
      return '    <svg {...props} width="800" height="280" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <defs>\n' +
'        <pattern id="pe-stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">\n' +
'          <rect width="10" height="20" fill="#FBC02D"/>\n' +
'          <rect x="10" width="10" height="20" fill="#388E3C"/>\n' +
'        </pattern>\n' +
'      </defs>\n' +
'      <rect x="5" y="120" width="790" height="40" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="10" y="125" width="780" height="30" rx="1" fill="url(#pe-stripes)"/>\n' +
      inner +
'    </svg>';
  }

  return '    <svg {...props} width="800" height="280" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
'      <rect x="5" y="120" width="790" height="40" rx="2" fill="#E8E8E8" stroke="#C8C8C8" strokeWidth="1"/>\n' +
'      <rect x="10" y="125" width="780" height="30" rx="1" fill="' + colorStr + '"/>\n' +
      inner +
'    </svg>';
};

const files = {
  'mcb-3p-b20.tsx': wrapSvg('Mcb3pB20', mcb3pBase('B20')),
  'mcb-3p-b25.tsx': wrapSvg('Mcb3pB25', mcb3pBase('B25')),
  'mcb-3p-c16.tsx': wrapSvg('Mcb3pC16', mcb3pBase('C16')),
  'mcb-3p-c20.tsx': wrapSvg('Mcb3pC20', mcb3pBase('C20')),
  'rcd-2p-40a-30ma.tsx': wrapSvg('Rcd2p40a30ma', rcd2pBase),
  'rcd-4p-40a-30ma.tsx': wrapSvg('Rcd4p40a30ma', rcd4pBase),
  'rcbo-1p-b16-30ma.tsx': wrapSvg('Rcbo1pB16_30ma', rcboBase('B16')),
  'rcbo-1p-c16-30ma.tsx': wrapSvg('Rcbo1pC16_30ma', rcboBase('C16')),
  'isolator-3p-63a.tsx': wrapSvg('Isolator3p63a', isolator3pBase),
  'spd-3p.tsx': wrapSvg('Spd3p', spd3pBase),
  'indicator-red.tsx': wrapSvg('IndicatorRed', indicatorBase({main: '#E53935', inner: '#EF5350', hl: '#FFCDD2'})),
  'indicator-yellow.tsx': wrapSvg('IndicatorYellow', indicatorBase({main: '#FDD835', inner: '#FFEE58', hl: '#FFF9C4'})),
  'blank-2p.tsx': wrapSvg('Blank2p', blankBase(2)),
  'blank-3p.tsx': wrapSvg('Blank3p', blankBase(3)),
  'bus-n.tsx': wrapSvg('BusN', makeBus('#1976D2', false)),
  'bus-pe.tsx': wrapSvg('BusPe', makeBus('', true))
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(targetDir, filename), content);
}
console.log('Done');
