import { readFile, writeFile } from 'fs/promises';

const exams = JSON.parse(
  await readFile('ukmt-with-duplicate-questions.json', 'utf-8')
);
const qids = new Set();
const newExams = [];
let countQs = 0;
let countQsWithDupsRemoved = 0;

for (const e of exams) {
  const newQuestions = [];
  for (const q of e.questions) {
    countQs += 1;
    if (!qids.has(q.qid)) {
      countQsWithDupsRemoved += 1;
      newQuestions.push(q);
    }
    qids.add(q.qid);
  }
  if (newQuestions.length !== 0) {
    e.questions = newQuestions;
    newExams.push(e);
  }
}

console.log(countQs);
console.log(countQsWithDupsRemoved);
await writeFile('./ukmt.json', JSON.stringify(newExams, null, 2));
