import { NextRequest, NextResponse } from 'next/server';
import { posix as pathPosix } from 'path';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { parseMorphEdits, applyMorphEditToFile } from '@/lib/morph-fast-apply';
// Sandbox import not needed - using global sandbox from sandbox-manager
import type { SandboxState } from '@/types/sandbox';
import type { ConversationState } from '@/types/conversation';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var conversationState: ConversationState | null;
  var activeSandboxProvider: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
  allowConfigChanges: boolean;
}

const BUILT_IN_MODULES = new Set([
  'assert',
  'buffer',
  'child_process',
  'crypto',
  'events',
  'fs',
  'http',
  'https',
  'os',
  'path',
  'process',
  'querystring',
  'stream',
  'url',
  'util',
  'zlib'
]);

const getPackageNameFromImport = (importPath: string) => {
  if (
    !importPath ||
    importPath.startsWith('.') ||
    importPath.startsWith('/') ||
    importPath.startsWith('@/') ||
    importPath.startsWith('node:') ||
    importPath.startsWith('vite/') ||
    importPath.includes('?')
  ) {
    return null;
  }

  const packageName = importPath.startsWith('@')
    ? importPath.split('/').slice(0, 2).join('/')
    : importPath.split('/')[0];

  if (!packageName || BUILT_IN_MODULES.has(packageName)) {
    return null;
  }

  return packageName;
};

const extractPackagesFromCode = (content: string) => {
  const packages = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const packageName = getPackageNameFromImport(match[1]);
      if (packageName) {
        packages.add(packageName);
      }
    }
  }

  return [...packages];
};

const extractPackagesFromFiles = (files: Array<{ path: string; content: string }>) => {
  const packages = new Set<string>();

  for (const file of files) {
    if (!file?.path || typeof file.content !== 'string') continue;
    if (!file.path.match(/\.(jsx?|tsx?)$/)) continue;

    for (const packageName of extractPackagesFromCode(file.content)) {
      packages.add(packageName);
    }
  }

  return [...packages];
};

const KNOWN_UI_IMPORTS: Record<string, string> = {
  Badge: 'src/components/ui/badge',
  Button: 'src/components/ui/button',
  buttonVariants: 'src/components/ui/button',
  Card: 'src/components/ui/card',
  CardHeader: 'src/components/ui/card',
  CardTitle: 'src/components/ui/card',
  CardDescription: 'src/components/ui/card',
  CardContent: 'src/components/ui/card',
  Input: 'src/components/ui/input',
  Textarea: 'src/components/ui/textarea',
  Avatar: 'src/components/ui/avatar',
  AvatarImage: 'src/components/ui/avatar',
  AvatarFallback: 'src/components/ui/avatar',
  Tabs: 'src/components/ui/tabs',
  TabsList: 'src/components/ui/tabs',
  TabsTrigger: 'src/components/ui/tabs',
  TabsContent: 'src/components/ui/tabs',
  Skeleton: 'src/components/ui/skeleton'
};

const JSX_GLOBALS = new Set([
  'Fragment',
  'React',
  'Suspense',
  'StrictMode'
]);

const LUCIDE_ICON_NAMES = new Set([
  'Menu', 'X', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
  'Search', 'Heart', 'Star', 'User', 'Home', 'Mail', 'Phone', 'MapPin',
  'Globe', 'ExternalLink', 'Share2', 'Send', 'Image', 'Bell', 'Settings',
  'Sun', 'Moon', 'Trash2', 'Edit', 'Plus', 'Minus', 'Check', 'Copy',
  'Download', 'Upload', 'File', 'Folder', 'Clock', 'Calendar', 'Camera',
  'Video', 'Music', 'Book', 'Info', 'AlertCircle', 'HelpCircle', 'DollarSign',
  'Percent', 'TrendingUp', 'TrendingDown', 'Filter', 'Eye', 'EyeOff', 'Lock',
  'Unlock', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ShoppingCart',
  'LogOut', 'RefreshCw', 'Maximize2', 'Minimize2', 'Loader2', 'Sparkles',
  'Zap', 'Shield', 'Rocket', 'Code2', 'Layers', 'Play', 'Pause', 'CircleCheck'
]);

const ROOT_ALLOWED_FILES = new Set([
  'index.html',
  'package.json',
  'tsconfig.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'README.md',
  'components.json',
  '.gitignore',
  '.prettierrc',
  '.prettierignore'
]);

function normalizeSandboxPath(filePath: string) {
  let normalizedPath = filePath.trim();
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }

  const fileName = normalizedPath.split('/').pop() || '';
  if (!normalizedPath.startsWith('src/') &&
      !normalizedPath.startsWith('public/') &&
      !normalizedPath.startsWith('supabase/') &&
      !normalizedPath.startsWith('migrations/') &&
      !ROOT_ALLOWED_FILES.has(fileName)) {
    normalizedPath = 'src/' + normalizedPath;
  }

  return normalizedPath;
}

