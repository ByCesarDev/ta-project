import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testHeadless() {
  console.log('Launching Chrome to test cluster navigation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('Navigating to detail page of The Seven Deadly Sins Latino...');
    await page.goto('https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    console.log('Page Title:', await page.title());
    console.log('Final URL:', page.url());

    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el ? JSON.parse(el.textContent || '{}') : null;
    });

    console.log('NextData loaded:', !!nextData);
    if (nextData) {
      const p = nextData.props?.pageProps;
      console.log('Drama Name:', p?.name);
      console.log('DubMode:', p?.dubMode);
      console.log('Media count:', p?.mediaInfoList?.length);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

testHeadless();
