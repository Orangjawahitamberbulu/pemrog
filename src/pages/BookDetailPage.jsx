import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  Bookmark, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  User, 
  Clock, 
  Sparkles,
  Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [manga, setManga] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecsLoading, setIsRecsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch manga details
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setManga(null);

    const fetchDetails = async () => {
      try {
        const response = await axios.get(`/api/manga/${id}`);
        if (!active) return;
        
        if (response.data && response.data.data) {
          const mangaData = response.data.data;
          setManga(mangaData);
          
          // Check bookmark status
          const bookmarks = localStorage.getItem('hybrid_library_bookmarks');
          const bookmarksList = bookmarks ? JSON.parse(bookmarks) : [];
          setIsBookmarked(bookmarksList.some(b => b.mal_id === mangaData.mal_id));

          // Fetch recommendations based on first genre
          if (mangaData.genres && mangaData.genres.length > 0) {
            const firstGenreId = mangaData.genres[0].mal_id;
            fetchRecommendations(firstGenreId, mangaData.mal_id);
          } else {
            setIsRecsLoading(false);
          }
        } else {
          setError('Failed to load manga details.');
        }
      } catch (err) {
        console.error('Error fetching manga details:', err);
        if (active) {
          setError('Failed to fetch manga. The API might be rate-limited or offline.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
    return () => { active = false; };
  }, [id]);

  // Fetch recommendations from API based on genre
  const fetchRecommendations = async (genreId, currentMangaId) => {
    setIsRecsLoading(true);
    try {
      const response = await axios.get(`/api/manga?genres=${genreId}`);
      if (response.data && response.data.data) {
        // Filter out the current manga and limit to 5 suggestions
        const filteredRecs = response.data.data
          .filter(m => m.mal_id !== currentMangaId)
          .slice(0, 5);
        setRecommendations(filteredRecs);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsRecsLoading(false);
    }
  };

  // Toggle bookmark function
  const handleBookmarkToggle = () => {
    if (!manga) return;

    try {
      const bookmarks = localStorage.getItem('hybrid_library_bookmarks');
      let bookmarksList = bookmarks ? JSON.parse(bookmarks) : [];
      const exists = bookmarksList.some(b => b.mal_id === manga.mal_id);

      if (exists) {
        bookmarksList = bookmarksList.filter(b => b.mal_id !== manga.mal_id);
        setIsBookmarked(false);
        toast('Removed from bookmarks', { icon: '🗑️' });
      } else {
        bookmarksList.push(manga);
        setIsBookmarked(true);
        toast.success('Saved to bookmarks!', { icon: '🔖' });
      }
      localStorage.setItem('hybrid_library_bookmarks', JSON.stringify(bookmarksList));
    } catch (e) {
      console.error('Error updating bookmarks in localStorage:', e);
      toast.error('Failed to update bookmarks.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
          <div className="absolute h-10 w-10 rounded-full border-4 border-brand-orange/30 border-b-transparent animate-spin [animation-direction:reverse]" />
        </div>
        <p className="mt-6 text-sm text-brand-textMuted font-semibold tracking-wide uppercase animate-pulse">
          Fetching Grimoire Details...
        </p>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-brand-border bg-brand-cardBg/40 max-w-xl mx-auto my-12 animate-fade-in shadow-xl">
        <span className="text-5xl mb-6">⚠️</span>
        <h3 className="text-xl font-extrabold text-brand-textMain mb-2">Failed to load Manga</h3>
        <p className="text-sm text-brand-textMuted mb-6 leading-relaxed">
          {error || "We couldn't retrieve the specified manga. It may not exist in our catalog."}
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 rounded-xl bg-brand-border border border-white/5 hover:border-brand-orange px-5 py-2.5 text-sm font-bold text-brand-textMain hover:text-brand-orange transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </button>
      </div>
    );
  }

  const title = manga.title || manga.title_english || 'Unknown Title';
  const alternativeTitle = manga.title_japanese || manga.title_synonyms?.[0] || '';
  const imageUrl = manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop';
  const score = manga.score ? manga.score.toFixed(1) : 'N/A';
  const rank = manga.rank || 'N/A';
  const popularity = manga.popularity || 'N/A';
  const chapters = manga.chapters || 'Unknown';
  const volumes = manga.volumes || 'Unknown';
  const status = manga.status || 'Unknown';
  const publishedStr = manga.published?.string || 'Unknown Period';
  const synopsis = manga.synopsis || 'No description available for this manga.';
  const genres = manga.genres || [];
  const authors = manga.authors || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-10 w-full"
    >
      {/* Banner Graphic Background */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 h-64 sm:h-80 overflow-hidden rounded-b-3xl">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105 filter blur-md opacity-25" 
          style={{ backgroundImage: `url(${imageUrl})` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darkBg via-brand-darkBg/60 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:left-10 z-10 flex items-center gap-3">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-2 rounded-xl bg-brand-darkBg/80 backdrop-blur-md border border-brand-border px-4 py-2 text-xs font-bold text-brand-textMuted hover:text-brand-orange hover:border-brand-orange/40 transition-all duration-200 shadow-md group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Catalog
          </button>
        </div>
      </div>

      {/* Main Details Glass Container */}
      <div className="relative glass-panel rounded-2xl border border-brand-border/80 p-6 sm:p-8 mt-[-100px] z-20 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Cover & Fast Buttons Column */}
          <div className="w-56 mx-auto lg:mx-0 flex-shrink-0 flex flex-col items-center">
            <div className="w-full aspect-[3/4.2] overflow-hidden rounded-2xl border border-brand-orange/20 shadow-neon-hover bg-brand-darkBg relative group">
              <img 
                src={imageUrl} 
                alt={title} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="mt-6 w-full space-y-3">
              {/* Read Online Button */}
              <button
                onClick={() => navigate(`/read/${id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold bg-brand-orange hover:bg-brand-accent text-white shadow-neon hover:shadow-neon-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <BookOpen className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
                Read Online
              </button>

              {/* Bookmark Toggle Button */}
              <button
                onClick={handleBookmarkToggle}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold border transition-all duration-200 ${
                  isBookmarked
                    ? 'bg-brand-orange/10 border-brand-orange text-brand-orange hover:bg-brand-orange/20'
                    : 'bg-brand-darkBg/60 border-brand-border text-brand-textMain hover:border-brand-orange hover:text-brand-orange'
                }`}
              >
                <Bookmark className={`h-4.5 w-4.5 transition-transform ${isBookmarked ? 'fill-brand-orange scale-110' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Add Bookmark'}
              </button>
            </div>
          </div>

          {/* Details Content Column */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Format Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
                <Sparkles className="h-3 w-3" />
                {manga.type || 'Manga'}
              </span>

              {/* Title & Japanese Alt */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-textMain tracking-tight leading-tight mb-1">
                {title}
              </h1>
              {alternativeTitle && (
                <p className="text-sm sm:text-base text-brand-textMuted italic mb-6 tracking-wide">
                  {alternativeTitle}
                </p>
              )}

              {/* Score, Rank, Popularity Grid */}
              <div className="flex flex-wrap gap-3 mb-6">
                {/* Score */}
                <div className="flex items-center gap-1.5 bg-brand-darkBg border border-brand-border px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:border-brand-orange/30 transition-colors">
                  <Star className="h-4 w-4 fill-brand-orange text-brand-orange" />
                  <span className="text-brand-textMain">Score:</span>
                  <span className="font-bold text-brand-orange">{score}</span>
                </div>

                {/* Rank */}
                <div className="flex items-center gap-1.5 bg-brand-darkBg border border-brand-border px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:border-brand-orange/30 transition-colors">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-brand-textMuted">Rank:</span>
                  <span className="font-bold text-brand-textMain">#{rank}</span>
                </div>

                {/* Popularity */}
                <div className="flex items-center gap-1.5 bg-brand-darkBg border border-brand-border px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:border-brand-orange/30 transition-colors">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-brand-textMuted">Popularity:</span>
                  <span className="font-bold text-brand-textMain">#{popularity}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 bg-brand-darkBg border border-brand-border px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:border-brand-orange/30 transition-colors">
                  <span className={`inline-block h-2 w-2 rounded-full ${status === 'Publishing' || status === 'Ongoing' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-gray-400'}`} />
                  <span className="text-brand-textMuted">Status:</span>
                  <span className={`font-bold ${status === 'Publishing' || status === 'Ongoing' ? 'text-emerald-400' : 'text-brand-textMain'}`}>{status}</span>
                </div>
              </div>

              {/* Main Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-6 text-sm border-t border-b border-brand-border/50 py-5">
                <div className="flex items-center gap-2.5 text-brand-textMuted">
                  <User className="h-4.5 w-4.5 text-brand-orange flex-shrink-0" />
                  <span className="truncate">
                    <strong className="text-brand-textMain">Author:</strong> {authors.map(a => a.name).join(', ') || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-brand-textMuted">
                  <Clock className="h-4.5 w-4.5 text-brand-orange flex-shrink-0" />
                  <span>
                    <strong className="text-brand-textMain">Volumes:</strong> {volumes} (Chapters: {chapters})
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-brand-textMuted">
                  <Calendar className="h-4.5 w-4.5 text-brand-orange flex-shrink-0" />
                  <span className="truncate">
                    <strong className="text-brand-textMain">Published:</strong> {publishedStr}
                  </span>
                </div>
              </div>

              {/* Genres chips */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-brand-textMuted uppercase tracking-wider mb-2.5">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <span 
                      key={g.mal_id} 
                      className="rounded-lg bg-brand-darkBg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-textMain tracking-wide shadow-sm hover:border-brand-orange/30 hover:text-brand-orange transition-colors"
                    >
                      {g.name}
                    </span>
                  ))}
                  {genres.length === 0 && (
                    <span className="rounded-lg bg-brand-darkBg border border-brand-border px-3 py-1.5 text-xs text-brand-textMuted">
                      General
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="mt-4">
              <h3 className="text-xs font-bold text-brand-textMuted uppercase tracking-wider mb-2.5">
                Synopsis
              </h3>
              <p className="text-sm leading-relaxed text-brand-textMuted max-h-48 overflow-y-auto pr-2 bg-brand-darkBg/40 p-4 rounded-xl border border-brand-border/40 custom-scrollbar whitespace-pre-line">
                {synopsis}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* You May Also Like Section */}
      <div className="space-y-6 pt-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-textMain flex items-center gap-2 tracking-tight">
          <Sparkles className="h-5.5 w-5.5 text-brand-orange" />
          You May Also Like
        </h2>
        
        {isRecsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-brand-cardBg border border-brand-border/40 animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-brand-textMuted italic bg-brand-cardBg/30 p-4 rounded-xl border border-brand-border/40 text-center">
            No recommendations found for this title's genre.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const recTitle = rec.title || rec.title_english || 'Unknown Title';
              const recImg = rec.images?.jpg?.image_url || rec.images?.jpg?.large_image_url || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=150&auto=format&fit=crop';
              const recScore = rec.score ? rec.score.toFixed(1) : 'N/A';
              const recType = rec.type || 'Manga';

              return (
                <div 
                  key={rec.mal_id}
                  onClick={() => navigate(`/book/${rec.mal_id}`)}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-brand-cardBg hover:bg-brand-darkBg border border-brand-border/50 hover:border-brand-orange/40 hover:shadow-neon cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
                >
                  {/* Rec Mini Cover */}
                  <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-brand-border bg-brand-darkBg">
                    <img src={recImg} alt={recTitle} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>

                  {/* Rec Mini Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-brand-textMain truncate group-hover:text-brand-orange transition-colors">
                      {recTitle}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-brand-textMuted">
                      <span className="flex items-center gap-0.5 font-bold text-brand-orange">
                        <Star className="h-3 w-3 fill-brand-orange text-brand-orange" />
                        {recScore}
                      </span>
                      <span>•</span>
                      <span className="uppercase font-semibold tracking-wider text-[9px]">{recType}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
