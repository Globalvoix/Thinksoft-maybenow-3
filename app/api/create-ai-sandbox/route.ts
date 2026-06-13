import { NextResponse } from 'next/server';
import { Sandbox } from '@vercel/sandbox';
import type { SandboxState } from '@/types/sandbox';
import { appConfig } from '@/config/app.config';
import { createRichViteStarterFiles } from '@/lib/sandbox/starter-template';

// Store active sandbox globally
declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
  var sandboxCreationInProgress: boolean;
  var sandboxCreationPromise: Promise<any> | null;
}

export async function POST() {
  // Check if sandbox creation is already in progress
  if (global.sandboxCreationInProgress && global.sandboxCreationPromise) {
    console.log('[create-ai-sandbox] Sandbox creation already in progress, waiting for existing creation...');
    try {
      const existingResult = await global.sandboxCreationPromise;
      console.log('[create-ai-sandbox] Returning existing sandbox creation result');
      return NextResponse.json(existingResult);
    } catch (error) {
      console.error('[create-ai-sandbox] Existing sandbox creation failed:', error);
      // Continue with new creation if the existing one failed
    }
  }

  // Check if we already have an active sandbox
  if (global.activeSandbox && global.sandboxData) {
    console.log('[create-ai-sandbox] Returning existing active sandbox');
    return NextResponse.json({
      success: true,
      sandboxId: global.sandboxData.sandboxId,
      url: global.sandboxData.url
    });
  }

  // Set the creation flag
  global.sandboxCreationInProgress = true;
  
  // Create the promise that other requests can await
  global.sandboxCreationPromise = createSandboxInternal();
  
  try {
    const result = await global.sandboxCreationPromise;
    return NextResponse.json(result);
  } catch (error) {
    console.error('[create-ai-sandbox] Sandbox creation failed:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create sandbox',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    global.sandboxCreationInProgress = false;
    global.sandboxCreationPromise = null;
  }
}

async function createSandboxInternal() {
  let sandbox: any = null;

  try {
    console.log('[create-ai-sandbox] Creating Vercel sandbox...');
    
    // Kill existing sandbox if any
    if (global.activeSandbox) {
      console.log('[create-ai-sandbox] Stopping existing sandbox...');
      try {
        await global.activeSandbox.stop();
      } catch (e) {
        console.error('Failed to stop existing sandbox:', e);
      }
      global.activeSandbox = null;
      global.sandboxData = null;
    }
    
    // Clear existing files tracking
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    // Create Vercel sandbox with flexible authentication
    console.log(`[create-ai-sandbox] Creating Vercel sandbox with ${appConfig.vercelSandbox.timeoutMinutes} minute timeout...`);
    
    // Prepare sandbox configuration
    const sandboxConfig: any = {
      timeout: appConfig.vercelSandbox.timeoutMs,
      runtime: appConfig.vercelSandbox.runtime,
      ports: [appConfig.vercelSandbox.devPort]
    };
    
    // Add authentication parameters if using personal access token
    if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
      console.log('[create-ai-sandbox] Using personal access token authentication');
      sandboxConfig.teamId = process.env.VERCEL_TEAM_ID;
      sandboxConfig.projectId = process.env.VERCEL_PROJECT_ID;
      sandboxConfig.token = process.env.VERCEL_TOKEN;
    } else if (process.env.VERCEL_OIDC_TOKEN) {
      console.log('[create-ai-sandbox] Using OIDC token authentication');
    } else {
      console.log('[create-ai-sandbox] No authentication found - relying on default Vercel authentication');
    }
    
    sandbox = await Sandbox.create(sandboxConfig);
    
    const sandboxId = sandbox.sandboxId;
    console.log(`[create-ai-sandbox] Sandbox created: ${sandboxId}`);

    // Set up a basic Vite React app
    console.log('[create-ai-sandbox] Setting up Vite React app...');
    
    // First, change to the working directory
    await sandbox.runCommand('pwd');
    // workDir is defined in appConfig - not needed here
    
    // Get the sandbox URL using the correct Vercel Sandbox API
    const sandboxUrl = sandbox.domain(appConfig.vercelSandbox.devPort);
    
    // Extract the hostname from the sandbox URL for Vite config
    const sandboxHostname = new URL(sandboxUrl).hostname;
    console.log(`[create-ai-sandbox] Sandbox hostname: ${sandboxHostname}`);

    const starterFiles = createRichViteStarterFiles({
      port: appConfig.vercelSandbox.devPort,
      allowedHosts: ['localhost', '127.0.0.1', sandboxHostname, '.vercel.run', '.vercel-sandbox.dev'],
      hmr: '    hmr: true,'
    });

    const projectFiles = starterFiles.map(file => ({
      path: file.path,
      content: Buffer.from(file.content)
    }));

    // Create directory structure first
    await sandbox.runCommand({
      cmd: 'mkdir',
      args: ['-p', 'src/components/ui', 'src/lib', 'src/hooks']
    });
    
    // Write all files
    await sandbox.writeFiles(projectFiles);
    console.log('[create-ai-sandbox] ✓ Project files created');
    
    // Install dependencies
    console.log('[create-ai-sandbox] Installing dependencies...');
    const installResult = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '--loglevel', 'info']
    });
    if (installResult.exitCode === 0) {
      console.log('[create-ai-sandbox] ✓ Dependencies installed successfully');
    } else {
      console.log('[create-ai-sandbox] ⚠ Warning: npm install had issues but continuing...');
    }
    
    // Start Vite dev server in detached mode
    console.log('[create-ai-sandbox] Starting Vite dev server...');
    const viteProcess = await sandbox.runCommand({
      cmd: 'npm',
      args: ['run', 'dev'],
      detached: true
    });
    
    console.log('[create-ai-sandbox] ✓ Vite dev server started');
    
    // Wait for Vite to be fully ready
    await new Promise(resolve => setTimeout(resolve, appConfig.vercelSandbox.devServerStartupDelay));

    // Store sandbox globally
    global.activeSandbox = sandbox;
    global.sandboxData = {
      sandboxId,
      url: sandboxUrl,
      viteProcess
    };
    
    // Initialize sandbox state
    global.sandboxState = {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId
      },
      sandbox,
      sandboxData: {
        sandboxId,
        url: sandboxUrl
      }
    };
    
    // Track initial files
    for (const file of starterFiles) {
      global.existingFiles.add(file.path);
    }
    
    console.log('[create-ai-sandbox] Sandbox ready at:', sandboxUrl);
    
    const result = {
      success: true,
      sandboxId,
      url: sandboxUrl,
      message: 'Vercel sandbox created and Vite React app initialized'
    };
    
    // Store the result for reuse
    global.sandboxData = {
      ...global.sandboxData,
      ...result
    };
    
    return result;

  } catch (error) {
    console.error('[create-ai-sandbox] Error:', error);
    
    // Clean up on error
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (e) {
        console.error('Failed to stop sandbox on error:', e);
      }
    }
    
    // Clear global state on error
    global.activeSandbox = null;
    global.sandboxData = null;
    
    throw error; // Throw to be caught by the outer handler
  }
}
