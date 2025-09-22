import { readFile } from 'fs/promises';

const exams = JSON.parse(await readFile('./ukmt.json', 'utf-8'));
const skillIdCounts = {};
for (const e of exams) {
  for (const q of e.questions) {
    for (const id of q.skillscache) {
      if (!skillIdCounts[id]) {
        skillIdCounts[id] = 1;
      } else {
        skillIdCounts[id] += 1;
      }
    }
  }
}

const json = JSON.parse(await readFile('../modules.json', 'utf-8'));
const skills = [];
for (const m of json.modules) {
  for (const u of m.units) {
    for (const s of u.skills) {
      for (const [id, count] of Object.entries(skillIdCounts)) {
        if (id == s.skid) {
          skills.push({ id: s.publicid, name: s.name, count });
        }
      }
    }
  }
}

skills.sort((a, b) => b.count - a.count);
console.log(skills.slice(0, 50));
