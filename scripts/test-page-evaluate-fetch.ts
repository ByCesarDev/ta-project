import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as path from 'path';
import * as os from 'os';

puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), 'totalanime_stealth_profile');

async function testBrowserInternalFetch() {
  console.log('Testing in-browser fetch with native TLS stack and clearance...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true, // headless works with stealth!
    userDataDir: TEMP_PROFILE,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());
    
    // Visit home or detail page
    const testUrl = 'https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1';
    console.log(`Opening ${testUrl}...`);
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const result = await page.evaluate(async () => {
      const el = document.getElementById('__NEXT_DATA__');
      if (el) {
        return { success: true, data: JSON.parse(el.textContent || '{}') };
      }
      return { success: false, title: document.title };
    });

    console.log('Browser Result:', result.success ? 'SUCCESS!' : 'FAILED');
    if (result.success) {
      const p = result.data?.props?.pageProps;
      console.log('Drama Name:', p?.name);
      console.log('DubMode:', p?.dubMode);
      console.log('Media count:', p?.mediaInfoList?.length);
      console.log('Media URLs:', p?.mediaInfoList?.map((m: any) => ({ def: m.currentDefinition, url: m.mediaUrl })));
    } else {
      console.log('Title was:', result.title);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

testBrowserInternalFetch();
