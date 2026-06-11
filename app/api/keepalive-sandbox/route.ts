import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // body stays empty
    }

    const sandboxId: string | undefined = body.sandboxId;

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

    const alive = provider.isAlive();
    if (!alive) {
      return NextResponse.json({ success: false, error: 'Sandbox is no longer alive' }, { status: 410 });
    }

    const result = await provider.keepAlive();

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('[keepalive-sandbox] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Keepalive failed' },
      { status: 500 }
    );
  }
}
