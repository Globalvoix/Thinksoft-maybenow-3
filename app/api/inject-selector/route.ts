import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { SELECTOR_SCRIPT } from '@/lib/sandbox/selector-script';

export async function POST(request: NextRequest) {
  try {
    const provider = sandboxManager.getActiveProvider() || (global as any).activeSandboxProvider;
    if (!provider) {
      return NextResponse.json({ success: false, error: 'No active sandbox' }, { status: 404 });
    }

    let html: string;
    try {
      html = await provider.readFile('index.html');
    } catch {
      html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>App</title></head><body><div id="root"></div></body></html>';
    }

    if (html.includes('__think_sel_hl__')) {
      return NextResponse.json({ success: true, message: 'Selector already injected' });
    }

    html = html.replace('</body>', SELECTOR_SCRIPT + '\n</body>');
    if (!html.includes(SELECTOR_SCRIPT)) {
      html += '\n' + SELECTOR_SCRIPT + '\n';
    }

    await provider.writeFile('index.html', html);

    return NextResponse.json({ success: true, message: 'Selector script injected' });
  } catch (error) {
    console.error('[inject-selector] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
