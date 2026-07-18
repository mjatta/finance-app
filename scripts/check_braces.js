const fs = require('fs');
const s = fs.readFileSync('vite.config.js', 'utf8');
const pairs = [['{','}'], ['(',')'], ['[',']']];
for (const [open, close] of pairs) {
  let stack = 0;
  let lastOpenLine = 0;
  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    for (let ch of l) {
      if (ch === open) { stack++; lastOpenLine = i + 1; }
      if (ch === close) stack--;
      if (stack < 0) {
        console.log(`Too many ${close} by line ${i+1}`);
        process.exit(0);
      }
    }
  }
  if (stack !== 0) console.log(`Unbalanced ${open}${close}: ${stack} (last seen open at or before line ${lastOpenLine})`);
}
console.log('done');
