import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.js';
import { HeroCarousel } from '../components/home/HeroCarousel.js';
import { ContinueWatchingRow } from '../components/home/ContinueWatchingRow.js';
import { PersonalizedRecommendationsRow } from '../components/home/PersonalizedRecommendationsRow.js';
import { RecentEpisodes } from '../components/home/RecentEpisodes.js';
import { TrendingGrid } from '../components/home/TrendingGrid.js';
import { GenreDiscoverySection } from '../components/home/GenreDiscoverySection.js';
import { useFeaturedSeries } from '../hooks/useSeries.js';
import { useRecentEpisodes } from '../hooks/useAnime.js';
import { DEFAULT_HOME_SECTIONS, HomeSectionConfig } from '../types/homeSections.js';

export const HomePage: React.FC = () => {
  // Global queries for hero and recent episodes
  const { data: featuredSeries = [], isLoading: loadingFeatured } = useFeaturedSeries();
  const { data: recentEpisodes = [], isLoading: loadingRecent } = useRecentEpisodes();

  // Dynamic sections configuration (ordered by position)
  const sections: HomeSectionConfig[] = React.useMemo(() => {
    return [...DEFAULT_HOME_SECTIONS].sort((a, b) => a.position - b.position);
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        {sections.map((section) => {
          if (!section.enabled) return null;

          switch (section.type) {
            case 'hero':
              return (
                <HeroCarousel
                  key={section.id}
                  animes={featuredSeries}
                  isLoading={loadingFeatured}
                />
              );

            case 'continue_watching':
              return (
                <ContinueWatchingRow
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                />
              );

            case 'personalized':
              return (
                <PersonalizedRecommendationsRow
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                />
              );

            case 'recent_episodes':
              return (
                <RecentEpisodes
                  key={section.id}
                  episodes={recentEpisodes}
                  isLoading={loadingRecent}
                />
              );

            case 'popular':
              return (
                <TrendingGrid
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                />
              );

            case 'genres':
              return (
                <GenreDiscoverySection
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </PageContainer>
  );
};
