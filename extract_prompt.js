const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Lenovo/.gemini/antigravity/brain/9810bc69-2220-4559-83d2-1e1e1857f1c6/.system_generated/logs/transcript_full.jsonl', 'utf-8').split('\n');

for (const line of lines) {
  if (!line) continue;
  const obj = JSON.parse(line);
  if (obj.source === 'USER_EXPLICIT' && obj.content && obj.content.includes('PART 1 — PRODUCTS LIST PAGE')) {
    console.log(obj.content);
    break;
  }
}
