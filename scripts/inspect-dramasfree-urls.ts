import axios from 'axios';

const urls = [
  { type: 'Latino', url: 'https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1' },
  { type: 'Original', url: 'https://www3.dramasfree.com/es/detail/drama/X32mWsYoJj8DmFsjmLGbo-The-Seven-Deadly-Sins/1' },
  { type: 'Portugués', url: 'https://www3.dramasfree.com/es/detail/drama/Z4k096znnK95QQeGbw1rh-The-Seven-Deadly-Sins/1' },
  { type: 'Sub Español pegado', url: 'https://www3.dramasfree.com/es/detail/drama/cSowdFbiGKky3ASAa2CnB-The-Seven-Deadly-Sins/1' }
];

async function inspect() {
  for (const item of urls) {
    try {
      const res = await axios.get(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
        timeout: 10000
      });
      const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const p = data.props.pageProps;
        console.log('====================================');
        console.log('=== TYPE:', item.type, '===');
        console.log('name:', p.name);
        console.log('dramaType:', p.dramaType);
        console.log('dubMode:', p.dubMode);
        console.log('dubLang:', p.dubLang);
        console.log('originDubLang:', p.originDubLang);
        console.log('subtitleLang:', p.subtitleLang);
        console.log('subMode:', p.subMode);
        console.log('lang:', p.lang);
        console.log('mediaInfoList definitions:', p.mediaInfoList?.map((m: any) => m.currentDefinition));
        if (p.mediaInfoList?.[0]) {
          console.log('subtitles in mediaInfo[0]:', p.mediaInfoList[0].subtitleList);
          console.log('audioList in mediaInfo[0]:', p.mediaInfoList[0].audioList);
        }
        console.log('dubbingList:');
        console.log(JSON.stringify(p.dubbingList, null, 2));
      }
    } catch (e: any) {
      console.error('Error for', item.type, e.message);
    }
  }
}

inspect();
