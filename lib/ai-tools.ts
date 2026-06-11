import { z } from 'zod';
import {
  readSandboxFile,
  listSandboxDir,
  globSandboxFiles,
  grepSandboxFiles,
  runSandboxCommand,
} from './sandbox-tools';
import { performWebSearch, formatWebResultsForAI } from './web-search';

type ToolDef = {
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: any) => Promise<string>;
};

function makeTool(def: ToolDef) {
  return def as any;
}

export const readFileTool = makeTool({
  description: 'Read a file from the sandbox project to understand its code, structure, or configuration. Use this to inspect existing components, check imports, or understand the current codebase before making changes.',
  parameters: z.object({
    filePath: z.string().describe('Path to the file (e.g. "src/App.tsx", "src/components/Hero.tsx", "package.json")'),
    offset: z.number().optional().describe('Starting line number (1-indexed) to read from'),
    limit: z.number().optional().describe('Number of lines to read'),
  }),
  execute: async (args: any) => {
    return await readSandboxFile(args.filePath, args.offset, args.limit);
  },
});

export const listDirTool = makeTool({
  description: 'List files and directories in a project folder. Use this to understand the project structure, find where files are located, or discover what components exist.',
  parameters: z.object({
    path: z.string().optional().describe('Directory path to list (e.g. "src", "src/components", "public"). Defaults to project root.'),
  }),
  execute: async (args: any) => {
    return await listSandboxDir(args.path);
  },
});

export const globFilesTool = makeTool({
  description: 'Find files matching a glob pattern. Use this to locate files by name, extension, or partial path match (e.g. "*.tsx", "*Button*", "**/*.css").',
  parameters: z.object({
    pattern: z.string().describe('Glob pattern to match (e.g. "*.tsx", "*.css", "*Button*", "**/*.config.*")'),
    path: z.string().optional().describe('Search directory. Defaults to project root.'),
  }),
  execute: async (args: any) => {
    return await globSandboxFiles(args.pattern, args.path);
  },
});

export const grepFilesTool = makeTool({
  description: 'Search file contents using a regex pattern. Use this to find where specific code is used, search for imports, find function definitions, or locate references to components/variables.',
  parameters: z.object({
    pattern: z.string().describe('Regex pattern or text to search for (e.g. "className=", "import.*Button", "useEffect")'),
    path: z.string().optional().describe('Search directory. Defaults to project root.'),
    include: z.string().optional().describe('File pattern to filter (e.g. "*.tsx", "*.css", "*.ts")'),
  }),
  execute: async (args: any) => {
    return await grepSandboxFiles(args.pattern, args.path, args.include);
  },
});

export const runCommandTool = makeTool({
  description: 'Execute a shell command in the sandbox. Use this to install packages (npm install), run build commands, check package versions, or perform other terminal operations.',
  parameters: z.object({
    command: z.string().describe('Shell command to execute (e.g. "npm install react-router-dom", "ls -la src/", "cat package.json")'),
  }),
  execute: async (args: any) => {
    return await runSandboxCommand(args.command);
  },
});

export const webSearchTool = makeTool({
  description: 'Search the web for current information, documentation, API references, pricing, tutorials, or any up-to-date content. Use this when you need information about libraries, frameworks, best practices, or recent changes.',
  parameters: z.object({
    query: z.string().describe('Search query (e.g. "React 19 new features", "Tailwind CSS v4 migration guide", "stripe API pricing 2025")'),
    numResults: z.number().optional().default(5).describe('Number of search results to return (1-10)'),
  }),
  execute: async (args: any) => {
    const results = await performWebSearch(args.query, args.numResults || 5);
    return formatWebResultsForAI(results, args.query) || `No web search results found for "${args.query}".`;
  },
});

export const aiTools = {
  readFile: readFileTool,
  listDir: listDirTool,
  globFiles: globFilesTool,
  grepFiles: grepFilesTool,
  runCommand: runCommandTool,
  webSearch: webSearchTool,
};
