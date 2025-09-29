<script setup>
import { ref, computed, watch, useTemplateRef, nextTick } from 'vue';
import { exams, modules } from './data.json';
// FILTER BY SKILL/PAPER/QUESTION IDS
const { examType, skill, qids } = Object.fromEntries(
  new URLSearchParams(window.location.search).entries(),
);

const filterBy = ref(qids ? 'questionIds' : 'skill');

// FILTER BY SKILL OPTIONS
const examTypesFilter = ref(examType ? [Number(examType)] : []);
const difficultiesFilter = ref([1, 2, 3]);
const calculatorFilter = ref(0);
const skillsFilter = ref(skill ? skill : '');
const parsedSkillsFilter = computed(() =>
  // convert string of skills into [{mainSkillInternalId, subskillLetter}...]
  skillsFilter.value.split(' ').map((id) => {
    let mainSkillPublicId, subskillLetter;
    if (/[a-z]/.test(id[id.length - 1])) {
      mainSkillPublicId = +id.slice(0, id.length - 1);
      subskillLetter = id[id.length - 1];
    } else {
      mainSkillPublicId = +id;
    }

    // map public skill id to internal one
    let mainSkillInternalId;
    for (const m of modules) {
      for (const u of m.units) {
        for (const s of u.skills) {
          if (s.publicid === mainSkillPublicId) {
            mainSkillInternalId = s.skid;
          }
        }
      }
    }
    return {
      mainSkillInternalId,
      subskillLetter,
    };
  }),
);

// FILTER BY PAPER OPTIONS
const paperName = ref('');
const examTypeId = ref();

// FILTER BY QUESTION IDS OPTIONS
const questionIds = ref(qids ? qids.split(',').map((x) => Number(x)) : []);

// FETCH QUESTIONS
const filteredQuestions = computed(() => {
  let t = 0;
  if (filterBy.value === 'skill') {
    const qs = [];
    const qIdsAlreadyAdded = new Set();
    for (const e of exams) {
      if (!examTypesFilter.value.includes(e.parent)) continue;
      for (const q of e.questions) {
        if (qIdsAlreadyAdded.has(q.qid)) continue;

        const hasCorrectCalcOption =
          calculatorFilter.value === 0 || q.calc === calculatorFilter.value;
        if (
          !difficultiesFilter.value.includes(q.difficulty) ||
          !hasCorrectCalcOption
        )
          continue;

        const qMainSkills = q.skillscache;
        const qSubskill = q.subskill?.letter;
        for (const sId of parsedSkillsFilter.value) {
          const { mainSkillInternalId, subskillLetter } = sId;
          // no subskill from user => check mainskill match, else check both
          const questionMatchesMainSkill =
            qMainSkills.includes(mainSkillInternalId);
          if (
            questionMatchesMainSkill &&
            (!subskillLetter || subskillLetter === qSubskill)
          ) {
            qs.push(q);
            qIdsAlreadyAdded.add(q.qid);
            break;
          }
        }
      }
    }
    return qs;
  } else if (filterBy.value === 'paper') {
    for (const e of exams) {
      if (e.name === paperName.value) {
        examTypeId.value = e.parent;
        return e.questions;
      }
    }
  } else if (filterBy.value === 'questionIds') {
    const qs = [];
    const qIdsAlreadyAdded = new Set();
    for (const e of exams) {
      for (const q of e.questions) {
        if (qIdsAlreadyAdded.has(q.qid)) continue;
        if (questionIds.value.includes(q.qid)) {
          qs.push(q);
          qIdsAlreadyAdded.add(q.qid);
        }
      }
    }
    return qs.sort((a, b) => qids.indexOf(a.qid) - qids.indexOf(b.qid));
  }
  return [];
});

// RENDER QUESTIONS
const A_CHARCODE = 65;
function prefixAssetPathToImgSrcs(str) {
  return str.replaceAll(/src="(.+?)"/g, (match, p1) => `src="assets/${p1}"`);
}
// render mathjax when questions changes
watch(
  filteredQuestions,
  async () => {
    await nextTick();
    await MathJax.typesetPromise(['.js-question']);
  },
  {
    immediate: true,
  },
);

