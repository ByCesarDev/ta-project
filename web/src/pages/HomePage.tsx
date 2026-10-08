import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { HeroCarousel } from '../components/home/HeroCarousel.js';
import { RecentEpisodes } from '../components/home/RecentEpisodes.js';
import { TrendingGrid } from '../components/home/TrendingGrid.js';
import { useFeaturedSeries } from '../hooks/useSeries.js';
import { useRecentEpisodes } from '../hooks/useAnime.js';

export const HomePage: React.FC = () => {
  const { data: featuredSeries, isLoading: loadingFeatured } = useFeaturedSeries();
  const { data: recentEpisodes, isLoading: loadingRecent } = useRecentEpisodes();

  return (
    <PageContainer>
      {/* Hero Featured Carousel */}
      <HeroCarousel animes={featuredSeries || []} isLoading={loadingFeatured} />

      {/* Latest Episodes Feed */}
      <RecentEpisodes episodes={recentEpisodes || []} isLoading={loadingRecent} />

      {/* Top & Trending Series Grid */}
      <TrendingGrid animes={featuredSeries || []} isLoading={loadingFeatured} />
    </PageContainer>
  );
};
