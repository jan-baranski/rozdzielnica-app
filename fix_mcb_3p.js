const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'components', 'graphics');
const files = fs.readdirSync(targetDir).filter(f => f.startsWith('mcb-3p-'));

for (const file of files) {
  const p = path.join(targetDir, file);
  let content = fs.readFileSync(p, 'utf8');

  // Replace width="280" with width="300" in svg tag
  content = content.replace(/width="280"/g, 'width="300"');
  // viewBox="0 0 280 280" -> viewBox="0 0 300 280"
  content = content.replace(/viewBox="0 0 280 280"/g, 'viewBox="0 0 300 280"');
  // Main housing rect width="270" -> width="290"
  content = content.replace(/width="270"/g, 'width="290"');
  // Top/bottom terminals rect width="270" -> width="290"
  // handled by the /g above
  
  // Red separator line x2="270" -> x2="290"
  content = content.replace(/x2="270"/g, 'x2="290"');

  // Screws from 60, 140, 220 -> 50, 150, 250
  content = content.replace(/cx="60"/g, 'cx="50"');
  content = content.replace(/x1="55" y1="27" x2="65"/g, 'x1="45" y1="27" x2="55"');
  content = content.replace(/x1="60" y1="22" x2="60"/g, 'x1="50" y1="22" x2="50"');
  
  content = content.replace(/x1="55" y1="252" x2="65"/g, 'x1="45" y1="252" x2="55"');
  content = content.replace(/x1="60" y1="247" x2="60"/g, 'x1="50" y1="247" x2="50"');

  content = content.replace(/cx="140"/g, 'cx="150"');
  // wait, the text label is also x="140", we should move it to 150
  content = content.replace(/x="140"/g, 'x="150"');
  content = content.replace(/x1="135" y1="27" x2="145"/g, 'x1="145" y1="27" x2="155"');
  content = content.replace(/x1="140" y1="22" x2="140"/g, 'x1="150" y1="22" x2="150"');
  
  content = content.replace(/x1="135" y1="252" x2="145"/g, 'x1="145" y1="252" x2="155"');
  content = content.replace(/x1="140" y1="247" x2="140"/g, 'x1="150" y1="247" x2="150"');
  // I-ON indicator x="110" -> x="120"
  content = content.replace(/x="110" y="115"/g, 'x="120" y="115"');

  content = content.replace(/cx="220"/g, 'cx="250"');
  content = content.replace(/x1="215" y1="27" x2="225"/g, 'x1="245" y1="27" x2="255"');
  content = content.replace(/x1="220" y1="22" x2="220"/g, 'x1="250" y1="22" x2="250"');
  
  content = content.replace(/x1="215" y1="252" x2="225"/g, 'x1="245" y1="252" x2="255"');
  content = content.replace(/x1="220" y1="247" x2="220"/g, 'x1="250" y1="247" x2="250"');

  // Switch toggles:
  // 1st at x="40" -> 30
  content = content.replace(/x="40" y="140"/g, 'x="30" y="140"');
  content = content.replace(/x="43" y="143"/g, 'x="33" y="143"');
  content = content.replace(/x="52" y="148"/g, 'x="42" y="148"');
  content = content.replace(/x="54" y="150"/g, 'x="44" y="150"');

  // 2nd at x="120" -> 130
  content = content.replace(/x="120" y="140"/g, 'x="130" y="140"');
  content = content.replace(/x="123" y="143"/g, 'x="133" y="143"');
  content = content.replace(/x="132" y="148"/g, 'x="142" y="148"');
  content = content.replace(/x="134" y="150"/g, 'x="144" y="150"');

  // 3rd at x="200" -> 230
  content = content.replace(/x="200" y="140"/g, 'x="230" y="140"');
  content = content.replace(/x="203" y="143"/g, 'x="233" y="143"');
  content = content.replace(/x="212" y="148"/g, 'x="242" y="148"');
  content = content.replace(/x="214" y="150"/g, 'x="244" y="150"');

  fs.writeFileSync(p, content);
}
console.log('Fixed mcb-3p');
