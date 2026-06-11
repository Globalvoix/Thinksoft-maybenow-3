import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, numResults = 8, type = 'auto' } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'EXA_API_KEY not configured' }, { status: 500 });
    }

    const exaType = type === 'deep' ? 'keyword' : type === 'fast' ? 'neural' : 'auto';

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: Math.min(numResults, 20),
        type: exaType,
        contents: {
          text: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[search-exa] API error ${response.status}: ${errorText}`);
      throw new Error(`Exa search failed: ${response.status}`);
    }

    const data = await response.json();

    const results = (data.results || []).map((r: any) => ({
      url: r.url || '',
      title: r.title || '',
      description: (r.text || '').slice(0, 300),
      content: r.text || '',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[search-exa] Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
