import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { designCatalog, type DesignEntry } from './design-catalog';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for fetched design content
const designCache = new Map<string, string>();

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md';

/**
 * Pick the best matching brand from the catalog using a lightweight AI call.
 */
async function pickBrand(userPrompt: string): Promise<DesignEntry | null> {
  const catalogLines = designCatalog
    .map((d, i) => `${i + 1}. ${d.name} (${d.category}) — ${d.description}`)
    .join('\n');

  const selectionPrompt = `You are a design system selector. Given a user's request to build an app or landing page, pick the single best matching design system from the catalog below.

Return ONLY the number of your selection. No explanation, no markdown, just the number.

User request: ${userPrompt}

Catalog:
${catalogLines}`;

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: selectionPrompt,
      temperature: 0.3,
    });

    const text = result.text.trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= designCatalog.length) {
      return designCatalog[num - 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a design.md file from GitHub raw content.
 */
async function fetchDesign(brandId: string): Promise<string | null> {
  if (designCache.has(brandId)) {
    return designCache.get(brandId)!;
  }

  try {
    const url = `${GITHUB_RAW_BASE}/${brandId}/DESIGN.md`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const content = await res.text();
    designCache.set(brandId, content);
    return content;
  } catch {
    return null;
  }
}

/**
 * Result from the design selector.
 */
export interface DesignSelection {
  brandId: string;
  brandName: string;
  designContent: string;
}

/**
 * Select a design system for a first-time build based on the user's prompt.
 * Returns null if selection or fetch fails (caller should fall back to custom design).
 */
export async function selectDesign(userPrompt: string): Promise<DesignSelection | null> {
  const brand = await pickBrand(userPrompt);
  if (!brand) return null;

  const content = await fetchDesign(brand.id);
  if (!content) return null;

  return {
    brandId: brand.id,
    brandName: brand.name,
    designContent: content,
  };
}
