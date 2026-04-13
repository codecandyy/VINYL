export type ThemeId = 'vintage' | 'pink-princess' | 'bw-modern';

export type SceneTheme = {
  id: ThemeId;
  label: string;
  swatch: string;
  // Canvas background + fog
  bgColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  // Ambient / hemisphere
  ambientColor: string;
  ambientIntensity: number;
  ambientWarmColor: string;
  ambientWarmIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  // Spot (ceiling deck spotlight)
  spotColor: string;
  spotIntensity: number;
  spotIntensityPlaying: number;
  // Key point (hanging bulb)
  keyPointColor: string;
  keyPointIntensity: number;
  // Warm fill near counter
  fillPointColor: string;
  fillPointIntensity: number;
  fillPointIntensityPlaying: number;
  // Shelf fill lights
  shelfFillColor: string;
  shelfFillIntensity: number;
  // CSS overlay
  overlayGradient: string;
  overlayVignette: string;
  // RoomStructure surfaces
  floor: string;
  backWall: string;
  sideWall: string;
  ceiling: string;
  counterBody: string;
  counterTop: string;
  bulbColor: string;
  bulbEmissive: string;
  // ShelfUnit wood
  shelfBack: string;
  shelfPanel: string;
  shelfSurface: string;
};

export const THEMES: Record<ThemeId, SceneTheme> = {
  'vintage': {
    id: 'vintage',
    label: 'Basic Vintage LP Bar',
    swatch: '#8B5E3C',
    bgColor: '#1a0800',
    fogColor: '#221c18',
    fogNear: 12,
    fogFar: 27,
    ambientColor: '#E8E4DE',
    ambientIntensity: 0.48,
    ambientWarmColor: '#C4A078',
    ambientWarmIntensity: 0.26,
    hemiSky: '#ECD8B8',
    hemiGround: '#4A3428',
    hemiIntensity: 0.38,
    spotColor: '#FFF4E6',
    spotIntensity: 7.2,
    spotIntensityPlaying: 10.5,
    keyPointColor: '#FFD9A0',
    keyPointIntensity: 12.5,
    fillPointColor: '#E87840',
    fillPointIntensity: 4.0,
    fillPointIntensityPlaying: 6.2,
    shelfFillColor: '#FFF0D8',
    shelfFillIntensity: 5.4,
    overlayGradient:
      'linear-gradient(180deg, rgba(255,220,170,0.04) 0%, rgba(120,80,50,0.025) 45%, rgba(40,28,20,0.06) 100%)',
    overlayVignette:
      'radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(45,32,22,0.28) 100%)',
    floor: '#523028',
    backWall: '#322A1C',
    sideWall: '#221A14',
    ceiling: '#120C0A',
    counterBody: '#2C1E12',
    counterTop: '#241E18',
    bulbColor: '#FFE8C8',
    bulbEmissive: '#FFB040',
    shelfBack: '#181008',
    shelfPanel: '#24180E',
    shelfSurface: '#322210',
  },

  'pink-princess': {
    id: 'pink-princess',
    label: 'Pink Princess LP Room',
    swatch: '#C4607A',
    bgColor: '#1a0810',
    fogColor: '#2A1020',
    fogNear: 11,
    fogFar: 26,
    ambientColor: '#F0D8E8',
    ambientIntensity: 0.55,
    ambientWarmColor: '#E8A0C0',
    ambientWarmIntensity: 0.32,
    hemiSky: '#F0C8E0',
    hemiGround: '#3C1828',
    hemiIntensity: 0.42,
    spotColor: '#FFD0E8',
    spotIntensity: 7.8,
    spotIntensityPlaying: 11.5,
    keyPointColor: '#FFB8D8',
    keyPointIntensity: 11.0,
    fillPointColor: '#E8507A',
    fillPointIntensity: 4.5,
    fillPointIntensityPlaying: 6.8,
    shelfFillColor: '#FFD8EC',
    shelfFillIntensity: 5.0,
    overlayGradient:
      'linear-gradient(180deg, rgba(255,200,230,0.05) 0%, rgba(180,80,120,0.03) 45%, rgba(60,10,30,0.07) 100%)',
    overlayVignette:
      'radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(80,20,50,0.30) 100%)',
    floor: '#4A1830',
    backWall: '#3A1828',
    sideWall: '#2E1020',
    ceiling: '#180810',
    counterBody: '#3A1828',
    counterTop: '#2C1820',
    bulbColor: '#FFD0E8',
    bulbEmissive: '#FF80B0',
    shelfBack: '#200C18',
    shelfPanel: '#341220',
    shelfSurface: '#3E1A28',
  },

  'bw-modern': {
    id: 'bw-modern',
    label: 'Black & White Modern',
    swatch: '#888888',
    bgColor: '#0a0a0a',
    fogColor: '#1a1a1a',
    fogNear: 13,
    fogFar: 28,
    ambientColor: '#F0F0F0',
    ambientIntensity: 0.62,
    ambientWarmColor: '#D8D8E0',
    ambientWarmIntensity: 0.22,
    hemiSky: '#E8E8F0',
    hemiGround: '#1A1A1A',
    hemiIntensity: 0.45,
    spotColor: '#F8F8FF',
    spotIntensity: 8.5,
    spotIntensityPlaying: 12.0,
    keyPointColor: '#F0F0FF',
    keyPointIntensity: 14.0,
    fillPointColor: '#C0C0D8',
    fillPointIntensity: 3.5,
    fillPointIntensityPlaying: 5.5,
    shelfFillColor: '#E8E8FF',
    shelfFillIntensity: 4.8,
    overlayGradient:
      'linear-gradient(180deg, rgba(240,240,255,0.03) 0%, rgba(80,80,100,0.02) 45%, rgba(0,0,0,0.05) 100%)',
    overlayVignette:
      'radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(0,0,0,0.32) 100%)',
    floor: '#0E0E0E',
    backWall: '#D8D8D8',
    sideWall: '#C0C0C0',
    ceiling: '#080808',
    counterBody: '#1A1A1A',
    counterTop: '#2A2A2A',
    bulbColor: '#F0F0FF',
    bulbEmissive: '#D0D0FF',
    shelfBack: '#0A0A0A',
    shelfPanel: '#1C1C1C',
    shelfSurface: '#2A2A2A',
  },
};

export const THEME_LIST: SceneTheme[] = [
  THEMES['vintage'],
  THEMES['pink-princess'],
  THEMES['bw-modern'],
];
