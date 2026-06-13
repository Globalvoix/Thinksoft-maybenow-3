import { Sandbox } from '@vercel/sandbox';
import { SandboxProvider, SandboxInfo, CommandResult } from '../types';
import { appConfig } from '@/config/app.config';
import { createRichViteStarterFiles } from '@/lib/sandbox/starter-template';

export class VercelProvider extends SandboxProvider {
  private existingFiles: Set<string> = new Set();

  async createSandbox(): Promise<SandboxInfo> {
    try {
      
      // Kill existing sandbox if any
      if (this.sandbox) {
        try {
          await this.sandbox.stop();
        } catch (e) {
          console.error('Failed to stop existing sandbox:', e);
        }
        this.sandbox = null;
      }
      
      // Clear existing files tracking
      this.existingFiles.clear();

      // Create Vercel sandbox
      
      const sandboxConfig: any = {
        timeout: appConfig.vercelSandbox.timeoutMs,
        runtime: 'node22', // Use node22 runtime for Vercel sandboxes
        ports: [5173] // Vite port
      };

      // Add authentication based on environment variables
      if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
        sandboxConfig.teamId = process.env.VERCEL_TEAM_ID;
        sandboxConfig.projectId = process.env.VERCEL_PROJECT_ID;
        sandboxConfig.token = process.env.VERCEL_TOKEN;
      } else if (process.env.VERCEL_OIDC_TOKEN) {
        sandboxConfig.oidcToken = process.env.VERCEL_OIDC_TOKEN;
      }

      this.sandbox = await Sandbox.create(sandboxConfig);
      
      const sandboxId = this.sandbox.sandboxId;
      // Sandbox created successfully
      
      // Get the sandbox URL using the correct Vercel Sandbox API
      const sandboxUrl = this.sandbox.domain(5173);

      this.sandboxInfo = {
        sandboxId,
        url: sandboxUrl,
        provider: 'vercel',
        createdAt: new Date()
      };

      return this.sandboxInfo;

    } catch (error) {
      console.error('[VercelProvider] Error creating sandbox:', error);
      throw error;
    }
  }

  async runCommand(command: string): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    
    try {
      // Parse command into cmd and args (matching PR syntax)
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      // Vercel uses runCommand with cmd and args object (based on PR)
      const result = await this.sandbox.runCommand({
        cmd: cmd,
        args: args,
        cwd: '/vercel/sandbox',
        env: {}
      });
      
      // Handle stdout and stderr - they might be functions in Vercel SDK
      let stdout = '';
      let stderr = '';
      
      try {
        if (typeof result.stdout === 'function') {
          stdout = await result.stdout();
        } else {
          stdout = result.stdout || '';
        }
      } catch (e) {
        stdout = '';
      }
      
      try {
        if (typeof result.stderr === 'function') {
          stderr = await result.stderr();
        } else {
          stderr = result.stderr || '';
        }
      } catch (e) {
        stderr = '';
      }
      
      return {
        stdout: stdout,
        stderr: stderr,
        exitCode: result.exitCode || 0,
        success: result.exitCode === 0
      };
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message || 'Command failed',
        exitCode: 1,
        success: false
      };
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    // Vercel sandbox default working directory is /vercel/sandbox
    const fullPath = path.startsWith('/') ? path : `/vercel/sandbox/${path}`;
    
    // Writing file to sandbox
    
    // Based on Vercel SDK docs, writeFiles expects path and Buffer content
    try {
      const buffer = Buffer.from(content, 'utf-8');
      // Writing file with buffer
      
      await this.sandbox.writeFiles([{
        path: fullPath,
        content: buffer
      }]);
      
      this.existingFiles.add(path);
    } catch (writeError: any) {
      // Log detailed error information
      console.error(`[VercelProvider] writeFiles failed for ${fullPath}:`, {
        error: writeError,
        message: writeError?.message,
        response: writeError?.response,
        statusCode: writeError?.response?.status,
        responseData: writeError?.response?.data
      });
      
      // Fallback to command-based approach if writeFiles fails
      // Falling back to command-based file write
      
      // Ensure directory exists
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (dir) {
        const mkdirResult = await this.sandbox.runCommand({
          cmd: 'mkdir',
          args: ['-p', dir]
        });
        // Directory created
      }
      
      // Write file using echo and redirection
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`')
        .replace(/\n/g, '\\n');
      
      const writeResult = await this.sandbox.runCommand({
        cmd: 'sh',
        args: ['-c', `echo "${escapedContent}" > "${fullPath}"`]
      });
      
      // File written
      
      if (writeResult.exitCode === 0) {
        this.existingFiles.add(path);
      } else {
        throw new Error(`Failed to write file via command: ${writeResult.stderr}`);
      }
    }
  }

  async readFile(path: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    // Vercel sandbox default working directory is /vercel/sandbox
    const fullPath = path.startsWith('/') ? path : `/vercel/sandbox/${path}`;
    
    const result = await this.sandbox.runCommand({
      cmd: 'cat',
      args: [fullPath]
    });
    
    // Handle stdout and stderr - they might be functions in Vercel SDK
    let stdout = '';
    let stderr = '';
    
    try {
      if (typeof result.stdout === 'function') {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || '';
      }
    } catch (e) {
      stdout = '';
    }
    
    try {
      if (typeof result.stderr === 'function') {
        stderr = await result.stderr();
      } else {
        stderr = result.stderr || '';
      }
    } catch (e) {
      stderr = '';
    }
    
    if (result.exitCode !== 0) {
      throw new Error(`Failed to read file: ${stderr}`);
    }
    
    return stdout;
  }

  async listFiles(directory: string = '/vercel/sandbox'): Promise<string[]> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const result = await this.sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', `find ${directory} -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/dist/*" -not -path "*/build/*" | sed "s|^${directory}/||"`],
      cwd: '/'
    });
    
    // Handle stdout - it might be a function in Vercel SDK
    let stdout = '';
    
    try {
      if (typeof result.stdout === 'function') {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || '';
      }
    } catch (e) {
      stdout = '';
    }
    
    if (result.exitCode !== 0) {
      return [];
    }
    
    return stdout.split('\n').filter((line: string) => line.trim() !== '');
  }

  async installPackages(packages: string[]): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const flags = process.env.NPM_FLAGS || '';
    
    // Installing packages
    
    // Build args array
    const args = ['install'];
    if (flags) {
      args.push(...flags.split(' '));
    }
    args.push(...packages);
    
    const result = await this.sandbox.runCommand({
      cmd: 'npm',
      args: args,
      cwd: '/vercel/sandbox'
    });
    
    // Handle stdout and stderr - they might be functions in Vercel SDK
    let stdout = '';
    let stderr = '';
    
    try {
      if (typeof result.stdout === 'function') {
        stdout = await result.stdout();
      } else {
        stdout = result.stdout || '';
      }
    } catch (e) {
      stdout = '';
    }
    
    try {
      if (typeof result.stderr === 'function') {
        stderr = await result.stderr();
      } else {
        stderr = result.stderr || '';
      }
    } catch (e) {
      stderr = '';
    }
    
    // Restart Vite if configured and successful
    if (result.exitCode === 0 && process.env.AUTO_RESTART_VITE === 'true') {
      await this.restartViteServer();
    }
    
    return {
      stdout: stdout,
      stderr: stderr,
      exitCode: result.exitCode || 0,
      success: result.exitCode === 0
    };
  }

  async setupViteApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    // Setting up Vite app for sandbox
    
    // Create directory structure
    const mkdirResult = await this.sandbox.runCommand({
      cmd: 'mkdir',
      args: ['-p', '/vercel/sandbox/src/components/ui', '/vercel/sandbox/src/lib', '/vercel/sandbox/src/hooks']
    });
    // Directory structure created

    const starterFiles = createRichViteStarterFiles({
      port: 5173,
      allowedHosts: ['.vercel.run', '.vercel-sandbox.dev', '.e2b.dev', 'localhost', '127.0.0.1']
    });

    for (const file of starterFiles) {
      await this.writeFile(file.path, file.content);
    }
    
    // Installing npm dependencies
    
    // Install dependencies
    try {
      const installResult = await this.sandbox.runCommand({
        cmd: 'npm',
        args: ['install'],
        cwd: '/vercel/sandbox'
      });
      
      // npm install completed
      
      if (installResult.exitCode === 0) {
        // Dependencies installed successfully
      } else {
        console.warn('[VercelProvider] npm install had issues:', installResult.stderr);
      }
    } catch (error: any) {
      console.error('[VercelProvider] npm install error:', {
        message: error?.message,
        response: error?.response?.status,
        responseText: error?.text
      });
      // Try alternative approach - run as shell command
      try {
        const altResult = await this.sandbox.runCommand({
          cmd: 'sh',
          args: ['-c', 'cd /vercel/sandbox && npm install'],
          cwd: '/vercel/sandbox'
        });
        if (altResult.exitCode === 0) {
          // Alternative npm install succeeded
        } else {
          console.warn('[VercelProvider] Alternative npm install also had issues:', altResult.stderr);
        }
      } catch (altError) {
        console.error('[VercelProvider] Alternative npm install also failed:', altError);
        console.warn('[VercelProvider] Continuing without npm install - packages may need to be installed manually');
      }
    }
    
    // Start Vite dev server
    // Starting Vite dev server
    
    // Kill any existing Vite processes
    await this.sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'pkill -f vite || true'],
      cwd: '/'
    });
    
    // Start Vite in background
    await this.sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'nohup npm run dev > /tmp/vite.log 2>&1 &'],
      cwd: '/vercel/sandbox'
    });
    
    // Vite server started in background
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    // Track initial files
    for (const file of starterFiles) {
      this.existingFiles.add(file.path);
    }
  }

  async restartViteServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    // Restarting Vite server
    
    // Kill existing Vite process
    await this.sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'pkill -f vite || true'],
      cwd: '/'
    });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start Vite in background
    await this.sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'nohup npm run dev > /tmp/vite.log 2>&1 &'],
      cwd: '/vercel/sandbox'
    });
    
    // Vite server started in background
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, 7000));
  }

  getSandboxUrl(): string | null {
    return this.sandboxInfo?.url || null;
  }

  getSandboxInfo(): SandboxInfo | null {
    return this.sandboxInfo;
  }

  async terminate(): Promise<void> {
    if (this.sandbox) {
      try {
        await this.sandbox.stop();
      } catch (e) {
        console.error('Failed to terminate sandbox:', e);
      }
      this.sandbox = null;
      this.sandboxInfo = null;
    }
  }

  isAlive(): boolean {
    return !!this.sandbox;
  }

  async keepAlive(): Promise<boolean> {
    if (!this.sandbox) return false;
    try {
      const result = await this.runCommand('echo "keepalive"');
      return result.success;
    } catch {
      return false;
    }
  }

  async replaceText(oldText: string, newText: string): Promise<string[]> {
    if (!this.sandbox) return [];
    const pOld = oldText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
    const pNew = newText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
    const pythonCode = `
import os,glob
old = '${pOld}'
new_text = '${pNew}'
root = '/vercel/sandbox'
changed = []
exclude_dirs = {'node_modules','.git','dist','.next'}
exts = ('*.tsx','*.ts','*.jsx','*.js','*.css','*.html')
for ext in exts:
    for fp in glob.glob(os.path.join(root,'**',ext),recursive=True):
        parts = fp.replace('\\\\','/').split('/')
        if any(e in parts for e in exclude_dirs): continue
        try:
            with open(fp,'r',encoding='utf-8',errors='ignore') as f:
                content = f.read()
            if old in content:
                new_content = content.replace(old,new_text)
                with open(fp,'w',encoding='utf-8') as f:
                    f.write(new_content)
                changed.append(fp)
        except: pass
print('\\n'.join(changed) if changed else 'NO_CHANGES')
`;
    try {
      const result = await (this.sandbox as any).runCommand({
        cmd: 'python3',
        args: ['-c', pythonCode],
        cwd: '/vercel/sandbox',
        env: {}
      });
      let stdout = '';
      try {
        stdout = typeof result.stdout === 'function' ? await result.stdout() : (result.stdout || '');
      } catch {}
      if (!stdout.trim() || stdout === 'NO_CHANGES') return [];
      return stdout.split('\n').filter((f: string) => f.trim());
    } catch (e) {
      console.error('[VercelProvider] replaceText failed:', e);
      return [];
    }
  }
}
