async function inspectAppChunk() {
  const url = 'https://static.dramasfree.com/_static/prod/1.3.12/_next/static/chunks/pages/_app-3b00a5498101ab88.js';
  try {
    const res = await fetch(url);
    console.log('App chunk status:', res.status);
    const code = await res.text();
    console.log('Code length:', code.length);

    // Look for api base url, api routes, axios configurations
    const apiMatches = code.match(/https?:\/\/[a-zA-Z0-9_\-\.]+\/api\/[a-zA-Z0-9_\-\/]+/g);
    console.log('API URL matches:', apiMatches);

    const routes = code.match(/["'](\/[a-zA-Z0-9_\-\/]*api[a-zA-Z0-9_\-\/]*)["']/g);
    console.log('API path matches:', routes);

    const searchCalls = code.match(/[a-zA-Z0-9_\$]+\.(get|post)\(["'][^"']+["']/g);
    console.log('Axios / fetch calls:', searchCalls?.slice(0, 30));
  } catch (err) {
    console.log('Err:', err.message);
  }
}

inspectAppChunk();
