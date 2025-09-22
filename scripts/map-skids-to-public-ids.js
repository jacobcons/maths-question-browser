import { readFile, writeFile } from 'fs/promises';

const { modules } = JSON.parse(await readFile('./modules.json', 'utf-8'));
const mapping = {};
for (const m of modules) {
  for (const u of m.units) {
    for (const s of u.skills) {
      mapping[s.publicid] = s.skid;
    }
  }
}
await writeFile('./skill-id-mapping.json', JSON.stringify(mapping, null, 2));
