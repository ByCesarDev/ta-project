import { cuevanaProvider } from '../api/src/scrapers/providers/cuevana.provider.js';
import { soloLatinoProvider } from '../api/src/scrapers/providers/soloLatino.provider.js';

async function testOtherProviders() {
  console.log('Testing Cuevana for Solo Leveling...');
  try {
    const cuevanaServers = await cuevanaProvider.getEpisodeServers('solo-leveling', 1, 'sub');
    console.log('Cuevana Servers found:', cuevanaServers.length, cuevanaServers);
  } catch (err: any) {
    console.log('Cuevana err:', err.message);
  }

  console.log('\nTesting SoloLatino for Solo Leveling...');
  try {
    const soloLatinoServers = await soloLatinoProvider.getEpisodeServers('solo-leveling', 1, 'dub');
    console.log('SoloLatino Servers found:', soloLatinoServers.length, soloLatinoServers);
  } catch (err: any) {
    console.log('SoloLatino err:', err.message);
  }
}

testOtherProviders();
