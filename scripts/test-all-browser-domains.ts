import puppeteer from 'puppeteer-core';
import * as path from 'path';
import * as os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), 'totalanime_chrome_profile');

const domains = [
  'flixlat.com',
  'play.cuevana19.com',
  'peliculaplay.com',
  'ver.123pelicula.com',
  'es.cuevana4br.com',
  'ww20.321moviesfree.com',
  'ww1.123flmsfree.com',
  'www3.dramasfree.com',
];

const testHash = 'sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins';

async function testAllDomains() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    for (const d of domains) {
      try {
        const url = `https://${d}/es/detail/drama/${testHash}/1`;
        console.log(`Checking https://${d}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        const title = await page.title();
        const hasNext = await page.evaluate(() => !!document.getElementById('__NEXT_DATA__'));
        console.log(`  -> Title: "${title}" | NextData: ${hasNext}`);
      } catch (err: any) {
        console.log(`  -> Err:`, err.message);
      }
    }
  } finally {
    await browser.close();
  }
}

testAllDomains();