// set defaults for question ui state when questions change
const questionsUiState = ref({});
watch(
  filteredQuestions,
  (qs) => {
    for (const q of qs) {
      questionsUiState.value[q.qid] = { showAnswer: false };
    }
  },
  { immediate: true },
);

function extractQuestionNameFromContentEdexcel(content) {
  return content.match(/.*\[(Edexcel.*)\].*/)[1];
}

// links
function generateLinkToCorbett(question) {
  let mainSkillName;
  const mainSkillInternalId = question.skillscache[0];
  for (const m of modules) {
    for (const u of m.units) {
      for (const s of u.skills) {
        if (s.skid === mainSkillInternalId) {
          mainSkillName = s.name;
        }
      }
    }
  }
  const subskillName = question.subskill?.name;

  const searchQuery = [
    mainSkillName,
    subskillName,
    'Corbettmaths Textbook Exercise',
  ].join(' -- ');

  return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
}

function generateLinkToDFM(question) {
  const mainSkillInternalId = question.skillscache[0];
  const subskillLetter = question.subskill?.letter;
  return `https://www.drfrost.org/explorer.php?skid=${mainSkillInternalId}${subskillLetter ? `#subskillLetter=${subskillLetter}` : ''}`;
}

function generateLinkToSimilar(question) {
  const mainSkillInternalId = question.skillscache[0];
  const subskillLetter = question.subskill?.letter;

  // map internal skill id to public one
  let mainSkillPublicId;
  for (const m of modules) {
    for (const u of m.units) {
      for (const s of u.skills) {
        if (s.skid === mainSkillInternalId) {
          mainSkillPublicId = s.publicid;
        }
      }
    }
  }

  const queryString = new URLSearchParams({
    examType: examTypeId.value,
    calculator: 0,
    skill: `${mainSkillPublicId}${subskillLetter ? subskillLetter : ''}`,
  });
  return `${window.location.hostname}?${queryString}`;
}
</script>

