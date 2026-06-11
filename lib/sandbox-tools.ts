import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { SandboxProvider } from '@/lib/sandbox/types';
import type { ComponentTree } from '@/types/file-manifest';

function getProvider(): SandboxProvider | null {
  return sandboxManager.getActiveProvider();
}

function formatError(msg: string): string {
  return `Error: ${msg}`;
}

function formatFileContent(content: string, filePath: string, offset?: number, limit?: number): string {
  const lines = content.split('\n');
  const start = offset ? Math.max(0, offset - 1) : 0;
  const end = limit ? Math.min(lines.length, start + limit) : lines.length;
  const sliced = lines.slice(start, end);

  let output = `<path>${filePath}</path>\n`;
  output += `<type>file</type>\n`;
  if (content.length === 0) {
    output += '<content>(empty file)</content>\n';
    return output;
  }

  output += '<content>\n';
  sliced.forEach((line, i) => {
    const lineNum = start + i + 1;
    const truncated = line.length > 2000 ? line.slice(0, 2000) + '...' : line;
    output += `${lineNum}: ${truncated}\n`;
  });
  output += '</content>\n';

  if (end < lines.length) {
    output += `\n(File truncated: showing lines ${start + 1}-${end} of ${lines.length}. Use offset=${end + 1} to see more.)\n`;
  }

  return output;
}

export async function readSandboxFile(
  filePath: string,
  offset?: number,
  limit?: number
): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const fullPath = filePath.startsWith('/') ? filePath : `/home/user/app/${filePath}`;

  const content = await provider.readFile(fullPath);

  if (content.length > 50000) {
    const preview = content.slice(0, 50000);
    return formatFileContent(preview, filePath, offset, limit) +
      `\n(File is large: ${content.length} bytes. Showing first 50000 bytes.)\n`;
  }

  return formatFileContent(content, filePath, offset, limit);
}

export async function listSandboxDir(path?: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const dir = path || '/home/user/app';
  const files = await provider.listFiles(dir);

  if (files.length === 0) {
    return `<path>${dir}</path>\n<type>directory</type>\n<content>(empty directory)</content>\n`;
  }

  const treeLines: string[] = [];
  const sorted = files.sort();
  const dirs = new Set<string>();

  for (const file of sorted) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      dirs.add(parts.slice(0, i + 1).join('/'));
    }
  }

  const seen = new Set<string>();
  for (const file of sorted) {
    const parts = file.split('/');
    for (let i = 0; i < parts.length; i++) {
      const partial = parts.slice(0, i + 1).join('/');
      if (seen.has(partial)) continue;
      seen.add(partial);
      const indent = '  '.repeat(i);
      if (i < parts.length - 1 || dirs.has(partial)) {
        treeLines.push(`${indent}${parts[i]}/`);
      } else {
        treeLines.push(`${indent}${parts[i]}`);
      }
    }
  }

  return `<path>${dir}</path>\n<type>directory</type>\n<content>\n${treeLines.join('\n')}\n</content>\n`;
}

