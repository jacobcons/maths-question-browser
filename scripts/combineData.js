import { readFile, writeFile } from 'fs/promises';
import gcse from './gcse/gcse.json' with { type: 'json' };
import ukmt from './ukmt/ukmt.json' with { type: 'json' };
import m from './modules.json' with { type: 'json' };

const data = {
  exams: [...gcse, ...ukmt],
  modules: m.modules,
};

await writeFile('./data.json', JSON.stringify(data, null, 2));
