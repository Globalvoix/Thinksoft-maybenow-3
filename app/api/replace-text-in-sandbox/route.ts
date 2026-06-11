import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldText, newText, sandboxId } = body as { oldText?: string; newText?: string; sandboxId?: string };

    if (!oldText || oldText.length === 0) {
      return NextResponse.json({ success: false, error: 'oldText is required' }, { status: 400 });
    }
    if (newText === undefined || newText === null) {
      return NextResponse.json({ success: false, error: 'newText is required' }, { status: 400 });
    }

    let provider: any = null;

    if (sandboxId) {
      provider = sandboxManager.getProvider(sandboxId);
    }
    if (!provider) {
      provider = sandboxManager.getActiveProvider();
    }
    if (!provider) {
      provider = global.activeSandboxProvider;
    }
    if (!provider) {
      return NextResponse.json({ success: false, error: 'No active sandbox' }, { status: 404 });
    }

    const filesChanged = await provider.replaceText(oldText, newText);

    return NextResponse.json({
      success: true,
      filesChanged,
      count: filesChanged.length,
    });
  } catch (error) {
    console.error('[replace-text-in-sandbox] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Replace failed' },
      { status: 500 }
    );
  }
}