function getRelativeImportPath(fromFile: string, targetFileWithoutExt: string) {
  const fromDir = pathPosix.dirname(fromFile);
  let relative = pathPosix.relative(fromDir, targetFileWithoutExt);
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
}

function collectDefinedIdentifiers(content: string) {
  const defined = new Set<string>(JSX_GLOBALS);

  const importRegex = /import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"][^'"]+['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    const clause = importMatch[1].trim();
    const defaultMatch = clause.match(/^([A-Za-z_$][\w$]*)/);
    if (defaultMatch) defined.add(defaultMatch[1]);

    const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespaceMatch) defined.add(namespaceMatch[1]);

    const namedMatch = clause.match(/\{([\s\S]*?)\}/);
    if (namedMatch) {
      namedMatch[1].split(',').forEach(part => {
        const cleaned = part.trim();
        if (!cleaned) return;
        const aliasMatch = cleaned.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
        const name = aliasMatch?.[1] || cleaned.replace(/^type\s+/, '').split(/\s+/)[0];
        if (name) defined.add(name);
      });
    }
  }

  const declarationPatterns = [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /\bfunction\s+([A-Za-z_$][\w$]*)/g,
    /\bclass\s+([A-Za-z_$][\w$]*)/g,
    /\b(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/g
  ];

  for (const pattern of declarationPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      defined.add(match[1]);
    }
  }

  return defined;
}

function collectJsxIdentifiers(content: string) {
  const used = new Set<string>();
  const jsxTagRegex = /<\/?\s*([A-Z][A-Za-z0-9_$]*)(?:\.|\s|>|\/)/g;
  let match;
  while ((match = jsxTagRegex.exec(content)) !== null) {
    used.add(match[1]);
  }
  return used;
}

function findMissingJsxIdentifiers(content: string) {
  const defined = collectDefinedIdentifiers(content);
  return [...collectJsxIdentifiers(content)].filter(name => !defined.has(name));
}

function addKnownMissingImports(filePath: string, content: string) {
  const missing = findMissingJsxIdentifiers(content);
  const missingKnownUi = missing.filter(name => KNOWN_UI_IMPORTS[name]);
  const missingLucide = missing.filter(name => LUCIDE_ICON_NAMES.has(name));

  if (missingKnownUi.length === 0 && missingLucide.length === 0) {
    return { content, addedImports: [] as string[], remainingMissing: findMissingJsxIdentifiers(content) };
  }

  const bySource = new Map<string, string[]>();
  for (const name of missingKnownUi) {
    const source = KNOWN_UI_IMPORTS[name];
    bySource.set(source, [...(bySource.get(source) || []), name]);
  }

  const importLines = [...bySource.entries()].map(([source, names]) => {
    const relativeSource = getRelativeImportPath(filePath, source);
    const uniqueNames = [...new Set(names)].sort();
    return `import { ${uniqueNames.join(', ')} } from '${relativeSource}'`;
  });

  if (missingLucide.length > 0) {
    importLines.push(`import { ${[...new Set(missingLucide)].sort().join(', ')} } from 'lucide-react'`);
  }

  const lines = content.split('\n');
  let insertAt = 0;
  while (insertAt < lines.length && /^['"]use\s+\w+['"];?$/.test(lines[insertAt].trim())) {
    insertAt++;
  }
  while (insertAt < lines.length && lines[insertAt].trim() === '') {
    insertAt++;
  }
  while (insertAt < lines.length && /^import\s/.test(lines[insertAt])) {
    insertAt++;
  }

  const nextContent = [
    ...lines.slice(0, insertAt),
    ...importLines,
    ...lines.slice(insertAt)
  ].join('\n');

  return {
    content: nextContent,
    addedImports: importLines,
    remainingMissing: findMissingJsxIdentifiers(nextContent)
  };
}

async function applyRepairFiles(options: {
  providerInstance: any;
  repairResponse: string;
  allowConfigChanges: boolean;
  results: { filesUpdated: string[]; errors: string[] };
  sendProgress: (data: any) => Promise<void>;
}) {
  const { providerInstance, repairResponse, allowConfigChanges, results, sendProgress } = options;
  const parsedRepair = parseAIResponse(repairResponse);
  const configFiles = new Set(['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js']);
  const canWriteConfig = allowConfigChanges || parsedRepair.allowConfigChanges;
  let applied = 0;

  const repairPackages = [...new Set([
    ...parsedRepair.packages,
    ...extractPackagesFromFiles(parsedRepair.files)
  ])].filter(pkg => pkg && pkg !== 'react' && pkg !== 'react-dom');

  if (repairPackages.length > 0) {
    await sendProgress({ type: 'package-progress', message: `Installing repair packages: ${repairPackages.join(', ')}` });
    try {
      await providerInstance.installPackages(repairPackages);
    } catch (error) {
      results.errors.push(`Repair package install failed: ${(error as Error).message}`);
    }
  }

  for (const file of parsedRepair.files) {
    const normalizedPath = normalizeSandboxPath(file.path);
    const fileName = normalizedPath.split('/').pop() || '';

    if (configFiles.has(fileName) && !canWriteConfig) {
      const message = `Skipped repair config file ${file.path}; missing <allow_config_changes>true</allow_config_changes>`;
      results.errors.push(message);
      await sendProgress({ type: 'warning', message });
      continue;
    }

    let fileContent = file.content;
    if (normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.jsx')) {
      fileContent = addKnownMissingImports(normalizedPath, fileContent).content;
    }

    if (normalizedPath.endsWith('.css')) {
      fileContent = fileContent
        .replace(/shadow-3xl/g, 'shadow-2xl')
        .replace(/shadow-4xl/g, 'shadow-2xl')
        .replace(/shadow-5xl/g, 'shadow-2xl');
    }

    const dirPath = normalizedPath.includes('/') ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) : '';
    if (dirPath) {
      await providerInstance.runCommand(`mkdir -p ${dirPath}`);
    }

    await providerInstance.writeFile(normalizedPath, fileContent);
    if (global.sandboxState?.fileCache) {
      global.sandboxState.fileCache.files[normalizedPath] = {
        content: fileContent,
        lastModified: Date.now()
      };
    }

    if (!results.filesUpdated.includes(normalizedPath)) {
      results.filesUpdated.push(normalizedPath);
    }

    applied++;
    await sendProgress({ type: 'file-complete', fileName: normalizedPath, action: 'repair-updated' });
  }

  return applied;
}

