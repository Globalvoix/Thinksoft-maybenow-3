import { NextResponse } from 'next/server';
import { buildComponentTree } from '@/lib/file-parser';
import type { FileManifest, FileInfo } from '@/types/file-manifest';
import type { SandboxState } from '@/types/sandbox';

export async function GET() {
  try {
    const manifest: FileManifest | undefined = global.sandboxState?.fileCache?.manifest;
    const fileCache = global.sandboxState?.fileCache?.files || {};

    if (!manifest || Object.keys(fileCache).length === 0) {
      return NextResponse.json({ nodes: [], links: [], features: [] });
    }

    const allNodes: any[] = [];
    const allLinks: any[] = [];
    const nodeIds = new Set<string>();

    for (const [fullPath, fileInfo] of Object.entries(manifest.files)) {
      const typedFile = fileInfo as FileInfo;
      const fileName = fullPath.split('/').pop() || fullPath;
      const ext = fileName.split('.').pop() || '';
      const dirs = fullPath.split('/').filter(Boolean);
      const topDir = dirs.length > 1 ? dirs[dirs.length - 2] : 'root';

      let type = typedFile.type || 'utility';
      let group = topDir;

      if (ext === 'css') continue;

      if (!nodeIds.has(fullPath)) {
        nodeIds.add(fullPath);
        allNodes.push({
          id: fullPath,
          name: fileName,
          type,
          group,
          file: fullPath,
        });
      }
    }

    const tree = manifest.componentTree || buildComponentTree(manifest.files);

    for (const [compName, entry] of Object.entries(tree)) {
      const sourceId = entry.file;
      if (!nodeIds.has(sourceId)) continue;

      for (const targetComp of entry.imports) {
        const targetEntry = tree[targetComp];
        if (!targetEntry) continue;
        const targetId = targetEntry.file;
        if (!nodeIds.has(targetId)) continue;

        allLinks.push({
          source: sourceId,
          target: targetId,
        });
      }
    }

    const designMd = manifest.files['/design.md'];
    const features: Array<{ name: string; components: string[]; description: string }> = [];
    if (designMd) {
      const content = designMd.content || '';
      const sectionRegex = /(?:^|\n)#{2,3}\s+(.+?)(?:\n|$)([\s\S]*?)(?=\n#{2,3}|\n*$)/g;
      let sectionMatch;
      while ((sectionMatch = sectionRegex.exec(content)) !== null) {
        const sectionName = sectionMatch[1].trim();
        const sectionBody = sectionMatch[2];
        const matchedComponents = allNodes.filter(n =>
          sectionBody.toLowerCase().includes(n.name.toLowerCase().replace(/\.\w+$/, '')) ||
          sectionBody.toLowerCase().includes(n.name.toLowerCase())
        ).map(n => n.id);
        if (sectionName && !sectionName.toLowerCase().includes('import')) {
          features.push({
            name: sectionName,
            components: matchedComponents.length > 0 ? matchedComponents : [],
            description: sectionBody.split('\n')[0]?.trim()?.slice(0, 120) || '',
          });
        }
      }
    }

    for (const node of allNodes) {
      const incoming = allLinks.filter(l => l.target === node.id).length;
      const outgoing = allLinks.filter(l => l.source === node.id).length;
      node.incoming = incoming;
      node.outgoing = outgoing;
    }

    return NextResponse.json({
      nodes: allNodes,
      links: allLinks,
      features,
    });
  } catch (error) {
    console.error('[graph-data] Error:', error);
    return NextResponse.json({ nodes: [], links: [], features: [] });
  }
}
