import express from 'express';
import axios from 'axios';
import { mockMangaData } from '../../src/mockMangaData.js';

const router = express.Router();

// Get manga by ID
router.get('/manga/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // 1. Try to find in mock dataset
  const mockManga = mockMangaData.find(m => m.mal_id === id);
  if (mockManga) {
    return res.json({ data: mockManga });
  }

  // 2. Fallback to public Jikan API
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/manga/${id}`);
    if (response.data && response.data.data) {
      return res.json({ data: response.data.data });
    }
  } catch (error) {
    console.error(`Error fetching manga ${id} from Jikan API:`, error.message);
  }

  return res.status(404).json({ error: 'Manga not found' });
});

// Get manga catalog/list (with genre filtering support)
router.get('/manga', async (req, res) => {
  const { genres } = req.query;

  if (!genres) {
    return res.json({ data: mockMangaData });
  }

  // Support single genre or comma-separated list of genres (by ID or name)
  const queryGenres = genres.split(',');

  const filteredMock = mockMangaData.filter(m => {
    return m.genres?.some(g => {
      return queryGenres.some(qg => 
        g.mal_id.toString() === qg.trim() || 
        g.name.toLowerCase() === qg.trim().toLowerCase()
      );
    });
  });

  // If mock data yields matches, return them
  if (filteredMock.length > 0) {
    return res.json({ data: filteredMock });
  }

  // Otherwise, proxy the request to public Jikan API
  try {
    const response = await axios.get('https://api.jikan.moe/v4/manga', {
      params: {
        genres: genres,
        limit: 24,
        sfw: true
      }
    });
    if (response.data && response.data.data) {
      return res.json({ data: response.data.data });
    }
  } catch (error) {
    console.error(`Error filtering manga by genre from Jikan API:`, error.message);
  }

  return res.json({ data: [] });
});

export default router;
