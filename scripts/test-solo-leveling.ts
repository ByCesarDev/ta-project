import { dramasFreeProvider } from '../api/src/scrapers/providers/dramasfree.provider.js';

async function testSoloLeveling() {
  console.log('Testing DramasFree cluster provider for Solo Leveling...');
  
  console.log('Searching for "Solo Leveling"...');
  const searchResults = await dramasFreeProvider.search('Solo Leveling');
  console.log('Search Results:', searchResults);

  console.log('\nGetting servers for Episode 1 (sub)...');
  const subServers = await dramasFreeProvider.getEpisodeServers('solo-leveling', 1, 'sub');
  console.log('Sub Servers found:', subServers.length, subServers);

  console.log('\nGetting servers for Episode 1 (dub)...');
  const dubServers = await dramasFreeProvider.getEpisodeServers('solo-leveling', 1, 'dub');
  console.log('Dub Servers found:', dubServers.length, dubServers);
}

testSoloLeveling();
