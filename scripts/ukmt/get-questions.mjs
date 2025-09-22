import { readFile, writeFile } from 'fs/promises';
async function main() {
  const data = JSON.parse(await readFile('./folders.json', 'utf-8'));
  const questionData = [];
  for (const c of data['_children']) {
    const res = await fetch(
      `https://www.drfrost.org/api/worksheets/directory/${c.wdid}?sort=date`,
      {
        headers: {
          accept: 'application/json, text/javascript, */*; q=0.01',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          baggage:
            'sentry-environment=production,sentry-release=d4b8dcf3ed2b1a4079e3f3d474be5dde4a6e80f4,sentry-public_key=e9a7cb90d7fe84969ed38bfd9a243f56,sentry-trace_id=92ffe3ae9b5e422d88efbe83d9dbd159',
          priority: 'u=1, i',
          'sec-ch-ua':
            '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-gpc': '1',
          'sentry-trace': '92ffe3ae9b5e422d88efbe83d9dbd159-8c0ab34d4758be80',
          'x-requested-with': 'XMLHttpRequest',
          cookie:
            '_gcl_au=1.1.334163085.1752834645; g_state={"i_l":0}; _df_session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTM3Mzc0NDUsImV4cCI6MTc1MzgyMzg0NSwiaXNzIjoiZHJmcm9zdC5vcmciLCJzaWQiOiJ3OGt3Y3dzY3NnMGM0Z2c4OG9zODhzZ3cifQ.WCi1K7gPbnR4h6vrsGjo4k8pNWm0lUd0UV3Omfx9Chc; ph_phc_wu5uBJqblldYE2xTOYYttsQaxd9dDHex41m4VV5QET2_posthog=%7B%22distinct_id%22%3A%2201982cf2-4ca7-7b02-a71b-d9f8fe5c39c5%22%2C%22%24sesid%22%3A%5B1753738650418%2C%22019852ec-ce70-7178-a4a6-1eb8009f22b6%22%2C1753737907824%5D%7D',
          Referer: 'https://www.drfrost.org/worksheets.php?wdid=44',
        },
        body: null,
        method: 'GET',
      }
    );

    const exams = await res.json();

    if (res.status !== 200) {
      console.log(res);
      process.exit(0);
      return;
    }

    await wait(100);

    console.log('Downloading exam...');

    for (const e of exams['_children']) {
      if (e.type === 'worksheet') {
        const res = await fetch(
          `https://www.drfrost.org/api/worksheets/worksheet/${e.wid}`,
          {
            headers: {
              accept: 'application/json, text/javascript, */*; q=0.01',
              'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
              baggage:
                'sentry-environment=production,sentry-release=d4b8dcf3ed2b1a4079e3f3d474be5dde4a6e80f4,sentry-public_key=e9a7cb90d7fe84969ed38bfd9a243f56,sentry-trace_id=92ffe3ae9b5e422d88efbe83d9dbd159',
              priority: 'u=1, i',
              'sec-ch-ua':
                '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
              'sec-ch-ua-mobile': '?0',
              'sec-ch-ua-platform': '"Windows"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'sec-gpc': '1',
              'sentry-trace':
                '92ffe3ae9b5e422d88efbe83d9dbd159-8c0ab34d4758be80',
              'x-requested-with': 'XMLHttpRequest',
              cookie:
                '_gcl_au=1.1.334163085.1752834645; g_state={"i_l":0}; _df_session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTM3Mzc0NDUsImV4cCI6MTc1MzgyMzg0NSwiaXNzIjoiZHJmcm9zdC5vcmciLCJzaWQiOiJ3OGt3Y3dzY3NnMGM0Z2c4OG9zODhzZ3cifQ.WCi1K7gPbnR4h6vrsGjo4k8pNWm0lUd0UV3Omfx9Chc; ph_phc_wu5uBJqblldYE2xTOYYttsQaxd9dDHex41m4VV5QET2_posthog=%7B%22distinct_id%22%3A%2201982cf2-4ca7-7b02-a71b-d9f8fe5c39c5%22%2C%22%24sesid%22%3A%5B1753738650418%2C%22019852ec-ce70-7178-a4a6-1eb8009f22b6%22%2C1753737907824%5D%7D',
              Referer: 'https://www.drfrost.org/worksheets.php?wdid=19431',
            },
            body: null,
            method: 'GET',
          }
        );

        await wait(100);

        if (res.status !== 200) {
          console.log(res);
          process.exit(0);
          return;
        }

        const questions = await res.json();

        questionData.push(questions);
      }
    }
  }

  await writeFile(
    './ukmt.json',
    JSON.stringify(questionData, null, 2),
    'utf-8'
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await main();
