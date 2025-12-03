require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { generateMockAnalysis } = require('../src/services/nutrition');
const { loadEntries, saveEntries } = require('../src/utils/storage');

async function run() {
  const mock = generateMockAnalysis();
  if (!mock || typeof mock.calories !== 'number') {
    throw new Error('Mock analysis failed to return numeric calories');
  }

  const entries = await loadEntries();
  if (!Array.isArray(entries)) {
    throw new Error('Entries store is not an array');
  }

  await saveEntries(entries);
  console.log('Smoke test passed: storage + mock analysis are operational.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