async function attemptBuildRepair(options: {
  providerInstance: any;
  buildOutput: string;
  candidatePaths: string[];
  allowConfigChanges: boolean;
  results: { filesUpdated: string[]; errors: string[] };
  sendProgress: (data: any) => Promise<void>;
}) {
  const { providerInstance, buildOutput, candidatePaths, allowConfigChanges, results, sendProgress } = options;

  if (!process.env.GEMINI_API_KEY) {
    await sendProgress({ type: 'warning', message: 'Build repair skipped because GEMINI_API_KEY is missing' });
    return 0;
  }

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const uniquePaths = [...new Set(candidatePaths.map(normalizeSandboxPath))]
    .filter(path => path.match(/\.(tsx?|jsx?|css|json|html|md)$/))
    .slice(0, 18);

  const fileContexts: string[] = [];
  for (const path of uniquePaths) {
    try {
      const content = await providerInstance.readFile(path);
      fileContexts.push(`<file path="${path}">\n${content.slice(0, 14000)}\n</file>`);
    } catch {}
  }

  const repairPrompt = `The generated Vite React app failed validation. Return only complete <file path="...">...</file> blocks for the minimal files needed to fix the build.

Build output:
${buildOutput.slice(0, 12000)}

Candidate files:
${fileContexts.join('\n\n')}

Rules:
- Fix missing imports, missing files, invalid JSX, TypeScript errors, bad package imports, and invalid Tailwind classes.
- Every uppercase JSX tag must be imported or declared.
- If a required local component file is missing, create it.
- Do not rewrite unrelated files.
- If you must change config/root files, include <allow_config_changes>true</allow_config_changes>.
- Output no markdown fences.`;

  const repairResult = await generateText({
    model: google('gemini-2.0-flash'),
    messages: [
      { role: 'system', content: 'You are a senior build repair agent. Produce minimal complete file blocks that fix the failed build.' },
      { role: 'user', content: repairPrompt }
    ],
    temperature: 0.1,
    maxOutputTokens: 16000,
  });

  return await applyRepairFiles({
    providerInstance,
    repairResponse: repairResult.text,
    allowConfigChanges,
    results,
    sendProgress
  });
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: '',
    template: '',
    allowConfigChanges: /<allow_config_changes>\s*true\s*<\/allow_config_changes>/i.test(response)
  };

  // Parse file sections - handle duplicates and prefer complete versions
  const fileMap = new Map<string, { content: string; isComplete: boolean }>();

  // First pass: Find all file declarations
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    const hasClosingTag = response.substring(match.index, match.index + match[0].length).includes('</file>');

    // Check if this file already exists in our map
    const existing = fileMap.get(filePath);

    // Decide whether to keep this version
    let shouldReplace = false;
    if (!existing) {
      shouldReplace = true; // First occurrence
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true; // Replace incomplete with complete
      console.log(`[apply-ai-code-stream] Replacing incomplete ${filePath} with complete version`);
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Replace with longer complete version
      console.log(`[apply-ai-code-stream] Replacing ${filePath} with longer complete version`);
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Both incomplete, keep longer one
    }

    if (shouldReplace) {
      // Additional validation: reject obviously broken content
      if (content.includes('...') && !content.includes('...props') && !content.includes('...rest')) {
        console.warn(`[apply-ai-code-stream] Warning: ${filePath} contains ellipsis, may be truncated`);
        // Still use it if it's the only version we have
        if (!existing) {
          fileMap.set(filePath, { content, isComplete: hasClosingTag });
        }
      } else {
        fileMap.set(filePath, { content, isComplete: hasClosingTag });
      }
    }
  }

  // Convert map to array for sections.files
  for (const [path, { content, isComplete }] of fileMap.entries()) {
    if (!isComplete) {
      console.log(`[apply-ai-code-stream] Warning: File ${path} appears to be truncated (no closing tag)`);
    }

    sections.files.push({
      path,
      content
    });

    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(`[apply-ai-code-stream] 📦 Package detected from imports: ${pkg}`);
      }
    }
  }

  // Also parse markdown code blocks with file paths
  const markdownFileRegex = /```(?:file )?path="([^"]+)"\n([\s\S]*?)```/g;
  while ((match = markdownFileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    sections.files.push({
      path: filePath,
      content: content
    });

    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(`[apply-ai-code-stream] 📦 Package detected from imports: ${pkg}`);
      }
    }
  }

  // Parse plain text format like "Generated Files: Header.jsx, index.css"
  const generatedFilesMatch = response.match(/Generated Files?:\s*([^\n]+)/i);
  if (generatedFilesMatch) {
    // Split by comma first, then trim whitespace, to preserve filenames with dots
    const filesList = generatedFilesMatch[1]
      .split(',')
      .map(f => f.trim())
      .filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css') || f.endsWith('.json') || f.endsWith('.html'));
    console.log(`[apply-ai-code-stream] Detected generated files from plain text: ${filesList.join(', ')}`);

    // Try to extract the actual file content if it follows
    for (const fileName of filesList) {
      // Look for the file content after the file name
      const fileContentRegex = new RegExp(`${fileName}[\\s\\S]*?(?:import[\\s\\S]+?)(?=Generated Files:|Applying code|$)`, 'i');
      const fileContentMatch = response.match(fileContentRegex);
      if (fileContentMatch) {
        // Extract just the code part (starting from import statements)
        const codeMatch = fileContentMatch[0].match(/^(import[\s\S]+)$/m);
        if (codeMatch) {
          const filePath = fileName.includes('/') ? fileName : `src/components/${fileName}`;
          sections.files.push({
            path: filePath,
            content: codeMatch[1].trim()
          });
          console.log(`[apply-ai-code-stream] Extracted content for ${filePath}`);

          // Extract packages from this file
          const filePackages = extractPackagesFromCode(codeMatch[1]);
          for (const pkg of filePackages) {
            if (!sections.packages.includes(pkg)) {
              sections.packages.push(pkg);
              console.log(`[apply-ai-code-stream] Package detected from imports: ${pkg}`);
            }
          }
        }
      }
    }
  }

  // Also try to parse if the response contains raw JSX/JS code blocks
  const codeBlockRegex = /```(?:jsx?|tsx?|javascript|typescript)?\n([\s\S]*?)```/g;
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const content = match[1].trim();
    // Try to detect the file name from comments or context
    const fileNameMatch = content.match(/\/\/\s*(?:File:|Component:)\s*([^\n]+)/);
    if (fileNameMatch) {
      const fileName = fileNameMatch[1].trim();
      const filePath = fileName.includes('/') ? fileName : `src/components/${fileName}`;

      // Don't add duplicate files
      if (!sections.files.some(f => f.path === filePath)) {
        sections.files.push({
          path: filePath,
          content: content
        });

        // Extract packages
        const filePackages = extractPackagesFromCode(content);
        for (const pkg of filePackages) {
          if (!sections.packages.includes(pkg)) {
            sections.packages.push(pkg);
          }
        }
      }
    }
  }

  // Parse commands
  const cmdRegex = /<command>(.*?)<\/command>/g;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  // Parse packages - support both <package> and <packages> tags
  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }

  // Also parse <packages> tag with multiple packages
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    // Split by newlines or commas
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  // Parse structure
  const structureMatch = /<structure>([\s\S]*?)<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  // Parse explanation
  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  // Parse template
  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

