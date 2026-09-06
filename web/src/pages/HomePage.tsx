import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { HeroCarousel } from '../components/home/HeroCarousel.js';
import { RecentEpisodes } from '../components/home/RecentEpisodes.js';
import { TrendingGrid } from '../components/home/TrendingGrid.js';
import { useFeaturedAnimes, useRecentEpisodes } from '../hooks/useAnime.js';

export const HomePage: React.FC = () => {
  const { data: featuredAnimes, isLoading: loadingFeatured } = useFeaturedAnimes();
  const { data: recentEpisodes, isLoading: loadingRecent } = useRecentEpisodes();

  return (
    <PageContainer>
      {/* Hero Featured Carousel */}
      <HeroCarousel animes={featuredAnimes || []} isLoading={loadingFeatured} />

      {/* Latest Episodes Feed */}
      <RecentEpisodes episodes={recentEpisodes || []} isLoading={loadingRecent} />

      {/* Top & Trending Animes Grid */}
      <TrendingGrid animes={featuredAnimes || []} isLoading={loadingFeatured} />
    </PageContainer>
  );
};
