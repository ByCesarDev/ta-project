export type HomeSectionType =
  | 'hero'
  | 'continue_watching'
  | 'personalized'
  | 'recent_episodes'
  | 'popular'
  | 'genres';

export interface HomeSectionConfig {
  id: string;
  type: HomeSectionType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  position: number;
  config?: Record<string, unknown>;
}

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: 'sec-hero',
    type: 'hero',
    title: 'Destacados',
    enabled: true,
    position: 1,
  },
  {
    id: 'sec-continue',
    type: 'continue_watching',
    title: 'Seguir viendo',
    subtitle: 'Continúa justo donde lo dejaste en este perfil',
    enabled: true,
    position: 2,
  },
  {
    id: 'sec-personalized',
    type: 'personalized',
    title: 'Inspirados por ti',
    subtitle: 'Recomendaciones basadas en tus preferencias',
    enabled: true,
    position: 3,
  },
  {
    id: 'sec-recent',
    type: 'recent_episodes',
    title: 'Últimos Episodios',
    subtitle: 'Capítulos recién agregados listos para ver',
    enabled: true,
    position: 4,
  },
  {
    id: 'sec-popular',
    type: 'popular',
    title: 'Tendencias y Más Populares',
    subtitle: 'Los títulos más reproducidos de la comunidad',
    enabled: true,
    position: 5,
  },
  {
    id: 'sec-genres',
    type: 'genres',
    title: 'Explora por Género',
    subtitle: 'Encuentra tu próxima serie favorita por categoría',
    enabled: true,
    position: 6,
  },
];
