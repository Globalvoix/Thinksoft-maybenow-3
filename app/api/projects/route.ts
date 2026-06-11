import { NextRequest, NextResponse } from 'next/server';
import { query, initSchema } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[projects GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, creator_name, avatar, prompt } = body;

    const result = await query(
      `INSERT INTO projects (user_id, title, creator_name, avatar, prompt)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title || 'Untitled', creator_name || '', avatar || '', prompt || '']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[projects POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
