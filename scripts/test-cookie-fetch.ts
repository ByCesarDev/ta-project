const cfClearance = 'jtsWJC2ki0jVIDVbO21upzhNgMOPndnd_iwZRyvhjho-1791417587-1.2.1.1-MJuQXDZU1_4g8led4m5E4vdR_rJjc1epVqQLCa1L.3fi4hyL_6aGagw9ATd..5WSdmviGRBndJE_za84pI9B1SAKoOqCsOYxUsBHFxcT03FqhXseX6rahyPFTJ0RAG8wjlMvIgqMuc12STDuX3JFH4onG.WgfO.XIE0f1Pvi4AjlDJUzhF6DFk8arAuPhD7PMpZCfMY4_XmqNxAISr67VjNChV88M.2z3lCU0nGxQkEzB.ayV0mwIEQhtbM8BPtiJrWGcjFAWVjWuZx1SRFHTJHVG_XjLfMFFpIXKZX_LefRiSETRa4OB8N2P05yZO5HYYwAQseB8t5qGtTW26h5JKV3vtqSyhmIBMamgjeDX.A';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function testWithCookie() {
  const url = 'https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1';
  console.log('Testing fetch with cf_clearance cookie...');

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Cookie': `cf_clearance=${cfClearance}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      }
    });

    console.log('Response status:', res.status);
    const html = await res.text();
    console.log('HTML length:', html.length);
    console.log('Contains __NEXT_DATA__:', html.includes('__NEXT_DATA__'));

    if (html.includes('__NEXT_DATA__')) {
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (match) {
        const json = JSON.parse(match[1]);
        const p = json.props?.pageProps;
        console.log('🎉 SUCCESS WITH COOKIE!');
        console.log('Drama Name:', p?.name);
        console.log('DubMode:', p?.dubMode);
        console.log('Media count:', p?.mediaInfoList?.length);
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testWithCookie();
