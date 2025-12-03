const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'entries.json');

const ensureFile = async () => {
  await fs.promises.mkdir(path.dirname(DATA_PATH), { recursive: true });
  try {
    await fs.promises.access(DATA_PATH, fs.constants.F_OK);
  } catch (_) {
    await fs.promises.writeFile(DATA_PATH, '[]', 'utf8');
  }
};

const loadEntries = async () => {
  await ensureFile();
  const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
};

const saveEntries = async (entries) => {
  await ensureFile();
  await fs.promises.writeFile(DATA_PATH, JSON.stringify(entries, null, 2));
};

module.exports = {
  loadEntries,
  saveEntries,
};
