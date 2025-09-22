import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, basename } from 'path';

async function downloadImage(savePath, urlPath) {
  const res = await fetch(`https://drfrost.org/${urlPath}`);
  if (!res.ok) {
    console.log(path);
    throw new Error(`Fetch failed: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(`../assets/${dirname(savePath)}`, { recursive: true });
  await writeFile(`../assets/${savePath}`, buffer);
}

function extractImagePath(str) {
  const [m] = [...str.matchAll(/src="(.+?)"/g)];

  if (m) {
    const [_, path] = m;
    return path;
  }
}

async function main() {
  const exams = JSON.parse(await readFile('./ukmt.json', 'utf-8'));
  let i = 0;
  for (const e of exams) {
    i += 1;
    for (const q of e.questions) {
      const contentImagePath = extractImagePath(q.content);
      const responseImagePath = extractImagePath(q.response);

      if (contentImagePath && !contentImagePath.startsWith('data:image')) {
        await downloadImage(contentImagePath, contentImagePath);
      }

      if (responseImagePath && !responseImagePath.startsWith('data:image')) {
        await downloadImage(responseImagePath, responseImagePath);
      }

      if (q.img) {
        const parts = q.img.split('public_html');
        const imgPath = parts[parts.length - 1];
        await downloadImage(q.img, imgPath);
      }
    }

    console.log(`Finished exam ${i}/${exams.length}`);
  }
}

await main();