export async function POST(request: NextRequest) {
  try {
    const { response, isEdit = false, packages = [], sandboxId } = await request.json();

    if (!response) {
      return NextResponse.json({
        error: 'response is required'
      }, { status: 400 });
    }

    // Debug log the response
    console.log('[apply-ai-code-stream] Received response to parse:');
    console.log('[apply-ai-code-stream] Response length:', response.length);
    console.log('[apply-ai-code-stream] Response preview:', response.substring(0, 500));
    console.log('[apply-ai-code-stream] isEdit:', isEdit);
    console.log('[apply-ai-code-stream] packages:', packages);

    // Parse the AI response
    const parsed = parseAIResponse(response);
    const morphEnabled = Boolean(isEdit && process.env.MORPH_API_KEY);
    const morphEdits = morphEnabled ? parseMorphEdits(response) : [];
    console.log('[apply-ai-code-stream] Morph Fast Apply mode:', morphEnabled);
    if (morphEnabled) {
      console.log('[apply-ai-code-stream] Morph edits found:', morphEdits.length);
    }
    
    // Log what was parsed
    console.log('[apply-ai-code-stream] Parsed result:');
    console.log('[apply-ai-code-stream] Files found:', parsed.files.length);
    if (parsed.files.length > 0) {
      parsed.files.forEach(f => {
        console.log(`[apply-ai-code-stream] - ${f.path} (${f.content.length} chars)`);
      });
    }
    console.log('[apply-ai-code-stream] Packages found:', parsed.packages);

    // Initialize existingFiles if not already
    if (!global.existingFiles) {
      global.existingFiles = new Set<string>();
    }

    // Try to get provider from sandbox manager first
    let provider = sandboxId ? sandboxManager.getProvider(sandboxId) : sandboxManager.getActiveProvider();

    // Fall back to global state if not found in manager
    if (!provider) {
      provider = global.activeSandboxProvider;
    }

    // Fall back to raw Vercel Sandbox from create-ai-sandbox route if available
    if (!provider && (global as any).activeSandbox?.writeFile) {
      console.log('[apply-ai-code-stream] Using global.activeSandbox as provider');
      provider = (global as any).activeSandbox;
      global.activeSandboxProvider = provider;
    }

    // If we have a sandboxId but no provider, try to get or create one
    if (!provider && sandboxId) {
      console.log(`[apply-ai-code-stream] No provider found for sandbox ${sandboxId}, attempting to get or create...`);

      try {
        provider = await sandboxManager.getOrCreateProvider(sandboxId);

        // If we got a new provider (not reconnected), we need to create a new sandbox
        if (!provider.getSandboxInfo()) {
          console.log(`[apply-ai-code-stream] Creating new sandbox since reconnection failed for ${sandboxId}`);
          await provider.createSandbox();
          await provider.setupViteApp();
          sandboxManager.registerSandbox(sandboxId, provider);
        }

        // Update legacy global state
        global.activeSandboxProvider = provider;
        console.log(`[apply-ai-code-stream] Successfully got provider for sandbox ${sandboxId}`);
      } catch (providerError) {
        console.error(`[apply-ai-code-stream] Failed to get or create provider for sandbox ${sandboxId}:`, providerError);
        return NextResponse.json({
          success: false,
          error: `Failed to create sandbox provider for ${sandboxId}. The sandbox may have expired.`,
          results: {
            filesCreated: [],
            packagesInstalled: [],
            commandsExecuted: [],
            errors: [`Sandbox provider creation failed: ${(providerError as Error).message}`]
          },
          explanation: parsed.explanation,
          structure: parsed.structure,
          parsedFiles: parsed.files,
          message: `Parsed ${parsed.files.length} files but couldn't apply them - sandbox reconnection failed.`
        }, { status: 500 });
      }
    }

    // If we still don't have a provider, create a new one
    if (!provider) {
      console.log(`[apply-ai-code-stream] No active provider found, creating new sandbox...`);
      try {
        const { SandboxFactory } = await import('@/lib/sandbox/factory');
        provider = SandboxFactory.create();
        const sandboxInfo = await provider.createSandbox();
        await provider.setupViteApp();

        // Register with sandbox manager
        sandboxManager.registerSandbox(sandboxInfo.sandboxId, provider);

        // Store in legacy global state
        global.activeSandboxProvider = provider;
        global.sandboxData = {
          sandboxId: sandboxInfo.sandboxId,
          url: sandboxInfo.url
        };

        console.log(`[apply-ai-code-stream] Created new sandbox successfully`);
      } catch (createError) {
        console.error(`[apply-ai-code-stream] Failed to create new sandbox:`, createError);
        return NextResponse.json({
          success: false,
          error: `Failed to create new sandbox: ${createError instanceof Error ? createError.message : 'Unknown error'}`,
          results: {
            filesCreated: [],
            packagesInstalled: [],
            commandsExecuted: [],
            errors: [`Sandbox creation failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`]
          },
          explanation: parsed.explanation,
          structure: parsed.structure,
          parsedFiles: parsed.files,
          message: `Parsed ${parsed.files.length} files but couldn't apply them - sandbox creation failed.`
        }, { status: 500 });
      }
    }

    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send progress updates
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start processing in background (pass provider and request to the async function)
    (async (providerInstance, req) => {
      const results = {
        filesCreated: [] as string[],
        filesUpdated: [] as string[],
        packagesInstalled: [] as string[],
        packagesAlreadyInstalled: [] as string[],
        packagesFailed: [] as string[],
        commandsExecuted: [] as string[],
        errors: [] as string[]
      };

      try {
        await sendProgress({
          type: 'start',
          message: 'Starting code application...',
          totalSteps: 3
        });
        if (morphEnabled) {
          await sendProgress({ type: 'info', message: 'Morph Fast Apply enabled' });
          await sendProgress({ type: 'info', message: `Parsed ${morphEdits.length} Morph edits` });
          if (morphEdits.length === 0) {
            console.warn('[apply-ai-code-stream] Morph enabled but no <edit> blocks found; falling back to full-file flow');
            await sendProgress({ type: 'warning', message: 'Morph enabled but no <edit> blocks found; falling back to full-file flow' });
          }
        }
        
        // Step 1: Install packages
        const packagesArray = Array.isArray(packages) ? packages : [];
        const parsedPackages = Array.isArray(parsed.packages) ? parsed.packages : [];
        const importPackages = extractPackagesFromFiles(parsed.files);

        // Combine and deduplicate packages
        const allPackages = [
          ...packagesArray.filter(pkg => pkg && typeof pkg === 'string'),
          ...parsedPackages,
          ...importPackages
        ];

        // Use Set to remove duplicates, then filter out pre-installed packages
        const uniquePackages = [...new Set([...new Set(allPackages)]
          .map(pkg => (typeof pkg === 'string' ? pkg.trim() : ''))
          .filter(pkg => pkg !== '')
          .map(pkg => getPackageNameFromImport(pkg) || pkg)
          .filter(pkg => pkg !== 'react' && pkg !== 'react-dom'))]; // Filter pre-installed

        if (importPackages.length > 0) {
          console.log('[apply-ai-code-stream] Packages detected from generated imports:', importPackages);
        }

        // Log if we found duplicates
        if (allPackages.length !== uniquePackages.length) {
          console.log(`[apply-ai-code-stream] Removed ${allPackages.length - uniquePackages.length} duplicate packages`);
          console.log(`[apply-ai-code-stream] Original packages:`, allPackages);
          console.log(`[apply-ai-code-stream] Deduplicated packages:`, uniquePackages);
        }

        if (uniquePackages.length > 0) {
          await sendProgress({
            type: 'step',
            step: 1,
            message: `Installing ${uniquePackages.length} packages...`,
            packages: uniquePackages
          });

          // Use streaming package installation
          try {
            // Construct the API URL properly for both dev and production
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const host = req.headers.get('host') || 'localhost:3000';
            const apiUrl = `${protocol}://${host}/api/install-packages`;

            const installResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                packages: uniquePackages,
                sandboxId: sandboxId || providerInstance.getSandboxInfo()?.sandboxId
              })
            });

            if (installResponse.ok && installResponse.body) {
              const reader = installResponse.body.getReader();
              const decoder = new TextDecoder();

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                if (!chunk) continue;
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));

                      // Forward package installation progress
                      await sendProgress({
                        type: 'package-progress',
                        ...data
                      });

                      // Track results
                      if (data.type === 'success' && data.installedPackages) {
                        results.packagesInstalled = data.installedPackages;
                      }
                    } catch (parseError) {
                      console.debug('Error parsing terminal output:', parseError);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('[apply-ai-code-stream] Error installing packages:', error);
            await sendProgress({
              type: 'warning',
              message: `Package installation skipped (${(error as Error).message}). Continuing with file creation...`
            });
            results.errors.push(`Package installation failed: ${(error as Error).message}`);
          }
        } else {
          await sendProgress({
            type: 'step',
            step: 1,
            message: 'No additional packages to install, skipping...'
          });
        }

        // Step 2: Create/update files
        const filesArray = Array.isArray(parsed.files) ? parsed.files : [];
        await sendProgress({
          type: 'step',
          step: 2,
          message: `Creating ${filesArray.length} files...`
        });

        // Filter out config files that shouldn't be created
        const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
        let filteredFiles = filesArray.filter(file => {
          if (!file || typeof file !== 'object') return false;
          const fileName = (file.path || '').split('/').pop() || '';
          if (configFiles.includes(fileName) && !parsed.allowConfigChanges) {
            const message = `Skipped config file ${file.path}; missing <allow_config_changes>true</allow_config_changes>`;
            console.warn(`[apply-ai-code-stream] ${message}`);
            results.errors.push(message);
            return false;
          }
          return true;
        });

        if (parsed.allowConfigChanges) {
          await sendProgress({
            type: 'warning',
            message: 'Applying planned config/root file changes'
          });
        }

        // If Morph is enabled and we have edits, apply them before file writes
        const morphUpdatedPaths = new Set<string>();
        if (morphEnabled && morphEdits.length > 0) {
          const morphSandbox = (global as any).activeSandbox || providerInstance;
          if (!morphSandbox) {
            console.warn('[apply-ai-code-stream] No sandbox available to apply Morph edits');
            await sendProgress({ type: 'warning', message: 'No sandbox available to apply Morph edits' });
          } else {
            await sendProgress({ type: 'info', message: `Applying ${morphEdits.length} fast edits via Morph...` });
            for (const [idx, edit] of morphEdits.entries()) {
              try {
                await sendProgress({ type: 'file-progress', current: idx + 1, total: morphEdits.length, fileName: edit.targetFile, action: 'morph-applying' });
                const result = await applyMorphEditToFile({
                  sandbox: morphSandbox,
                  targetPath: edit.targetFile,
                  instructions: edit.instructions,
                  updateSnippet: edit.update
                });
                if (result.success && result.normalizedPath) {
                  console.log('[apply-ai-code-stream] Morph updated', result.normalizedPath);
                  morphUpdatedPaths.add(result.normalizedPath);
                  if (results.filesUpdated) results.filesUpdated.push(result.normalizedPath);
                  await sendProgress({ type: 'file-complete', fileName: result.normalizedPath, action: 'morph-updated' });
                } else {
                  const msg = result.error || 'Unknown Morph error';
                  console.error('[apply-ai-code-stream] Morph apply failed for', edit.targetFile, msg);
                  if (results.errors) results.errors.push(`Morph apply failed for ${edit.targetFile}: ${msg}`);
                  await sendProgress({ type: 'file-error', fileName: edit.targetFile, error: msg });
                }
              } catch (err) {
                const msg = (err as Error).message;
                console.error('[apply-ai-code-stream] Morph apply exception for', edit.targetFile, msg);
                if (results.errors) results.errors.push(`Morph apply exception for ${edit.targetFile}: ${msg}`);
                await sendProgress({ type: 'file-error', fileName: edit.targetFile, error: msg });
              }
            }
          }
        }

        // Avoid overwriting Morph-updated files in the file write loop
        if (morphUpdatedPaths.size > 0) {
          filteredFiles = filteredFiles.filter(file => {
            if (!file?.path) return true;
            const normalizedPath = normalizeSandboxPath(file.path);
            return !morphUpdatedPaths.has(normalizedPath);
          });
        }
        
        for (const [index, file] of filteredFiles.entries()) {
          try {
            // Send progress for each file
            await sendProgress({
              type: 'file-progress',
              current: index + 1,
              total: filteredFiles.length,
              fileName: file.path,
              action: 'creating'
            });

            // Normalize the file path
            const normalizedPath = normalizeSandboxPath(file.path);

            const isUpdate = global.existingFiles.has(normalizedPath);

            // Remove any CSS imports from JSX/JS files (we're using Tailwind)
            let fileContent = file.content;
            if (file.path.endsWith('.jsx') || file.path.endsWith('.js') || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
              fileContent = fileContent.replace(/import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g, '');
            }

            if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
              const repaired = addKnownMissingImports(normalizedPath, fileContent);
              fileContent = repaired.content;

              if (repaired.addedImports.length > 0) {
                console.log(`[apply-ai-code-stream] Added missing UI imports to ${normalizedPath}:`, repaired.addedImports);
                await sendProgress({
                  type: 'info',
                  message: `Added missing UI imports in ${normalizedPath}`
                });
              }

              if (repaired.remainingMissing.length > 0) {
                const message = `Potential missing JSX imports in ${normalizedPath}: ${repaired.remainingMissing.join(', ')}`;
                console.warn(`[apply-ai-code-stream] ${message}`);
                if (results.errors) {
                  results.errors.push(message);
                }
                await sendProgress({
                  type: 'validation-error',
                  success: false,
                  fileName: normalizedPath,
                  error: message
                });
              }
            }

            // Fix common Tailwind CSS errors in CSS files
            if (file.path.endsWith('.css')) {
              // Replace shadow-3xl with shadow-2xl (shadow-3xl doesn't exist)
              fileContent = fileContent.replace(/shadow-3xl/g, 'shadow-2xl');
              // Replace any other non-existent shadow utilities
              fileContent = fileContent.replace(/shadow-4xl/g, 'shadow-2xl');
              fileContent = fileContent.replace(/shadow-5xl/g, 'shadow-2xl');
            }

            // Create directory if needed
            const dirPath = normalizedPath.includes('/') ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) : '';
            if (dirPath) {
              await providerInstance.runCommand(`mkdir -p ${dirPath}`);
            }

            // Write the file using provider
            await providerInstance.writeFile(normalizedPath, fileContent);

            // Update file cache
            if (global.sandboxState?.fileCache) {
              global.sandboxState.fileCache.files[normalizedPath] = {
                content: fileContent,
                lastModified: Date.now()
              };
            }

            if (isUpdate) {
              if (results.filesUpdated) results.filesUpdated.push(normalizedPath);
            } else {
              if (results.filesCreated) results.filesCreated.push(normalizedPath);
              if (global.existingFiles) global.existingFiles.add(normalizedPath);
            }

            await sendProgress({
              type: 'file-complete',
              fileName: normalizedPath,
              action: isUpdate ? 'updated' : 'created'
            });
          } catch (error) {
            if (results.errors) {
              results.errors.push(`Failed to create ${file.path}: ${(error as Error).message}`);
            }
            await sendProgress({
              type: 'file-error',
              fileName: file.path,
              error: (error as Error).message
            });
          }
        }

        // Step 3: Execute commands
        const commandsArray = Array.isArray(parsed.commands) ? parsed.commands : [];
        if (commandsArray.length > 0) {
          await sendProgress({
            type: 'step',
            step: 3,
            message: `Executing ${commandsArray.length} commands...`
          });

          for (const [index, cmd] of commandsArray.entries()) {
            try {
              await sendProgress({
                type: 'command-progress',
                current: index + 1,
                total: parsed.commands.length,
                command: cmd,
                action: 'executing'
              });

              // Use provider runCommand
              const result = await providerInstance.runCommand(cmd);

              // Get command output from provider result
              const stdout = result.stdout;
              const stderr = result.stderr;

              if (stdout) {
                await sendProgress({
                  type: 'command-output',
                  command: cmd,
                  output: stdout,
                  stream: 'stdout'
                });
              }

              if (stderr) {
                await sendProgress({
                  type: 'command-output',
                  command: cmd,
                  output: stderr,
                  stream: 'stderr'
                });
              }

              if (results.commandsExecuted) {
                results.commandsExecuted.push(cmd);
              }

              await sendProgress({
                type: 'command-complete',
                command: cmd,
                exitCode: result.exitCode,
                success: result.exitCode === 0
              });
            } catch (error) {
              if (results.errors) {
                results.errors.push(`Failed to execute ${cmd}: ${(error as Error).message}`);
              }
              await sendProgress({
                type: 'command-error',
                command: cmd,
                error: (error as Error).message
              });
            }
          }
        }

        // Step 4: Validate and repair the generated app. This turns build failures
        // into targeted fix passes instead of leaving the preview broken.
        try {
          await sendProgress({
            type: 'step',
            step: 4,
            message: 'Validating generated app...'
          });

          let validation = await providerInstance.runCommand('npm run build');
          let validationOutput = [validation.stdout, validation.stderr].filter(Boolean).join('\n');
          const buildRepairAttempts = 3;

          for (let attempt = 1; validation.exitCode !== 0 && attempt <= buildRepairAttempts; attempt++) {
            await sendProgress({
              type: 'validation-error',
              success: false,
              exitCode: validation.exitCode,
              attempt,
              output: validationOutput.slice(0, 12000),
              message: `Build failed. Attempting automatic repair ${attempt}/${buildRepairAttempts}...`
            });

            const candidatePaths = [
              ...results.filesCreated,
              ...results.filesUpdated,
              ...filteredFiles.map(file => normalizeSandboxPath(file.path))
            ];

            const repairedFiles = await attemptBuildRepair({
              providerInstance,
              buildOutput: validationOutput,
              candidatePaths,
              allowConfigChanges: parsed.allowConfigChanges,
              results,
              sendProgress
            });

            if (repairedFiles === 0) {
              break;
            }

            validation = await providerInstance.runCommand('npm run build');
            validationOutput = [validation.stdout, validation.stderr].filter(Boolean).join('\n');
          }

          await sendProgress({
            type: validation.exitCode === 0 ? 'validation-complete' : 'validation-error',
            success: validation.exitCode === 0,
            exitCode: validation.exitCode,
            output: validationOutput.slice(0, 12000)
          });

          if (validation.exitCode !== 0 && results.errors) {
            results.errors.push(`Build validation failed after repair attempts:\n${validationOutput.slice(0, 4000)}`);
          }
        } catch (validationError) {
          const message = validationError instanceof Error ? validationError.message : 'Validation failed';
          console.error('[apply-ai-code-stream] Build validation failed:', validationError);
          if (results.errors) {
            results.errors.push(`Build validation failed: ${message}`);
          }
          await sendProgress({
            type: 'validation-error',
            success: false,
            error: message
          });
        }

        // Send final results
        await sendProgress({
          type: 'complete',
          results,
          explanation: parsed.explanation,
          structure: parsed.structure,
          message: `Successfully applied ${results.filesCreated.length} files`
        });

        // Track applied files in conversation state
        if (global.conversationState && results.filesCreated.length > 0) {
          const messages = global.conversationState.context.messages;
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
              lastMessage.metadata = {
                ...lastMessage.metadata,
                editedFiles: results.filesCreated
              };
            }
          }

          // Track applied code in project evolution
          if (global.conversationState.context.projectEvolution) {
            global.conversationState.context.projectEvolution.majorChanges.push({
              timestamp: Date.now(),
              description: parsed.explanation || 'Code applied',
              filesAffected: results.filesCreated || []
            });
          }

          global.conversationState.lastUpdated = Date.now();
        }

      } catch (error) {
        await sendProgress({
          type: 'error',
          error: (error as Error).message
        });
      } finally {
        await writer.close();
      }
    })(provider, request);

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Apply AI code stream error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse AI code' },
      { status: 500 }
    );
  }
}
