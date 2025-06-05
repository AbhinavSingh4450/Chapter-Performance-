const express = require('express');
const chapterRouter = express.Router();
const Chapter = require('../models/chapterSchema');
const adminOnly = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const redisClient = require('../config/redisClient'); 
const rateLimiter = require('../middlewares/rateLimiter');

// POST /api/v1/chapters - Add a new chapter
// chapterRouter.post( '/api/v1/chapters', async (req, res) => {
//   try {
//     const chapter = new Chapter(req.body);
//     const savedChapter = await chapter.save();
//     res.status(201).json({ success: true, data: savedChapter });
//     res.send("Chapter added successfully");
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

chapterRouter.get('/api/v1/chapters', rateLimiter, async (req, res) => {
  try {
    const {
      class: className,
      unit,
      status,
      isWeakChapter,
      subject,
      page,
      limit,
    } = req.query;

    // Check if any query param is used
    const hasQuery = Object.keys(req.query).length > 0;

    // Build query key for Redis (handle empty query case too)
    const queryKey = hasQuery
      ? `chapters:${JSON.stringify(req.query)}`
      : `chapters:all`;

    // 1. Check if data is in cache
    const cachedData = await redisClient.get(queryKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        ...JSON.parse(cachedData),
      });
    }

    // 2. Build MongoDB filter
    const filter = {};
    if (className) filter.class = className;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (isWeakChapter !== undefined) {
      filter.isWeakChapter = isWeakChapter === 'true';
    }

    // If no query, return all chapters (no pagination)
    if (!hasQuery) {
      const chapters = await Chapter.find({});
      const responseData = { chapters, totalChapters: chapters.length };
      await redisClient.set(queryKey, JSON.stringify(responseData), 'EX', 3600); // Cache 1hr
      return res.status(200).json({ success: true, source: 'db', ...responseData });
    }

    // 3. Pagination logic (only when query used)
    const pageNumber = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    const totalChapters = await Chapter.countDocuments(filter);
    const chapters = await Chapter.find(filter).skip(skip).limit(pageLimit);

    const responseData = {
      totalChapters,
      page: pageNumber,
      limit: pageLimit,
      chapters,
    };

    // 4. Cache the result
    await redisClient.set(queryKey, JSON.stringify(responseData), 'EX', 3600); // Cache 1hr

    res.status(200).json({ success: true, source: 'db', ...responseData });
  } catch (error) {
    console.error('Error in GET /chapters:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


chapterRouter.get('/api/v1/chapters/:id',rateLimiter, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }
    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


const invalidateChaptersCache = async () => {
  try {
    const keys = await redisClient.keys('chapters:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log('Redis cache invalidated for /chapters');
    }
  } catch (err) {
    console.error('Error invalidating Redis cache:', err);
  }
};

// Route to bulk upload chapters
chapterRouter.post('/api/v1/chapters', adminOnly, upload.single('file'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const chapters = JSON.parse(buffer.toString());

    if (!Array.isArray(chapters)) {
      return res.status(400).json({ message: 'JSON should be an array of chapters' });
    }

    const failedChapters = [];
    const insertedChapters = [];

    for (const ch of chapters) {
      try {
        const chapter = new Chapter(ch);
        await chapter.save();
        insertedChapters.push(chapter);
      } catch (err) {
        failedChapters.push({ chapter: ch, error: err.message });
      }
    }

    // ✅ Invalidate Redis cache
    await invalidateChaptersCache();

    res.status(201).json({
      message: 'Upload complete',
      insertedCount: insertedChapters.length,
      failedCount: failedChapters.length,
      failedChapters,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing file', error: err.message });
  }
});

module.exports = chapterRouter;
