import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT m.* FROM messages m JOIN projects p ON m.project_id = p.id
       WHERE m.project_id = $1 AND p.user_id = $2 ORDER BY m.created_at ASC`,
      [id, userId]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[messages GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json({ error: 'role and content required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO messages (project_id, role, content)
       SELECT $1, $2, $3 FROM projects WHERE id = $1 AND user_id = $4
       RETURNING *`,
      [id, role, content, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [id]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[messages POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
