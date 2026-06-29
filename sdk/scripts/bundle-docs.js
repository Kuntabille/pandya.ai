const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '../../docs/prompts');
const outDir = path.resolve(__dirname, '../src/generated');
const outFile = path.join(outDir, 'prompts.ts');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let content = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n// This file bundles the markdown prompts for SDK usage.\n\n`;
content += `export const PROMPTS: Record<string, string> = {};\n\n`;

const files = fs.readdirSync(docsDir);

for (const file of files) {
  if (file.endsWith('.md')) {
    const filePath = path.join(docsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const key = path.basename(file, '.md');
    
    // Stringify safely for TS
    content += `PROMPTS['${key}'] = ${JSON.stringify(fileContent)};\n\n`;
  }
}

fs.writeFileSync(outFile, content, 'utf-8');
console.log(`Bundled ${files.length} prompt files into ${outFile}`);