export async function globSandboxFiles(pattern: string, path?: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const searchPath = path || '/home/user/app';
  const escapedPattern = pattern.replace(/'/g, "'\\''");
  const escapedPath = searchPath.replace(/'/g, "'\\''");

  const result = await provider.runCommand(
    `find ${escapedPath} -name '${escapedPattern}' -type f 2>/dev/null | head -100`
  );

  const lines = result.stdout.trim().split('\n').filter(Boolean);

  if (lines.length === 0) {
    return `No files matching "${pattern}" found in ${searchPath}\n`;
  }

  const relative = lines.map(l => {
    if (l.startsWith(searchPath)) return l.slice(searchPath.length + 1);
    return l;
  });

  let output = `Found ${lines.length} file(s) matching "${pattern}":\n\n`;
  relative.forEach(f => { output += `${f}\n`; });

  return output;
}

export async function grepSandboxFiles(
  pattern: string,
  searchPath?: string,
  include?: string
): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const path = searchPath || '/home/user/app';
  const escapedPattern = pattern.replace(/'/g, "'\\''");
  const escapedPath = path.replace(/'/g, "'\\''");
  const includeFlag = include ? ` --include='${include.replace(/'/g, "'\\''")}'` : '';

  const result = await provider.runCommand(
    `grep -rn '${escapedPattern}' ${escapedPath}${includeFlag} 2>/dev/null | head -200`
  );

  const grepOutput = result.stdout.trim();

  if (!grepOutput) {
    if (result.stderr) {
      return `Search for "${pattern}" produced warnings:\n${result.stderr}\n`;
    }
    return `No matches found for "${pattern}" in ${path}\n`;
  }

  const lines = grepOutput.split('\n').filter(Boolean);
  let output = `Found ${lines.length} match(es) for "${pattern}":\n\n`;
  lines.forEach(l => { output += `${l}\n`; });

  return output;
}

export async function writeSandboxFile(filePath: string, content: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const fullPath = filePath.startsWith('/') ? filePath : `/home/user/app/${filePath}`;

  await provider.writeFile(fullPath, content);

  return `Successfully wrote ${content.length} bytes to ${filePath}\n`;
}

export async function editSandboxFile(
  filePath: string,
  oldString: string,
  newString: string,
  replaceAll?: boolean
): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const fullPath = filePath.startsWith('/') ? filePath : `/home/user/app/${filePath}`;

  const content = await provider.readFile(fullPath);

  if (replaceAll) {
    const occurrences = content.split(oldString).length - 1;
    if (occurrences === 0) {
      return formatError(`"${oldString}" not found in ${filePath}`);
    }
    const newContent = content.split(oldString).join(newString);
    await provider.writeFile(fullPath, newContent);
    return `Replaced ${occurrences} occurrence(s) in ${filePath}\n`;
  }

  const idx = content.indexOf(oldString);
  if (idx === -1) {
    return formatError(`"${oldString}" not found in ${filePath}`);
  }

  const newContent = content.slice(0, idx) + newString + content.slice(idx + oldString.length);
  await provider.writeFile(fullPath, newContent);
  return `Successfully replaced one occurrence in ${filePath}\n`;
}

export async function runSandboxCommand(command: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new Error('No active sandbox');

  const result = await provider.runCommand(command);

  let output = '';
  output += `Exit code: ${result.exitCode}\n\n`;

  if (result.stdout) {
    const truncatedStdout = result.stdout.length > 10000
      ? result.stdout.slice(0, 10000) + '\n... (stdout truncated at 10000 chars)'
      : result.stdout;
    output += `STDOUT:\n${truncatedStdout}\n`;
  }

  if (result.stderr) {
    const truncatedStderr = result.stderr.length > 5000
      ? result.stderr.slice(0, 5000) + '\n... (stderr truncated at 5000 chars)'
      : result.stderr;
    output += `\nSTDERR:\n${truncatedStderr}\n`;
  }

  return output;
}

export async function getComponentGraph(
  filterComponent?: string,
  maxDepth?: number
): Promise<string> {
  const manifest = (globalThis as any).sandboxState?.fileCache?.manifest as { componentTree?: ComponentTree } | undefined;
  if (!manifest?.componentTree) {
    return 'No component graph available. Generate code first to build the dependency map.';
  }

  const tree = manifest.componentTree as ComponentTree;
  const entries = Object.entries(tree);
  const depth = maxDepth || 3;

  if (filterComponent) {
    const filterLower = filterComponent.toLowerCase();
    const match = entries.find(([name]) =>
      name.toLowerCase() === filterLower ||
      name.toLowerCase().includes(filterLower)
    );
    if (!match) {
      return `Component "${filterComponent}" not found in graph.\nAvailable components: ${entries.slice(0, 40).map(([n]) => n).join(', ')}${entries.length > 40 ? ', ...' : ''}`;
    }

    const [name, entry] = match;
    let output = `### ${name}\n`;
    output += `File: ${entry.file}\n`;
    output += `Type: ${entry.type || 'unknown'}\n\n`;

    const deps = entry.imports || [];
    output += `**Imports (${deps.length}):**\n`;
    for (const dep of deps) {
      const depEntry = tree[dep];
      const depLabel = depEntry ? `${dep} (${depEntry.file})` : dep;
      output += `  → ${depLabel}\n`;
    }

    const dependents = entries.filter(([, e]) => e.imports?.includes(name));
    output += `\n**Used by (${dependents.length}):**\n`;
    for (const [depName] of dependents) {
      output += `  ← ${depName}\n`;
    }

    return output;
  }

  let output = `### Full Component Graph (${entries.length} components)\n\n`;
  const counted = new Set<string>();
  const sorted = entries.sort(([, a], [, b]) => (b.imports?.length || 0) - (a.imports?.length || 0));

  for (const [name, entry] of sorted.slice(0, 30)) {
    const deps = entry.imports || [];
    const usedBy = entries.filter(([, e]) => e.imports?.includes(name)).length;
    output += `**${name}** — ${deps.length} imports, ${usedBy} dependents\n`;
    output += `  File: ${entry.file}\n`;
    for (const dep of deps.slice(0, 5)) {
      output += `  → ${dep}\n`;
    }
    if (deps.length > 5) output += `  ... and ${deps.length - 5} more\n`;
    output += '\n';
    counted.add(name);
  }

  if (entries.length > 30) {
    output += `... and ${entries.length - 30} more components. Use getComponentGraph("name") to inspect a specific component.`;
  }

  return output;
}
