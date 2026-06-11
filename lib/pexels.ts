const PEXELS_BASE = 'https://api.pexels.com/v1';
const PEXELS_VIDEO_BASE = 'https://api.pexels.com/videos';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: { name: string; url: string };
  video_files: Array<{
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }>;
}

interface PexelsSearchResult {
  photos: PexelsPhoto[];
  total_results: number;
  next_page: string | null;
}

interface PexelsVideoSearchResult {
  videos: PexelsVideo[];
  total_results: number;
  next_page: string | null;
}

export interface PexelsAsset {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
  alt: string;
  photographer: string;
  width: number;
  height: number;
  attribution: string;
}

function getApiKey(): string {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set');
  return key;
}

export async function searchImages(query: string, count: number = 5): Promise<PexelsAsset[]> {
  try {
    const res = await fetch(
      `${PEXELS_BASE}/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 20)}`,
      { headers: { Authorization: getApiKey() } }
    );
    if (!res.ok) {
      console.error(`[pexels] Image search failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const data: PexelsSearchResult = await res.json();
    return data.photos.map(p => ({
      type: 'image' as const,
      url: p.src.large,
      thumbnail: p.src.medium,
      alt: p.alt || query,
      photographer: p.photographer,
      width: p.width,
      height: p.height,
      attribution: `Photo by ${p.photographer} on Pexels (${p.url})`,
    }));
  } catch (e) {
    console.error('[pexels] Image search error:', e);
    return [];
  }
}

export async function searchVideos(query: string, count: number = 3): Promise<PexelsAsset[]> {
  try {
    const res = await fetch(
      `${PEXELS_VIDEO_BASE}/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 10)}`,
      { headers: { Authorization: getApiKey() } }
    );
    if (!res.ok) {
      console.error(`[pexels] Video search failed: ${res.status} ${res.statusText}`);
      return [];
    }
    const data: PexelsVideoSearchResult = await res.json();
    return data.videos.map(v => ({
      type: 'video' as const,
      url: v.video_files[0]?.link || '',
      thumbnail: v.image,
      alt: query,
      photographer: v.user.name,
      width: v.width,
      height: v.height,
      attribution: `Video by ${v.user.name} on Pexels (${v.url})`,
    }));
  } catch (e) {
    console.error('[pexels] Video search error:', e);
    return [];
  }
}

export function formatAssetsForPrompt(assets: PexelsAsset[], label: string): string {
  if (assets.length === 0) return '';
  let out = `\n${label}:\n`;
  out += `<pexels_assets>\n`;
  for (const a of assets) {
    if (a.type === 'image') {
      out += `  <image url="${a.url}" alt="${a.alt}" width="${a.width}" height="${a.height}" />\n`;
    } else {
      out += `  <video url="${a.url}" poster="${a.thumbnail}" width="${a.width}" height="${a.height}" />\n`;
    }
  }
  out += `</pexels_assets>\n`;
  out += `Use the URLs above directly in <img> or <video> tags. Include the photographer attribution nearby: "${assets[0].attribution}".`;
  return out;
}

const IMAGE_KEYWORDS = [
  'hero', 'banner', 'background', 'photo', 'image', 'picture', 'gallery',
  'team', 'avatar', 'profile', 'cover', 'thumbnail', 'illustration',
  'landscape', 'city', 'nature', 'food', 'travel', 'technology',
  'business', 'people', 'office', 'workspace', 'product', 'mockup',
  'dashboard', 'screenshot', 'icon', 'logo',
];

export function extractImageQueries(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const found = IMAGE_KEYWORDS.filter(kw => lower.includes(kw));
  const queries = new Set<string>();

  if (found.includes('hero') || found.includes('banner') || found.includes('background')) {
    queries.add('technology abstract');
  }
  if (found.includes('team') || found.includes('people') || found.includes('avatar') || found.includes('profile')) {
    queries.add('professional portrait');
  }
  if (found.includes('nature') || found.includes('landscape')) {
    queries.add('nature landscape');
  }
  if (found.includes('food')) {
    queries.add('food dining');
  }
  if (found.includes('travel')) {
    queries.add('travel destination');
  }
  if (found.includes('business') || found.includes('office') || found.includes('workspace')) {
    queries.add('modern office workspace');
  }
  if (found.includes('product') || found.includes('mockup')) {
    queries.add('product mockup');
  }
  if (found.includes('city')) {
    queries.add('city skyline');
  }
  if (found.includes('technology') || found.includes('tech')) {
    queries.add('technology modern');
  }
  if (found.includes('gallery') || found.includes('photo') || found.includes('image') || found.includes('picture')) {
    queries.add('stock photo');
  }

  return Array.from(queries);
}
