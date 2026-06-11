import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT f.* FROM files f JOIN projects p ON f.project_id = p.id
       WHERE f.project_id = $1 AND p.user_id = $2 ORDER BY f.file_path ASC`,
      [id, userId]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[files GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { file_path, content } = body;

    if (!file_path) {
      return NextResponse.json({ error: 'file_path required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO files (project_id, file_path, content)
       SELECT $1, $2, $3 FROM projects WHERE id = $1 AND user_id = $4
       ON CONFLICT (project_id, file_path)
       DO UPDATE SET content = $3, updated_at = NOW()
       RETURNING *`,
      [id, file_path, content || '', userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[files POST]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
