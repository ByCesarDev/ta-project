import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as path from 'path';
import * as os from 'os';

puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = path.join(os.tmpdir(), 'totalanime_scraper_profile');

async function main() {
  console.log('Opening Chrome to acquire Cloudflare Clearance...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    userDataDir: PROFILE_DIR,
    args: ['--no-first-run', '--window-size=600,600'],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  console.log('Navigating to cluster mirror...');
  await page.goto('https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1', {
    waitUntil: 'domcontentloaded',
  });

  console.log('Waiting 8 seconds for clearance...');
  await new Promise((r) => setTimeout(r, 8000));

  const hasNext = await page.evaluate(() => !!document.getElementById('__NEXT_DATA__'));
  console.log('Cleared and loaded __NEXT_DATA__:', hasNext);

  await browser.close();
}

main();
