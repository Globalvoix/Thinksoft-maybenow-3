export interface WebSearchResult {
  title: string;
  url: string;
  description: string;
  content: string;
}

export interface SearchOptions {
  livecrawl?: 'fallback' | 'preferred';
  type?: 'auto' | 'fast' | 'deep';
}

export function selectSearchProvider(): 'firecrawl' | 'exa' {
  const provider = process.env.WEB_SEARCH_PROVIDER?.toLowerCase().trim();
  if (provider === 'exa') return 'exa';
  return 'firecrawl';
}

export async function searchFirecrawl(
  query: string,
  numResults: number = 8,
  options?: SearchOptions
): Promise<WebSearchResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn('[web-search] FIRECRAWL_API_KEY not set');
    return [];
  }

  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      limit: Math.min(numResults, 20),
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
    }),
  });

  if (!response.ok) {
    console.error(`[web-search] Firecrawl search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return (data.data || []).map((r: any) => ({
    title: r.title || r.url || '',
    url: r.url || '',
    description: r.description || '',
    content: r.markdown || '',
  }));
}

export async function searchExa(
  query: string,
  numResults: number = 8,
  type?: 'auto' | 'fast' | 'deep'
): Promise<WebSearchResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    console.warn('[web-search] EXA_API_KEY not set');
    return [];
  }

  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: Math.min(numResults, 20),
      type: type === 'deep' ? 'keyword' : type === 'fast' ? 'neural' : 'auto',
      contents: {
        text: true,
      },
    }),
  });

  if (!response.ok) {
    console.error(`[web-search] Exa search failed: ${response.status}`);
    const errorText = await response.text().catch(() => '');
    console.error(`[web-search] Exa error body: ${errorText}`);
    return [];
  }

  const data = await response.json();
  return (data.results || []).map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    description: (r.text || '').slice(0, 300),
    content: r.text || '',
  }));
}

export async function performWebSearch(
  query: string,
  numResults: number = 8,
  options?: SearchOptions
): Promise<WebSearchResult[]> {
  const provider = selectSearchProvider();
  if (provider === 'exa') {
    return searchExa(query, numResults, options?.type);
  }
  return searchFirecrawl(query, numResults, options);
}

const temporalPattern = /\b(latest|recent|new|news|today|current|now|updated|coming|upcoming|next|this\s+(week|month|year)|202[4-9]|2030)\b/i;
const questionPattern = /\b(how\s+(to|do|does|can|would|should|is|are)|what\s+(is|are|was|does|do)|why\s+(is|are|does|do|did)|when\s+(is|are|was|does|do|did)|where\s+(is|are|can|do)|who\s+(is|are|was))\b/i;
const intentPattern = /\b(find|look\s+up|search\s+for|show\s+me|tell\s+me\s+about|give\s+me|i\s+need\s+to\s+know|what'?s\s+the|what\s+are\s+the)\b/i;
const practicalPattern = /\b(pricing|price|cost|plan|subscription|api\s+key|tutorial|guide|documentation|docs|example|comparison|vs\.|alternative|review|rating|version|changelog|release\s+notes|deprecated|migration|setup|install|configuration)\b/i;
const greetingPattern = /\b^(hi|hello|hey|thanks|thank\s+you|good\s+(morning|afternoon|evening))\b/i;
const codeGeneratePattern = /\b(create|build|generate|make|write)\s+(a\s+)?(component|page|app|website|landing|dashboard|ui|form|modal|button|card|section|layout|hook|function|api|route)\b/i;

export function shouldSearchWeb(prompt: string): boolean {
  if (!prompt || prompt.length < 5) return false;
  if (greetingPattern.test(prompt.trim())) return false;
  const isCodeRequest = codeGeneratePattern.test(prompt);
  if (isCodeRequest && !temporalPattern.test(prompt) && !practicalPattern.test(prompt) && prompt.split(/\s+/).length < 10) {
    return false;
  }
  if (temporalPattern.test(prompt)) return true;
  if (questionPattern.test(prompt)) return true;
  if (intentPattern.test(prompt)) return true;
  if (practicalPattern.test(prompt)) return true;
  if (prompt.split(/\s+/).length > 10) return true;
  return false;
}

export function formatWebResultsForAI(results: WebSearchResult[], query: string): string {
  if (!results || results.length === 0) {
    return '';
  }

  let output = `## Web Search Results\n`;
  output += `The AI assistant performed a web search for: "${query}"\n\n`;

  results.forEach((result, index) => {
    output += `### ${index + 1}. ${result.title}\n`;
    output += `**URL:** ${result.url}\n\n`;
    if (result.description) {
      output += `${result.description}\n\n`;
    }
    if (result.content) {
      const truncated = result.content.length > 2000
        ? result.content.slice(0, 2000) + '...\n'
        : result.content + '\n';
      output += '```markdown\n' + truncated + '```\n\n';
    }
  });

  output += `---\nUse these search results to provide accurate, up-to-date answers. Cite source URLs when referencing specific information.\n`;
  return output;
}