<template>
  <div class="text-base-content m-auto my-12 w-[90%] max-w-6xl">
    <h1 class="mb-8">Maths Question Browser</h1>

    <div class="mb-8">
      <h2 class="mb-3">Filter:</h2>

      <select id="filter" class="select" v-model="filterBy">
        <option value="skill">...by skill</option>
        <option value="paper">...by paper</option>
        <option value="questionIds">...by question ids</option>
      </select>
    </div>

    <div v-if="filterBy === 'skill'">
      <div class="mb-10 flex flex-wrap gap-8">
        <fieldset
          class="fieldset bg-base-100 border-base-300 rounded-box flex-1 border p-4"
        >
          <legend class="fieldset-legend text-xl">GCSE</legend>
          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="12"
              v-model="examTypesFilter"
            />
            GCSE Foundation
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="13"
              v-model="examTypesFilter"
            />
            GCSE Higher
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="9"
              v-model="examTypesFilter"
            />
            GCSE Foundation (Legacy)
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="11"
              v-model="examTypesFilter"
            />
            GCSE Higher (Legacy)
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="12894"
              v-model="examTypesFilter"
            />
            IGCSE Foundation
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="12898"
              v-model="examTypesFilter"
            />
            IGCSE Higher
          </label>
        </fieldset>

        <fieldset
          class="fieldset bg-base-100 border-base-300 rounded-box flex-1 border p-4"
        >
          <legend class="fieldset-legend text-xl">UKMT</legend>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="45"
              v-model="examTypesFilter"
            />
            JMC
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="46"
              v-model="examTypesFilter"
            />
            IMC
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="47"
              v-model="examTypesFilter"
            />
            SMC
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="50"
              v-model="examTypesFilter"
            />
            Junior Kangaroo
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="51"
              v-model="examTypesFilter"
            />
            Intermediate Kangaroo
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="19431"
              v-model="examTypesFilter"
            />
            Senior Kangaroo
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="48"
              v-model="examTypesFilter"
            />
            JMO
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="49"
              v-model="examTypesFilter"
            />
            IMO
          </label>
        </fieldset>

        <fieldset
          class="fieldset bg-base-100 border-base-300 rounded-box flex-1 border p-4"
        >
          <legend class="fieldset-legend text-xl">Difficulty</legend>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="1"
              checked
              v-model="difficultiesFilter"
            />
            1
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="2"
              checked
              v-model="difficultiesFilter"
            />
            2
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="3"
              checked
              v-model="difficultiesFilter"
            />
            3
          </label>

          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
              :value="4"
              v-model="difficultiesFilter"
            />
            4
          </label>
        </fieldset>

        <div class="flex-1">
          <h3 class="mb-3">Calculator:</h3>
          <select class="select" v-model="calculatorFilter">
            <option :value="0">Both</option>
            <option :value="1">Calc</option>
            <option :value="2">Non-Calc</option>
          </select>
        </div>

        <div class="min-w-[200px] flex-1">
          <h3 class="mb-3">Skills:</h3>
          <input type="text" class="input" v-model="skillsFilter" />
        </div>
      </div>
      <p v-if="skillsFilter" class="mb-3">
        Found <b>{{ filteredQuestions.length }}</b> matching questions
      </p>
    </div>
    <div v-if="skillsFilter === 'paper'" class="mb-10">
      <div class="min-w-[200px]">
        <h3 class="mb-3">Name:</h3>
        <input type="text" class="input w-full" v-model="paperName" />
      </div>
    </div>
    <div v-else class="mb-10"></div>

    <div>
      <div
        v-for="q in filteredQuestions"
        :key="q.qid"
        class="card bg-base-100 js-question mb-8 max-w-full p-8 shadow-sm"
      >
        <!--        <img :src="`assets${q.img}`" alt="" v-if="q.img" class="max-w-xs" />-->
        <div
          class="mb-8 flex flex-wrap justify-between gap-8 border-b-[2px] pb-8 align-top"
        >
          <div>
            <template v-if="q.img">
              <img :src="`assets${q.img}`" alt="" />
            </template>
            <template v-else>
              <div
                class="flex flex-col gap-y-4"
                v-html="prefixAssetPathToImgSrcs(q.content)"
              ></div>
              <ul v-if="q.answer.data.options">
                <li v-for="(option, i) in q.answer.data.options">
                  <b>{{ String.fromCharCode(A_CHARCODE + i) }}</b>
                  {{ option }}
                </li>
              </ul>
            </template>
          </div>
          <template v-if="questionsUiState[q.qid]?.showAnswer">
            <div
              v-html="prefixAssetPathToImgSrcs(q.response)"
              v-if="q.response"
              class="max-w-2xl"
            ></div>
            <p>
              {{ JSON.stringify(q.answer.correctAnswer, null, 2) }}
            </p>
          </template>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="!m-0 flex flex-wrap gap-2">
              <span v-if="q.difficulty">Difficulty: {{ q.difficulty }}/4</span>
              <span v-if="q.marks"
                ><b>({{ q.marks }} marks)</b></span
              >
              <span v-if="q.qid"
                ><b>(id={{ q.qid }})</b></span
              >
              <template v-if="q.img">
                <span
                  v-if="name = extractQuestionNameFromContentEdexcel(q.content)"
                  v-html="name"
                ></span>
              </template>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-primary"
              @click="
                questionsUiState[q.qid].showAnswer =
                  !questionsUiState[q.qid].showAnswer
              "
            >
              Toggle Answer
            </button>
            <a
              :href="generateLinkToSimilar(q)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button class="btn btn-secondary">Similar</button>
            </a>
            <a
              :href="generateLinkToCorbett(q)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button class="btn btn-accent">Corbett</button>
            </a>
            <a
              :href="generateLinkToDFM(q)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button class="btn btn-info">DFM</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
