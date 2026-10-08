import fs from 'fs';
import path from 'path';

const stepsDir = 'C:\\Users\\Usuario\\.gemini\\antigravity-ide\\brain\\7db8cb0a-ed49-4847-8c2c-e61a6514b13a\\.system_generated\\steps';
const files = fs.readdirSync(stepsDir);

const foundUrls = new Set();
const foundEndpoints = new Set();

for (const file of files) {
  try {
    const filePath = path.join(stepsDir, file, 'content.md');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const apiMatches = content.match(/\/api\/[a-zA-Z0-9_\-\/]+/g);
      if (apiMatches) apiMatches.forEach((m) => foundEndpoints.add(m));

      const hostMatches = content.match(/https?:\/\/[a-zA-Z0-9_\-\.]*dramasfree[a-zA-Z0-9_\-\/\.]*/g);
      if (hostMatches) hostMatches.forEach((m) => foundUrls.add(m));
    }
  } catch {}
}

console.log('--- FOUND API ENDPOINTS ---');
console.log(Array.from(foundEndpoints).slice(0, 50));

console.log('\n--- FOUND DRAMASFREE URLS ---');
console.log(Array.from(foundUrls).slice(0, 50));
