import data from './data.json' with { type: 'json' };

const { exams } = data;
const mapSkillsToTotalMarks = {};
for (const e of exams) {
  if (e.parent !== 12) continue;
  for (const q of e.questions) {
    for (const s of q.skillscache) {
      if (mapSkillsToTotalMarks[s]) {
        mapSkillsToTotalMarks[s] += q.marks;
      } else {
        mapSkillsToTotalMarks[s] = q.marks;
      }
    }
  }
}

const { modules } = data;
const mapSkillNamesToTotalMarks = {};
const mapUnitNamesToTotalMarks = {};
let t = 0;
for (const m of modules) {
  for (const u of m.units) {
    for (const s of u.skills) {
      const totalMarksForSkill = mapSkillsToTotalMarks[s.skid];
      if (totalMarksForSkill) {
        mapSkillNamesToTotalMarks[`${s.name}-${s.publicid}`] =
          totalMarksForSkill;
        t += totalMarksForSkill;
        if (mapUnitNamesToTotalMarks[u.name]) {
          mapUnitNamesToTotalMarks[u.name] += totalMarksForSkill;
        } else {
          mapUnitNamesToTotalMarks[u.name] = totalMarksForSkill;
        }
      }
    }
  }
}

console.log(
  JSON.stringify(
    Object.entries(mapSkillNamesToTotalMarks).sort((a, b) => a[1] - b[1]),
    null,
    1,
  ),
);

console.log(
  JSON.stringify(
    Object.entries(mapUnitNamesToTotalMarks)
      .sort((a, b) => a[1] - b[1])
      .map((a) => [a[0], a[1], `${((a[1] / t) * 100).toFixed(2)}%`]),
    null,
    1,
  ),
);

console.log(t);
