const express = require('express');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { analyzeFoodPhoto } = require('../services/nutrition');
const { loadEntries, saveEntries } = require('../utils/storage');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', async (_req, res, next) => {
  try {
    const entries = await loadEntries();
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

router.post('/analyze', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please include a food photo in the "photo" field.' });
    }

    const { mealName = 'Untitled Meal', consumedAt } = req.body;
    const analysis = await analyzeFoodPhoto(req.file, {
      mealName,
      consumedAt,
    });

    const entry = {
      id: uuid(),
      mealName,
      consumedAt: consumedAt || new Date().toISOString(),
      ...analysis,
      createdAt: new Date().toISOString(),
    };

    const entries = await loadEntries();
    entries.unshift(entry);
    await saveEntries(entries);

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
