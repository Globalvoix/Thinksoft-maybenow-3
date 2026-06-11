import { NextRequest, NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import type { SandboxState } from '@/types/sandbox';
import { selectFilesForEdit, getFileContents, formatFilesForAI } from '@/lib/context-selector';
import { executeSearchPlan, formatSearchResultsForAI, selectTargetFile } from '@/lib/file-search-executor';
import { FileManifest, FileInfo } from '@/types/file-manifest';
import type { ConversationState, ConversationMessage, ConversationEdit } from '@/types/conversation';
import { parseJavaScriptFile, buildComponentTree } from '@/lib/file-parser';
import { appConfig } from '@/config/app.config';
import { getComponentGraph } from '@/lib/sandbox-tools';
import { selectDesign } from '@/lib/design-selector';
import { aiTools } from '@/lib/ai-tools';
import { searchImages, searchVideos, extractImageQueries, formatAssetsForPrompt } from '@/lib/pexels';
import type { PexelsAsset } from '@/lib/pexels';

// Force dynamic route to enable streaming
export const dynamic = 'force-dynamic';

// Check if we're using Vercel AI Gateway
const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

console.log('[generate-ai-code-stream] AI Gateway config:', {
  isUsingAIGateway,
  hasGroqKey: !!process.env.GROQ_API_KEY,
  hasAIGatewayKey: !!process.env.AI_GATEWAY_API_KEY
});

const groq = createGroq({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GROQ_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

const anthropic = createAnthropic({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.ANTHROPIC_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'),
});

const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GEMINI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : process.env.OPENAI_BASE_URL,
});

// Helper function to analyze user preferences from conversation history
function analyzeUserPreferences(messages: ConversationMessage[]): {
  commonPatterns: string[];
  preferredEditStyle: 'targeted' | 'comprehensive';
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const patterns: string[] = [];
  
  // Count edit-related keywords
  let targetedEditCount = 0;
  let comprehensiveEditCount = 0;
  
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // Check for targeted edit patterns
    if (content.match(/\b(update|change|fix|modify|edit|remove|delete)\s+(\w+\s+)?(\w+)\b/)) {
      targetedEditCount++;
    }
    
    // Check for comprehensive edit patterns
    if (content.match(/\b(rebuild|recreate|redesign|overhaul|refactor)\b/)) {
      comprehensiveEditCount++;
    }
    
    // Extract common request patterns
    if (content.includes('hero')) patterns.push('hero section edits');
    if (content.includes('header')) patterns.push('header modifications');
    if (content.includes('color') || content.includes('style')) patterns.push('styling changes');
    if (content.includes('button')) patterns.push('button updates');
    if (content.includes('animation')) patterns.push('animation requests');
  });
  
  return {
    commonPatterns: [...new Set(patterns)].slice(0, 3), // Top 3 unique patterns
    preferredEditStyle: targetedEditCount > comprehensiveEditCount ? 'targeted' : 'comprehensive'
  };
}

declare global {
  var sandboxState: SandboxState;
  var conversationState: ConversationState | null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'openai/gpt-oss-20b', context, isEdit = false } = await request.json();
    
    console.log('[generate-ai-code-stream] Received request:');
    console.log('[generate-ai-code-stream] - prompt:', prompt);
    console.log('[generate-ai-code-stream] - isEdit:', isEdit);
    console.log('[generate-ai-code-stream] - context.sandboxId:', context?.sandboxId);
    console.log('[generate-ai-code-stream] - context.currentFiles:', context?.currentFiles ? Object.keys(context.currentFiles) : 'none');
    console.log('[generate-ai-code-stream] - currentFiles count:', context?.currentFiles ? Object.keys(context.currentFiles).length : 0);
    
    // Initialize conversation state if not exists
    if (!global.conversationState) {
      global.conversationState = {
        conversationId: `conv-${Date.now()}`,
        startedAt: Date.now(),
        lastUpdated: Date.now(),
        context: {
          messages: [],
          edits: [],
          projectEvolution: { majorChanges: [] },
          userPreferences: {}
        }
      };
    }
    
    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      metadata: {
        sandboxId: context?.sandboxId
      }
    };
    global.conversationState.context.messages.push(userMessage);
    
    // Clean up old messages to prevent unbounded growth
    if (global.conversationState.context.messages.length > 20) {
      // Keep only the last 15 messages
      global.conversationState.context.messages = global.conversationState.context.messages.slice(-15);
      console.log('[generate-ai-code-stream] Trimmed conversation history to prevent context overflow');
    }
    
    // Clean up old edits
    if (global.conversationState.context.edits.length > 10) {
      global.conversationState.context.edits = global.conversationState.context.edits.slice(-8);
    }
    
    // Debug: Show a sample of actual file content
    if (context?.currentFiles && Object.keys(context.currentFiles).length > 0) {
      const firstFile = Object.entries(context.currentFiles)[0];
      console.log('[generate-ai-code-stream] - sample file:', firstFile[0]);
      console.log('[generate-ai-code-stream] - sample content preview:', 
        typeof firstFile[1] === 'string' ? firstFile[1].substring(0, 100) + '...' : 'not a string');
    }
    
    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }
    
    // Create a stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Function to send progress updates with flushing
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      try {
        await writer.write(encoder.encode(message));
        // Force flush by writing a keep-alive comment
        if (data.type === 'stream' || data.type === 'conversation') {
          await writer.write(encoder.encode(': keepalive\n\n'));
        }
      } catch (error) {
        console.error('[generate-ai-code-stream] Error writing to stream:', error);
      }
    };
    
    // Start processing in background
    (async () => {
      try {
        // Send initial status
        await sendProgress({ type: 'status', message: 'Initializing AI...' });
        
        // No keep-alive needed - sandbox provisioned for 10 minutes
        
        // Check if we have a file manifest for edit mode
        let editContext = null;
        let enhancedSystemPrompt = '';
        
        if (isEdit) {
          console.log('[generate-ai-code-stream] Edit mode detected - starting agentic search workflow');
          console.log('[generate-ai-code-stream] Has fileCache:', !!global.sandboxState?.fileCache);
          console.log('[generate-ai-code-stream] Has manifest:', !!global.sandboxState?.fileCache?.manifest);
          
          const manifest: FileManifest | undefined = global.sandboxState?.fileCache?.manifest;
          
          if (manifest) {
            await sendProgress({ type: 'status', message: '🔍 Creating search plan...' });
            
            const fileContents = global.sandboxState.fileCache?.files || {};
            console.log('[generate-ai-code-stream] Files available for search:', Object.keys(fileContents).length);
            
            // STEP 1: Get search plan from AI
            try {
              const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-edit-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, manifest, model })
              });
              
              if (intentResponse.ok) {
                const { searchPlan } = await intentResponse.json();
                console.log('[generate-ai-code-stream] Search plan received:', searchPlan);
                
                await sendProgress({ 
                  type: 'status', 
                  message: `🔎 Searching for: "${searchPlan.searchTerms.join('", "')}"`
                });
                
                // STEP 2: Execute the search plan
                const searchExecution = executeSearchPlan(searchPlan, 
                  Object.fromEntries(
                    Object.entries(fileContents).map(([path, data]) => [
                      path.startsWith('/') ? path : `/home/user/app/${path}`,
                      data.content
                    ])
                  )
                );
                
                console.log('[generate-ai-code-stream] Search execution:', {
                  success: searchExecution.success,
                  resultsCount: searchExecution.results.length,
                  filesSearched: searchExecution.filesSearched,
                  time: searchExecution.executionTime + 'ms'
                });
                
                if (searchExecution.success && searchExecution.results.length > 0) {
                  // STEP 3: Select the best target file
                  const target = selectTargetFile(searchExecution.results, searchPlan.editType);
                  
                  if (target) {
                    await sendProgress({ 
                      type: 'status', 
                      message: `✅ Found code in ${target.filePath.split('/').pop()} at line ${target.lineNumber}`
                    });
                    
                    console.log('[generate-ai-code-stream] Target selected:', target);
                    
                    // Create surgical edit context with exact location
                    // normalizedPath would be: target.filePath.replace('/home/user/app/', '');
                    // fileContent available but not used in current implementation
                    // const fileContent = fileContents[normalizedPath]?.content || '';
                    
                    // Build enhanced context with search results
                    enhancedSystemPrompt = `
${formatSearchResultsForAI(searchExecution.results)}

SURGICAL EDIT INSTRUCTIONS:
You have been given the EXACT location of the code to edit.
- File: ${target.filePath}
- Line: ${target.lineNumber}
- Reason: ${target.reason}

Make ONLY the change requested by the user. Do not modify any other code.
User request: "${prompt}"`;
                    
                    // Set up edit context with just this one file
                    editContext = {
                      primaryFiles: [target.filePath],
                      contextFiles: [],
                      systemPrompt: enhancedSystemPrompt,
                      editIntent: {
                        type: searchPlan.editType,
                        description: searchPlan.reasoning,
                        targetFiles: [target.filePath],
                        confidence: 0.95, // High confidence since we found exact location
                        searchTerms: searchPlan.searchTerms
                      }
                    };
                    
                    console.log('[generate-ai-code-stream] Surgical edit context created');
                  }
                } else {
                  // Search failed - fall back to old behavior but inform user
                  console.warn('[generate-ai-code-stream] Search found no results, falling back to broader context');
                  await sendProgress({ 
                    type: 'status', 
                    message: '⚠️ Could not find exact match, using broader search...'
                  });
                }
              } else {
                console.error('[generate-ai-code-stream] Failed to get search plan');
              }
            } catch (error) {
              console.error('[generate-ai-code-stream] Error in agentic search workflow:', error);
              await sendProgress({ 
                type: 'status', 
                message: '⚠️ Search workflow error, falling back to keyword method...'
              });
              // Fall back to old method on any error if we have a manifest
              if (manifest) {
                editContext = selectFilesForEdit(prompt, manifest);
              }
            }
          } else {
            // Fall back to old method if AI analysis fails
            console.warn('[generate-ai-code-stream] AI intent analysis failed, falling back to keyword method');
            if (manifest) {
              editContext = selectFilesForEdit(prompt, manifest);
            } else {
              console.log('[generate-ai-code-stream] No manifest available for fallback');
              await sendProgress({ 
                type: 'status', 
                message: '⚠️ No file manifest available, will use broad context'
              });
            }
          }
          
          // If we got an edit context from any method, use its system prompt
          if (editContext) {
            enhancedSystemPrompt = editContext.systemPrompt;
            
            await sendProgress({ 
              type: 'status', 
              message: `Identified edit type: ${editContext.editIntent?.description || 'Code modification'}`
            });
          } else if (!manifest) {
            console.log('[generate-ai-code-stream] WARNING: No manifest available for edit mode!');
            
            // Try to fetch files from sandbox if we have one
            if (global.activeSandbox) {
              await sendProgress({ type: 'status', message: 'Fetching current files from sandbox...' });
              
              try {
                // Fetch files directly from sandbox
                const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/get-sandbox-files`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                if (filesResponse.ok) {
                  const filesData = await filesResponse.json();
                  
                  if (filesData.success && filesData.manifest) {
                    console.log('[generate-ai-code-stream] Successfully fetched manifest from sandbox');
                    const manifest = filesData.manifest;
                    
                    // Now try to analyze edit intent with the fetched manifest
                    try {
                      const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-edit-intent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt, manifest, model })
                      });
                      
                      if (intentResponse.ok) {
                        const { searchPlan } = await intentResponse.json();
                        console.log('[generate-ai-code-stream] Search plan received (after fetch):', searchPlan);
                        
                        // For now, fall back to keyword search since we don't have file contents for search execution
                        // This path happens when no manifest was initially available
                        let targetFiles: any[] = [];
                        if (!searchPlan || searchPlan.searchTerms.length === 0) {
                          console.warn('[generate-ai-code-stream] No target files after fetch, searching for relevant files');
                          
                          const promptLower = prompt.toLowerCase();
                          const allFilePaths = Object.keys(manifest.files);
                          
                          // Look for component names mentioned in the prompt
                          if (promptLower.includes('hero')) {
                            targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('hero'));
                          } else if (promptLower.includes('header')) {
                            targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('header'));
                          } else if (promptLower.includes('footer')) {
                            targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('footer'));
                          } else if (promptLower.includes('nav')) {
                            targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('nav'));
                          } else if (promptLower.includes('button')) {
                            targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('button'));
                          }
                          
                          if (targetFiles.length > 0) {
                            console.log('[generate-ai-code-stream] Found target files by keyword search after fetch:', targetFiles);
                          }
                        }
                        
                        const allFiles = Object.keys(manifest.files)
                          .filter(path => !targetFiles.includes(path));
                        
                        editContext = {
                          primaryFiles: targetFiles,
                          contextFiles: allFiles,
                          systemPrompt: `
You are an expert senior software engineer performing a surgical, context-aware code modification. Your primary directive is **precision and preservation**.

Think of yourself as a surgeon making a precise incision, not a construction worker demolishing a wall.

## Search-Based Edit
Search Terms: ${searchPlan?.searchTerms?.join(', ') || 'keyword-based'}
Edit Type: ${searchPlan?.editType || 'UPDATE_COMPONENT'}
Reasoning: ${searchPlan?.reasoning || 'Modifying based on user request'}

Files to Edit: ${targetFiles.join(', ') || 'To be determined'}
User Request: "${prompt}"

## Your Mandatory Thought Process (Execute Internally):
Before writing ANY code, you MUST follow these steps:

1. **Understand Intent:**
   - What is the user's core goal? (adding feature, fixing bug, changing style?)
   - Does the conversation history provide extra clues?

2. **Locate the Code:**
   - First examine the Primary Files provided
   - Check the "ALL PROJECT FILES" list to find the EXACT file name
   - "nav" might be Navigation.tsx, NavBar.tsx, Nav.tsx, or Header.tsx
   - DO NOT create a new file if a similar one exists!

3. **Plan the Changes (Mental Diff):**
   - What is the *minimal* set of changes required?
   - Which exact lines need to be added, modified, or deleted?
   - Will this require new packages?

4. **Verify Preservation:**
   - What existing code, props, state, and logic must NOT be touched?
   - How can I make my change without disrupting surrounding code?

5. **Construct the Final Code:**
   - Only after completing steps above, generate the final code
   - Provide the ENTIRE file content with modifications integrated

## Critical Rules & Constraints:

**PRESERVATION IS KEY:** You MUST NOT rewrite entire components or files. Integrate your changes into the existing code. Preserve all existing logic, props, state, and comments not directly related to the user's request.

**MINIMALISM:** Only output files you have actually changed. If a file doesn't need modification, don't include it.

**COMPLETENESS:** Each file must be COMPLETE from first line to last:
- NEVER TRUNCATE - Include EVERY line
- NO ellipsis (...) to skip content
- ALL imports, functions, JSX, and closing tags must be present
- The file MUST be runnable

**SURGICAL PRECISION:**
- Change ONLY what's explicitly requested
- If user says "change background to green", change ONLY the background class
- 99% of the original code should remain untouched
- NO refactoring, reformatting, or "improvements" unless requested

**NO CONVERSATION:** Your output must contain ONLY the code. No explanations or apologies.

## EXAMPLES:

### CORRECT APPROACH for "change hero background to blue":
<thinking>
I need to change the background color of the Hero component. Looking at the file, I see the main div has 'bg-gray-900'. I will change ONLY this to 'bg-blue-500' and leave everything else exactly as is.
</thinking>

Then return the EXACT same file with only 'bg-gray-900' changed to 'bg-blue-500'.

### WRONG APPROACH (DO NOT DO THIS):
- Rewriting the Hero component from scratch
- Changing the structure or reorganizing imports
- Adding or removing unrelated code
- Reformatting or "cleaning up" the code

Remember: You are a SURGEON making a precise incision, not an artist repainting the canvas!`,
                          editIntent: {
                            type: searchPlan?.editType || 'UPDATE_COMPONENT',
                            targetFiles: targetFiles,
                            confidence: searchPlan ? 0.85 : 0.6,
                            description: searchPlan?.reasoning || 'Keyword-based file selection',
                            suggestedContext: []
                          }
                        };
                        
                        enhancedSystemPrompt = editContext.systemPrompt;
                        
                        await sendProgress({ 
                          type: 'status', 
                          message: `Identified edit type: ${editContext.editIntent.description}`
                        });
                      }
                    } catch (error) {
                      console.error('[generate-ai-code-stream] Error analyzing intent after fetch:', error);
                    }
                  } else {
                    console.error('[generate-ai-code-stream] Failed to get manifest from sandbox files');
                  }
                } else {
                  console.error('[generate-ai-code-stream] Failed to fetch sandbox files:', filesResponse.status);
                }
              } catch (error) {
                console.error('[generate-ai-code-stream] Error fetching sandbox files:', error);
                await sendProgress({ 
                  type: 'warning', 
                  message: 'Could not analyze existing files for targeted edits. Proceeding with general edit mode.'
                });
              }
            } else {
              console.log('[generate-ai-code-stream] No active sandbox to fetch files from');
              await sendProgress({ 
                type: 'warning', 
                message: 'No existing files found. Consider generating initial code first.'
              });
            }
          }
        }
        
        // Build conversation context for system prompt
        let conversationContext = '';
        if (global.conversationState && global.conversationState.context.messages.length > 1) {
          console.log('[generate-ai-code-stream] Building conversation context');
          console.log('[generate-ai-code-stream] Total messages:', global.conversationState.context.messages.length);
          console.log('[generate-ai-code-stream] Total edits:', global.conversationState.context.edits.length);
          
          conversationContext = `\n\n## Conversation History (Recent)\n`;
          
          // Include only the last 3 edits to save context
          const recentEdits = global.conversationState.context.edits.slice(-3);
          if (recentEdits.length > 0) {
            console.log('[generate-ai-code-stream] Including', recentEdits.length, 'recent edits in context');
            conversationContext += `\n### Recent Edits:\n`;
            recentEdits.forEach(edit => {
              conversationContext += `- "${edit.userRequest}" → ${edit.editType} (${edit.targetFiles.map(f => f.split('/').pop()).join(', ')})\n`;
            });
          }
          
          // Include recently created files - CRITICAL for preventing duplicates
          const recentMsgs = global.conversationState.context.messages.slice(-5);
          const recentlyCreatedFiles: string[] = [];
          recentMsgs.forEach(msg => {
            if (msg.metadata?.editedFiles) {
              recentlyCreatedFiles.push(...msg.metadata.editedFiles);
            }
          });
          
          if (recentlyCreatedFiles.length > 0) {
            const uniqueFiles = [...new Set(recentlyCreatedFiles)];
            conversationContext += `\n### 🚨 RECENTLY CREATED/EDITED FILES (DO NOT RECREATE THESE):\n`;
            uniqueFiles.forEach(file => {
              conversationContext += `- ${file}\n`;
            });
            conversationContext += `\nIf the user mentions any of these components, UPDATE the existing file!\n`;
          }
          
          // Include only last 5 messages for context (reduced from 10)
          const recentMessages = recentMsgs;
          if (recentMessages.length > 2) { // More than just current message
            conversationContext += `\n### Recent Messages:\n`;
            recentMessages.slice(0, -1).forEach(msg => { // Exclude current message
              if (msg.role === 'user') {
                const truncatedContent = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
                conversationContext += `- "${truncatedContent}"\n`;
              }
            });
          }
          
          // Include only last 2 major changes
          const majorChanges = global.conversationState.context.projectEvolution.majorChanges.slice(-2);
          if (majorChanges.length > 0) {
            conversationContext += `\n### Recent Changes:\n`;
            majorChanges.forEach(change => {
              conversationContext += `- ${change.description}\n`;
            });
          }
          
          // Keep user preferences - they're concise
          const userPrefs = analyzeUserPreferences(global.conversationState.context.messages);
          if (userPrefs.commonPatterns.length > 0) {
            conversationContext += `\n### User Preferences:\n`;
            conversationContext += `- Edit style: ${userPrefs.preferredEditStyle}\n`;
          }
          
          // Limit total conversation context length
          if (conversationContext.length > 2000) {
            conversationContext = conversationContext.substring(0, 2000) + '\n[Context truncated to prevent length errors]';
          }
        }
        
        // Select a matching design system for first-time builds
        let selectedDesign = null;
        if (!isEdit) {
          try {
            selectedDesign = await selectDesign(prompt);
          } catch {}
        }

        // Build system prompt with conversation awareness
        let systemPrompt = `You are an expert full-stack developer. You generate code using TypeScript (.tsx/.ts) as the primary language, JavaScript (.js/.tsx) where appropriate, CSS (.css), HTML (.html), SQL (.sql) for Supabase migrations, and Deno/TypeScript (.ts) for Edge Functions. You maintain context across messages and build complete, production-ready applications.
${conversationContext}

🚨 CRITICAL RULES - YOUR MOST IMPORTANT INSTRUCTIONS:
 0. **EVERY IMPORT YOU WRITE MUST HAVE A CORRESPONDING FILE** - If App.tsx imports "./components/Pricing", you MUST also generate Pricing.tsx. Never reference a component file you didn't create.
1. **FOCUS ON THE REQUEST, BUT GENERATE ALL SUPPORTING FILES FOR A WORKING PREVIEW**
   - Generate the components, hooks, utils, and mock data needed for the requested feature to render in the sandbox.
   - Think ahead: if your component imports data, provide mock data. If it fetches from an API, include loading/error states.
   - If a feature needs sub‑components to render (e.g. a CardList needs Card), generate them.
   - Don't add unrelated features or pages, but do generate every file the main component imports.
2. **CHECK App.tsx FIRST** - ALWAYS see what components exist before creating new ones
 3. **NAVIGATION LIVES IN Header.tsx** - Don't create Nav.tsx if Header exists with nav
4. **USE STANDARD TAILWIND CLASSES ONLY**:
   - ✅ CORRECT: bg-white, text-black, bg-blue-500, bg-gray-100, text-gray-900
   - ❌ WRONG: bg-background, text-foreground, bg-primary, bg-muted, text-secondary
   - Use ONLY classes from the official Tailwind CSS documentation
 5. **FILE COUNT RULES**:
     - For an initial build: generate ALL component files you import in App.tsx. If App.tsx imports 5 components, create all 5 files.
    - For edits: generate every file the requested change touches. If you edit Header.tsx and it needs a new sub-component, generate both. Don't touch unrelated files.
    - Never leave dangling imports. Every import statement must have a real file.
6. **PRODUCTION-READY CODE (THIS APP WILL BE USED BY THOUSANDS OF REAL USERS)**:
   - **Error Handling**: Every async operation MUST have try/catch + user-friendly error display. Never let errors silently fail or crash the UI.
   - **Loading States**: Every data fetch, async operation, or dynamic render MUST show a loading indicator. Users must never see blank screens.
   - **Empty States**: Every list, table, or data component MUST handle the empty state — show "No items yet" or similar instead of nothing.
   - **Default Values**: Never assume data exists. Always provide fallbacks: 'user?.name ?? Guest', 'items?.length ?? 0', 'data ?? []'.
   - **Responsive Design**: ALL components MUST work on mobile (375px), tablet (768px), and desktop (1280px+). Use Tailwind responsive prefixes (md:, lg:).
   - **Performance**: Use React.memo for list items, useMemo for expensive calculations, useCallback for stable function references. Avoid inline object/function creation in JSX props.
   - **Accessibility**: Use semantic HTML (<nav>, <main>, <section>, <button>), aria-labels on icon-only buttons, proper heading hierarchy (h1→h2→h3).
   - **Component Architecture**: Favor small, focused components over monolithic ones. Extract reusable UI primitives (Button, Card, Input, Modal) when patterns repeat.
   - **CSS/Styling**: Never use fixed widths or heights that break on different screens. Use Tailwind's responsive + flex/grid for layouts.
 7. **DO NOT CREATE SVGs FROM SCRATCH**:
    - NEVER generate custom SVG code unless explicitly asked
    - Use existing icon libraries (lucide-react, heroicons, etc.)
    - Or use placeholder elements/text if icons are not critical
    - Only create custom SVGs when user specifically requests "create an SVG" or "draw an SVG"
 8. **MULTI-TASK DECOMPOSITION (CRITICAL)**:
    - When the user gives a request containing MULTIPLE distinct tasks, you MUST detect this and build a TODO list
    - Indicators of multi-task requests: numbered lists, bullet points, "and" joining distinct actions, "also", "then", "additionally", comma-separated action items
    - When detected, your response MUST follow this structure:

      TASK PLAN:
      1. [Task 1 description]
      2. [Task 2 description]
      ...

      --- Task 1: [name] ---
      [code/output for task 1]

      --- Task 2: [name] ---
      [code/output for task 2]
      ...

    - If the request is a SINGLE task, proceed normally without the task plan header
    - NEVER skip a task in the list — complete ALL of them
    - If tasks conflict or depend on each other, order them logically (dependencies first)
     - Mark each task complete as you finish it in the response
 9. **USE PEXELS FOR REAL IMAGES/VIDEOS**:
    - When you need images (hero, backgrounds, team photos, gallery, product shots, etc.), use the Pexels image URLs provided in the context under <pexels_assets>.
    - NEVER use placeholder image URLs like picsum.photos, via.placeholder.com, or unsplash placeholders.
    - ALWAYS use the exact URLs from <pexels_assets> in your <img src="..."> tags.
    - Include the photographer attribution text near the image: "Photo by [photographer] on Pexels"
    - For videos, use the <video> tag with the provided poster attribute and src URL.
    - If no pexels assets are provided for the specific image you need, use a colored CSS gradient/placeholder div instead of an external placeholder URL.
10. **LANGUAGE SELECTION GUIDE (use the right extension for each job)**:
    - .tsx — React components (PRIMARY choice for all new components)
    - .ts — Hooks, utilities, types, contexts, API clients, Edge Functions
    - .css — Stylesheets (index.css, component CSS files)
    - .html — index.html, static HTML files
    - .json — package.json, tsconfig.json, config files
    - .js — Vite config, PostCSS config, Tailwind config (non-TypeScript configs)
    - .sql — Supabase migrations, RLS policies, schema definitions
    - .md — Documentation, README, design.md
    - When editing existing projects, match the extension of the file you're editing.
    - For new files in a TypeScript project, ALWAYS use .tsx or .ts.
    - NEVER mix .jsx and .tsx for the same type of file — be consistent within a project.
11. **LUCIDE ICONS (SAFE LIST - only use these)**:
    - Common: Menu, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, Heart, Star, User, Home, Mail, Phone, Map, Globe, ExternalLink, Share2, Send, Image, Bell, Settings, Sun, Moon, Trash2, Edit, Plus, Minus, Check, Copy, Download, Upload, File, Folder, Clock, Calendar, Camera, Video, Music, Book, Info, AlertCircle, HelpCircle, DollarSign, Percent, TrendingUp, TrendingDown, Filter, Eye, EyeOff, Lock, Unlock, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ShoppingCart, LogOut, RefreshCw, Maximize2, Minimize2
    - For social media brand icons, DO NOT use lucide-react (Facebook, Twitter, Github, Linkedin, Instagram, Youtube are deprecated/broken in Vite). Instead use inline SVG elements or simple text/emoji links.
    - Example safe social footer: use Globe icon for a generic link, or render brand SVGs inline.
12. **ELEMENT TARGETING**: When the user's prompt starts with [Target element: CSS_SELECTOR], the request refers to a specific element on the page. Find the component that renders that element (search via the CSS selector, tag name, text content, or ID) and edit ONLY that component. Apply the change precisely to that element.
13. **PREVIEW-AWARE GENERATION (the code runs in a live Vite sandbox)**:
    - Your code is rendered live in an iframe. The user sees it update as you generate files.
    - Every component you create must render WITHOUT crashing — handle missing data with fallbacks/loading states.
    - If a feature fetches from an API, provide mock data or a loading state so the preview isn't blank.
    - If you import a sub-component, generate its file in the same response. The preview breaks on missing imports.
    - Use safe lucide-react icons (rule 11) — invalid icon names crash the preview.
    - For social links/footer, use inline SVGs or text instead of lucide-react brand icons.
    - The preview will refresh after all files are applied. Generate complete, working code.

COMPONENT RELATIONSHIPS (CHECK THESE FIRST):
- Navigation usually lives INSIDE Header.tsx, not separate Nav.tsx
- Logo is typically in Header, not standalone
- Footer often contains nav links already
- Menu/Hamburger is part of Header, not separate

PACKAGE USAGE RULES:
- DO NOT use react-router-dom unless user explicitly asks for routing
- For simple nav links in a single-page app, use scroll-to-section or href="#"
- Only add routing if building a multi-page application
- Common packages are auto-installed from your imports

ICON USAGE RULES (CRITICAL - PREVENTS BUILD ERRORS):
- NEVER use named imports from lucide-react for social media brands. These DO NOT EXIST and WILL crash the build.
- lucide-react does NOT export: Github, Twitter/X, Linkedin, Facebook, Youtube, Instagram, Discord, TikTok, Snapchat, Pinterest, Reddit
- For ALL social media icons, use the inline SVGs provided below (copy-paste directly):
  Facebook: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  Twitter/X: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  Instagram: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  LinkedIn: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  Youtube: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  Github: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
- For other icons, use simple text/emoji placeholders: <span className="text-xl">→</span> or <span>📧</span>
- If you MUST use lucide-react, ONLY use these common exports: Menu, X, ChevronDown, ChevronRight, ChevronLeft, Search, Heart, Star, User, ShoppingCart, ArrowRight, ArrowLeft, Mail, Phone, MapPin, ExternalLink, Loader2
- RE-RULE: NEVER import social media brand icons from lucide-react. Always use the inline SVGs above.

AVAILABLE TOOLS (you have these capabilities — use them when needed):
You have access to the following tools. Use them to explore the codebase, find information, install packages, and search the web.

- readFile(filePath, offset?, limit?): Read a file from the sandbox to understand its code, check imports, or inspect a component.
- listDir(path?): List files in a directory to see the project structure and find where files are located.
- globFiles(pattern, path?): Find files by name or extension pattern (e.g. "*.tsx", "*Button*").
- grepFiles(pattern, path?, include?): Search file contents by regex — find imports, function definitions, or usage references.
- runCommand(command): Execute a shell command (npm install, ls, cat, etc.) for package installation or investigation.
- webSearch(query, numResults?): Search the web for documentation, pricing, tutorials, API references, or recent updates.

WHEN TO USE TOOLS:
- Before editing: readFile + listDir/grepFiles to understand the component structure
- Before adding features: readFile the existing files to know what's already there
- If you need a package: runCommand to install it, then grepFiles/readFile to check the generated code works
- If you need current info (API docs, pricing, tutorials): use webSearch
- If you need to find where something is defined: grepFiles

DESIGN-FIRST WORKFLOW:
This is a ${isEdit ? 'FOLLOW-UP EDIT' : 'NEW BUILD FROM SCRATCH'}.

${isEdit ? '' : selectedDesign ? `STEP 1 - DESIGN SYSTEM (MANDATORY FOR ALL NEW BUILDS):

The following design system from ${selectedDesign.brandName} was selected as the best match for your request. ADAPT it to match the user's specific needs — modify colors, typography, spacing, and components to fit their exact request. Do not just copy the brand as-is.

Here is the ${selectedDesign.brandName} design system:

${selectedDesign.designContent}

Your task:
- Create a file called \`design.md\` that adapts this ${selectedDesign.brandName} design system to match the user's specific request
- Modify the colors, fonts, spacing, and components as needed — the user's app should NOT look identical to ${selectedDesign.brandName}
- After creating design.md, generate ALL component files that implement the adapted design system
- Every design decision in every component MUST reference the token names from your design.md` : `STEP 1 - CREATE DESIGN.MD (MANDATORY FOR ALL NEW BUILDS):
Before generating any component code, create a file called \`design.md\` that defines the design system for the user's specific request. The design should be custom-tailored to what the user described.

DESIGN GUIDELINES:
- Read the user's prompt carefully. If they described a specific look (e.g. "dark", "minimal", "playful", "professional", "SaaS-like"), build the design system around that.
- If they didn't specify a style, invent a unique and cohesive visual direction that fits the brand/industry implied by their request.
- Every value must be specific (actual hex colors, actual font names, actual px values). Do NOT use generic placeholders like "primary" or "accent".
- After creating design.md, proceed to build ALL components that implement it.

DESIGN SYSTEM SECTIONS:
1. Brand colors and palette (primary, secondary, neutral, accent, surface, semantic)
2. Typography (headings, body, mono, sizes, weights, line heights, letter spacing)
3. Spacing scale (4px base increments, container max-widths)
4. Border radius tokens (buttons, cards, inputs, modals, pills)
5. Shadow/elevation system
6. Component-specific tokens (button, card, input, badge, avatar styles)
7. Iconography guidelines (style, size, color treatment)
8. Animation tokens (durations, easings, transitions)
9. Grid/layout system (columns, gutters, breakpoints)
10. Navigation patterns (header, sidebar, mobile menu, breadcrumbs)
11. Form controls (input, select, checkbox, radio, switch, textarea)
12. Data display (table, list, stat, badge, tag, avatar, progress)
13. Feedback patterns (toast, alert, modal, tooltip, popover, skeleton)
14. Responsive breakpoints and behaviors
15. Dark/light mode (if applicable)
16. Accessibility tokens (focus rings, contrast ratios, touch targets)
17. Logo usage and favicon
18. Footer patterns (links, social, copyright, newsletter)
19. Hero section patterns (layout, typography scale, image placement)
20. Feature section patterns (grid, card style, icon treatment)
21. Pricing section structure (tiers, highlights, comparison)
22. Testimonial section design (carousel, grid, card style)
23. CTA section styling (background, button, spacing)
24. FAQ/accordion design (expansion style, icon, spacing)
25. Blog/article card patterns
26. Contact form and section design
27. Team/About section layout
28. Integration/logo cloud section design`}

REQUIRED SECTIONS FOR A COMPLETE WEB APPLICATION:
When building a web application, you MUST include:
1. **Header with Navigation** - Usually Header.tsx containing nav
2. **Hero Section** - The main landing area (Hero.tsx)
3. **Main Content Sections** - Features, Services, About, etc.
4. **Footer** - Contact info, links, copyright (Footer.tsx)
5. **App.tsx** - Main app component that imports and uses all components

CRITICAL: When generating App.tsx that imports components, you MUST generate EVERY component file in the same response. For each import statement you write, create a matching file block. Never leave missing imports.

The FIRST file block in your response MUST be design.md (for new builds), followed by all component files. The file block format is exactly:
<file path="design.md">content here</file>
<file path="src/components/Hero.tsx">content here</file>

${isEdit ? `CRITICAL: THIS IS AN EDIT TO AN EXISTING APPLICATION

YOU MUST FOLLOW THESE EDIT RULES:
0. NEVER create tailwind.config.js, vite.config.js, package.json, or any other config files - they already exist!
1. DO NOT regenerate the entire application
2. DO NOT create files that already exist (like App.tsx, index.css, tailwind.config.js)
3. ONLY edit the EXACT files needed for the requested change - NO MORE, NO LESS
4. If the user says "update the header", ONLY edit the Header component - DO NOT touch Footer, Hero, or any other components
5. If the user says "change the color", ONLY edit the relevant style or component file - DO NOT "improve" other parts
6. If you're unsure which file to edit, choose the SINGLE most specific one related to the request
7. IMPORTANT: When adding new components or libraries:
   - Create the new component file
   - UPDATE ONLY the parent component that will use it
   - Example: Adding a Newsletter component means:
     * Create Newsletter.tsx
     * Update ONLY the file that will use it (e.g., Footer.tsx OR App.tsx) - NOT both
8. When adding npm packages:
   - Import them ONLY in the files where they're actually used
   - The system will auto-install missing packages

CRITICAL FILE MODIFICATION RULES - VIOLATION = FAILURE:
- **NEVER TRUNCATE FILES** - Always return COMPLETE files with ALL content
- **NO ELLIPSIS (...)** - Include every single line of code, no skipping
- Files MUST be complete and runnable - include ALL imports, functions, JSX, and closing tags
- Count the files you're about to generate
- If the user asked to change ONE thing, you should generate ONE file (or at most two if adding a new component)
- DO NOT "fix" or "improve" files that weren't mentioned in the request
- DO NOT update multiple components when only one was requested
- DO NOT add features the user didn't ask for
- RESIST the urge to be "helpful" by updating related files

CRITICAL: DO NOT REDESIGN OR REIMAGINE COMPONENTS
- "update" means make a small change, NOT redesign the entire component
- "change X to Y" means ONLY change X to Y, nothing else
- "fix" means repair what's broken, NOT rewrite everything
- "remove X" means delete X from the existing file, NOT create a new file
- "delete X" means remove X from where it currently exists
- Preserve ALL existing functionality and design unless explicitly asked to change it

NEVER CREATE NEW FILES WHEN THE USER ASKS TO REMOVE/DELETE SOMETHING
If the user says "remove X", you must:
1. Find which existing file contains X
2. Edit that file to remove X
3. DO NOT create any new files

${editContext ? `
TARGETED EDIT MODE ACTIVE
- Edit Type: ${editContext.editIntent.type}
- Confidence: ${editContext.editIntent.confidence}
- Files to Edit: ${editContext.primaryFiles.join(', ')}

🚨 CRITICAL RULE - VIOLATION WILL RESULT IN FAILURE 🚨
YOU MUST ***ONLY*** GENERATE THE FILES LISTED ABOVE!

ABSOLUTE REQUIREMENTS:
1. COUNT the files in "Files to Edit" - that's EXACTLY how many files you must generate
2. If "Files to Edit" shows ONE file, generate ONLY that ONE file
3. DO NOT generate App.tsx unless it's EXPLICITLY listed in "Files to Edit"
4. DO NOT generate ANY components that aren't listed in "Files to Edit"
5. DO NOT "helpfully" update related files
6. DO NOT fix unrelated issues you notice
7. DO NOT improve code quality in files not being edited
8. DO NOT add bonus features

EXAMPLE VIOLATIONS (THESE ARE FAILURES):
❌ User says "update the hero" → You update Hero, Header, Footer, and App.tsx
❌ User says "change header color" → You redesign the entire header
❌ User says "fix the button" → You update multiple components
❌ Files to Edit shows "Hero.tsx" → You also generate App.tsx "to integrate it"
❌ Files to Edit shows "Header.tsx" → You also update Footer.tsx "for consistency"

CORRECT BEHAVIOR (THIS IS SUCCESS):
✅ User says "update the hero" → You ONLY edit Hero.tsx with the requested change
✅ User says "change header color" → You ONLY change the color in Header.tsx
✅ User says "fix the button" → You ONLY fix the specific button issue
✅ Files to Edit shows "Hero.tsx" → You generate ONLY Hero.tsx
✅ Files to Edit shows "Header.tsx, Nav.tsx" → You generate EXACTLY 2 files: Header.tsx and Nav.tsx

THE AI INTENT ANALYZER HAS ALREADY DETERMINED THE FILES.
DO NOT SECOND-GUESS IT.
DO NOT ADD MORE FILES.
ONLY OUTPUT THE EXACT FILES LISTED IN "Files to Edit".
` : ''}

VIOLATION OF THESE RULES WILL RESULT IN FAILURE!
` : ''}

CRITICAL INCREMENTAL UPDATE RULES:
- When the user asks for additions or modifications (like "add a videos page", "create a new component", "update the header"):
  - DO NOT regenerate the entire application
  - DO NOT recreate files that already exist unless explicitly asked
  - ONLY create/modify the specific files needed for the requested change
  - Preserve all existing functionality and files
  - If adding a new page/route, integrate it with the existing routing system
  - Reference existing components and styles rather than duplicating them
  - NEVER recreate config files (tailwind.config.js, vite.config.js, package.json, etc.)

IMPORTANT: When the user asks for edits or modifications:
- You have access to the current file contents in the context
- Make targeted changes to existing files rather than regenerating everything
- Preserve the existing structure and only modify what's requested
- If you need to see a specific file that's not in context, mention it

IMPORTANT: You have access to the full conversation context including:
- Components already generated and applied
- The current project being worked on
- Recent conversation history
- Any Vite errors that need to be resolved

When the user references "the app", "the website", or "the site" without specifics, refer to:
1. The files currently in the sandbox
2. The current project name in the context
3. The most recent conversation

CRITICAL UI/UX RULES:
- NEVER use emojis in any code, text, console logs, or UI elements
- ALWAYS ensure responsive design using proper Tailwind classes (sm:, md:, lg:, xl:)
- ALWAYS use proper mobile-first responsive design patterns
- NEVER hardcode pixel widths - use relative units and responsive classes
- ALWAYS test that the layout works on mobile devices (320px and up)
- ALWAYS make sections full-width by default - avoid max-w-7xl or similar constraints
- For full-width layouts: use className="w-full" or no width constraint at all
- Only add max-width constraints when explicitly needed for readability (like blog posts)
- Prefer system fonts and clean typography
- Ensure all interactive elements have proper hover/focus states
- Use proper semantic HTML elements for accessibility

CRITICAL STYLING RULES - MUST FOLLOW:
- NEVER use inline styles with style={{ }} in JSX
- NEVER use <style jsx> tags or any CSS-in-JS solutions
- NEVER create App.css, Component.css, or any component-specific CSS files
- NEVER import './App.css' or any CSS files except index.css
- ALWAYS use Tailwind CSS classes for ALL styling
- ONLY create src/index.css with the @tailwind directives
- The ONLY CSS file should be src/index.css with:
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
- Use Tailwind's full utility set: spacing, colors, typography, flexbox, grid, animations, etc.
- ALWAYS add smooth transitions and animations where appropriate:
  - Use transition-all, transition-colors, transition-opacity for hover states
  - Use animate-fade-in, animate-pulse, animate-bounce for engaging UI elements
  - Add hover:scale-105 or hover:scale-110 for interactive elements
  - Use transform and transition utilities for smooth interactions
- For complex layouts, combine Tailwind utilities rather than writing custom CSS
- NEVER use non-standard Tailwind classes like "border-border", "bg-background", "text-foreground", etc.
- Use standard Tailwind classes only:
  - For borders: use "border-gray-200", "border-gray-300", etc. NOT "border-border"
  - For backgrounds: use "bg-white", "bg-gray-100", etc. NOT "bg-background"
  - For text: use "text-gray-900", "text-black", etc. NOT "text-foreground"
- Examples of good Tailwind usage:
  - Buttons: className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
  - Cards: className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
  - Full-width sections: className="w-full px-4 sm:px-6 lg:px-8"
  - Constrained content (only when needed): className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  - Dark backgrounds: className="min-h-screen bg-gray-900 text-white"
  - Hero sections: className="animate-fade-in-up"
  - Feature cards: className="transform hover:scale-105 transition-transform duration-300"
  - CTAs: className="animate-pulse hover:animate-none"

CRITICAL STRING AND SYNTAX RULES:
- ALWAYS escape apostrophes in strings: use \' instead of ' or use double quotes
- ALWAYS escape quotes properly in JSX attributes
- NEVER use curly quotes or smart quotes ('' "" '' "") - only straight quotes (' ")
- ALWAYS convert smart/curly quotes to straight quotes:
  - ' and ' → '
  - " and " → "
  - Any other Unicode quotes → straight quotes
- When strings contain apostrophes, either:
  1. Use double quotes: "you're" instead of 'you're'
  2. Escape the apostrophe: 'you\'re'
- When working with scraped content, ALWAYS sanitize quotes first
- Replace all smart quotes with straight quotes before using in code
- Be extra careful with user-generated content or scraped text
- Always validate that JSX syntax is correct before generating

CRITICAL CODE SNIPPET DISPLAY RULES:
- When displaying code examples in JSX, NEVER put raw curly braces { } in text
- ALWAYS wrap code snippets in template literals with backticks
- For code examples in components, use one of these patterns:
  1. Template literals: <div>{\`const example = { key: 'value' }\`}</div>
  2. Pre/code blocks: <pre><code>{\`your code here\`}</code></pre>
  3. Escape braces: <div>{'{'}key: value{'}'}</div>
- NEVER do this: <div>const example = { key: 'value' }</div> (causes parse errors)
- For multi-line code snippets, always use:
  <pre className="bg-gray-900 text-gray-100 p-4 rounded">
    <code>{\`
      // Your code here
      const example = {
        key: 'value'
      }
    \`}</code>
  </pre>

CRITICAL: When asked to create a React app or components:
- ALWAYS CREATE ALL FILES IN FULL - never provide partial implementations
- ALWAYS CREATE EVERY COMPONENT that you import - no placeholders
- ALWAYS IMPLEMENT COMPLETE FUNCTIONALITY - don't leave TODOs unless explicitly asked
- If you're recreating a website, implement ALL sections and features completely
- NEVER create tailwind.config.js - it's already configured in the template
- ALWAYS include a Navigation/Header component (Nav.tsx or Header.tsx) - websites need navigation!

REQUIRED COMPONENTS for website clones (MINIMUM 6 files):
1. src/index.css - Styling foundation with Tailwind directives
2. Nav.tsx or Header.tsx - Navigation bar with links (NEVER SKIP THIS!)
3. Hero.tsx - Main landing section
4. Features/Services/Products sections - Based on the site content
5. Footer.tsx - Footer with links and info
6. App.tsx - Main component that imports and arranges all components
- For a complete landing page, expect to generate 8-12 files minimum
- NEVER create vite.config.js - it's already configured in the template
- NEVER create package.json - it's already configured in the template

STRING SANITIZATION RULES:
- ALWAYS sanitize all text content before using in code
- Convert ALL smart quotes to straight quotes
- Example transformations:
  - "App's API" → "App's API" or "App\\'s API"
  - 'It's amazing' → "It's amazing" or 'It\\'s amazing'
- When in doubt, use double quotes for strings containing apostrophes

When generating code, FOLLOW THIS PROCESS:
1. ALWAYS generate src/index.css FIRST - this establishes the styling foundation
2. List ALL components you plan to import in App.tsx
3. Count them - if there are 10 imports, you MUST create 10 component files
4. Generate src/index.css first (with proper CSS reset and base styles)
5. Generate App.tsx second
6. Then generate EVERY SINGLE component file you imported
7. Do NOT stop until all imports are satisfied

Use this XML format for React components only (DO NOT create tailwind.config.js - it already exists):

<file path="src/index.css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</file>

<file path="src/App.tsx">
// Main App component that imports and uses other components
// Use Tailwind classes: className="min-h-screen bg-gray-50"
</file>

<file path="src/components/Example.tsx">
// Your React component code here
// Use Tailwind classes for ALL styling
</file>

CRITICAL COMPLETION RULES:
1. NEVER say "I'll continue with the remaining components"
2. NEVER say "Would you like me to proceed?"
3. NEVER use <continue> tags
4. Generate ALL components in ONE response
5. If App.tsx imports 10 components, generate ALL 10
6. Complete EVERYTHING before ending your response
7. MINIMUM 6 files per initial build (index.css + 5 components)
8. For landing pages, expect 8-12 files minimum

With 16,000 tokens available, you have plenty of space to generate a complete application. Use it!

UNDERSTANDING USER INTENT FOR INCREMENTAL VS FULL GENERATION:
- "add/create/make a [specific feature]" → Add ONLY that feature to existing app
- "add a videos page" → Create ONLY Videos.tsx and update routing
- "update the header" → Modify ONLY header component
- "fix the styling" → Update ONLY the affected components
- "change X to Y" → Find the file containing X and modify it
- "make the header black" → Find Header component and change its color
- "rebuild/recreate/start over" → Full regeneration
- Default to incremental updates when working on an existing app

SURGICAL EDIT RULES (CRITICAL FOR PERFORMANCE):
- **PREFER TARGETED CHANGES**: Don't regenerate entire components for small edits
- For color/style changes: Edit ONLY the specific className or style prop
- For text changes: Change ONLY the text content, keep everything else
- For adding elements: INSERT into existing JSX, don't rewrite the whole return
- **PRESERVE EXISTING CODE**: Keep all imports, functions, and unrelated code exactly as-is
- Maximum files to edit:
  - Style change = 1 file ONLY
  - Text change = 1 file ONLY
  - New feature = 2 files MAX (feature + parent)
- If you're editing >3 files for a simple request, STOP - you're doing too much

EXAMPLES OF CORRECT SURGICAL EDITS:
✅ "change header to black" → Find className="..." in Header.tsx, change ONLY color classes
✅ "update hero text" → Find the <h1> or <p> in Hero.tsx, change ONLY the text inside
✅ "add a button to hero" → Find the return statement, ADD button, keep everything else
❌ WRONG: Regenerating entire Header.tsx to change one color
❌ WRONG: Rewriting Hero.tsx to add one button

NAVIGATION/HEADER INTELLIGENCE:
- ALWAYS check App.tsx imports first
- Navigation is usually INSIDE Header.tsx, not separate
- If user says "nav", check Header.tsx FIRST
- Only create Nav.tsx if no navigation exists anywhere
- Logo, menu, hamburger = all typically in Header

CRITICAL: When files are provided in the context:
1. The user is asking you to MODIFY the existing app, not create a new one
2. Find the relevant file(s) from the provided context
3. Generate ONLY the files that need changes
4. Do NOT ask to see files - they are already provided in the context above
5. Make the requested change immediately`;

        // If Morph Fast Apply is enabled (edit mode + MORPH_API_KEY), force <edit> block output
        const morphFastApplyEnabled = Boolean(isEdit && process.env.MORPH_API_KEY);
        if (morphFastApplyEnabled) {
          systemPrompt += `

MORPH FAST APPLY MODE (EDIT-ONLY):
- Output edits as <edit> blocks, not full <file> blocks, for files that already exist.
- Format for each edit:
  <edit target_file="src/components/Header.tsx">
    <instructions>Describe the minimal change, single sentence.</instructions>
    <update>Provide the SMALLEST code snippet necessary to perform the change.</update>
  </edit>
- Only use <file> blocks when you must CREATE a brand-new file.
- Prefer ONE edit block for a simple change; multiple edits only if absolutely needed for separate files.
- Keep updates minimal and precise; do not rewrite entire files.
`;
        }

        // Multi-task detection: check if prompt contains multiple distinct tasks
        const multiTaskIndicators = [
          /^\d+[\.\)]\s+/m,           // numbered list: "1. do x\n2. do y"
          /^[-*]\s+/m,                 // bullet list: "- do x\n- do y"
          /\b(?:also|additionally|furthermore|moreover)\s+(?:add|create|fix|change|update|implement|build|make)\b/i,
          /\b(?:and\s+then|then\s+)\s*(?:add|create|fix|change|update|implement|build|make)\b/i,
          /(?:\b(?:add|create|fix|change|update|implement|build|make)\b\s+(?:a|an|the)\s+\w+){2,}/i,
        ];
        const isMultiTask = multiTaskIndicators.some(r => r.test(prompt));
        const processedPrompt = isMultiTask
          ? `[MULTI-TASK REQUEST DETECTED]\n${prompt}\n\nYou must detect the individual tasks, create a TODO list, and complete each one in order. Use the "--- Task N: ... ---" separator between tasks.`
          : prompt;

        // Build full prompt with context
        let fullPrompt = processedPrompt;
        if (context) {
          const contextParts = [];
          
          if (context.sandboxId) {
            contextParts.push(`Current sandbox ID: ${context.sandboxId}`);
          }
          
          if (context.structure) {
            contextParts.push(`Current file structure:\n${context.structure}`);
          }
          
          // Use backend file cache instead of frontend-provided files
          let backendFiles = global.sandboxState?.fileCache?.files || {};
          let hasBackendFiles = Object.keys(backendFiles).length > 0;
          
          console.log('[generate-ai-code-stream] Backend file cache status:');
          console.log('[generate-ai-code-stream] - Has sandboxState:', !!global.sandboxState);
          console.log('[generate-ai-code-stream] - Has fileCache:', !!global.sandboxState?.fileCache);
          console.log('[generate-ai-code-stream] - File count:', Object.keys(backendFiles).length);
          console.log('[generate-ai-code-stream] - Has manifest:', !!global.sandboxState?.fileCache?.manifest);
          
          // If no backend files and we're in edit mode, try to fetch from sandbox
          if (!hasBackendFiles && isEdit && (global.activeSandbox || context?.sandboxId)) {
            console.log('[generate-ai-code-stream] No backend files, attempting to fetch from sandbox...');
            
            try {
              const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/get-sandbox-files`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (filesResponse.ok) {
                const filesData = await filesResponse.json();
                if (filesData.success && filesData.files) {
                  console.log('[generate-ai-code-stream] Successfully fetched', Object.keys(filesData.files).length, 'files from sandbox');
                  
                  // Initialize sandboxState if needed
                  if (!global.sandboxState) {
                    global.sandboxState = {
                      fileCache: {
                        files: {},
                        lastSync: Date.now(),
                        sandboxId: context?.sandboxId || 'unknown'
                      }
                    } as any;
                  } else if (!global.sandboxState.fileCache) {
                    global.sandboxState.fileCache = {
                      files: {},
                      lastSync: Date.now(),
                      sandboxId: context?.sandboxId || 'unknown'
                    };
                  }
                  
                  // Store files in cache
                  for (const [path, content] of Object.entries(filesData.files)) {
                    const normalizedPath = path.replace('/home/user/app/', '');
                    if (global.sandboxState.fileCache) {
                      global.sandboxState.fileCache.files[normalizedPath] = {
                        content: content as string,
                        lastModified: Date.now()
                      };
                    }
                  }
                  
                  if (filesData.manifest && global.sandboxState.fileCache) {
                    global.sandboxState.fileCache.manifest = filesData.manifest;
                    
                    // Now try to analyze edit intent with the fetched manifest
                    if (!editContext) {
                      console.log('[generate-ai-code-stream] Analyzing edit intent with fetched manifest');
                      try {
                        const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-edit-intent`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt, manifest: filesData.manifest, model })
                        });
                        
                        if (intentResponse.ok) {
                          const { searchPlan } = await intentResponse.json();
                          console.log('[generate-ai-code-stream] Search plan received:', searchPlan);
                          
                          // Create edit context from AI analysis
                          // Note: We can't execute search here without file contents, so fall back to keyword method
                          const fileContext = selectFilesForEdit(prompt, filesData.manifest);
                          editContext = fileContext;
                          enhancedSystemPrompt = fileContext.systemPrompt;
                          
                          console.log('[generate-ai-code-stream] Edit context created with', editContext.primaryFiles.length, 'primary files');
                        }
                      } catch (error) {
                        console.error('[generate-ai-code-stream] Failed to analyze edit intent:', error);
                      }
                    }
                  }
                  
                  // Update variables
                  backendFiles = global.sandboxState.fileCache?.files || {};
                  hasBackendFiles = Object.keys(backendFiles).length > 0;
                  console.log('[generate-ai-code-stream] Updated backend cache with fetched files');
                }
              }
            } catch (error) {
              console.error('[generate-ai-code-stream] Failed to fetch sandbox files:', error);
            }
          }
          
          // Include current file contents from backend cache
          if (hasBackendFiles) {
            // If we have edit context, use intelligent file selection
            if (editContext && editContext.primaryFiles.length > 0) {
              contextParts.push('\nEXISTING APPLICATION - TARGETED EDIT MODE');
              contextParts.push(`\n${editContext.systemPrompt || enhancedSystemPrompt}\n`);
              
              // Get contents of primary and context files
              const primaryFileContents = await getFileContents(editContext.primaryFiles, global.sandboxState!.fileCache!.manifest!);
              const contextFileContents = await getFileContents(editContext.contextFiles, global.sandboxState!.fileCache!.manifest!);
              
              // Format files for AI
              const formattedFiles = formatFilesForAI(primaryFileContents, contextFileContents);
              contextParts.push(formattedFiles);
              
              contextParts.push('\nIMPORTANT: Only modify the files listed under "Files to Edit". The context files are provided for reference only.');
            } else {
              // Fallback to showing all files if no edit context
              console.log('[generate-ai-code-stream] WARNING: Using fallback mode - no edit context available');
              contextParts.push('\nEXISTING APPLICATION - TARGETED EDIT REQUIRED');
              contextParts.push('\nYou MUST analyze the user request and determine which specific file(s) to edit.');
              contextParts.push('\nCurrent project files (DO NOT regenerate all of these):');
              
              const fileEntries = Object.entries(backendFiles);
              console.log(`[generate-ai-code-stream] Using backend cache: ${fileEntries.length} files`);
              
              // Show file list first for reference
              contextParts.push('\n### File List:');
              for (const [path] of fileEntries) {
                contextParts.push(`- ${path}`);
              }
              
              // Include ALL files as context in fallback mode
              contextParts.push('\n### File Contents (ALL FILES FOR CONTEXT):');
              for (const [path, fileData] of fileEntries) {
                const content = fileData.content;
                if (typeof content === 'string') {
                  contextParts.push(`\n<file path="${path}">\n${content}\n</file>`);
                }
              }
              
              contextParts.push('\n🚨 CRITICAL INSTRUCTIONS - VIOLATION = FAILURE 🚨');
              contextParts.push('1. Analyze the user request: "' + prompt + '"');
              contextParts.push('2. Identify the MINIMUM number of files that need editing (usually just ONE)');
              contextParts.push('3. PRESERVE ALL EXISTING CONTENT in those files');
              contextParts.push('4. ONLY ADD/MODIFY the specific part requested');
              contextParts.push('5. DO NOT regenerate entire components from scratch');
              contextParts.push('6. DO NOT change unrelated parts of any file');
              contextParts.push('7. Generate ONLY the files that MUST be changed - NO EXTRAS');
              contextParts.push('\n⚠️ FILE COUNT RULE:');
              contextParts.push('- Simple change (color, text, spacing) = 1 file ONLY');
              contextParts.push('- Adding new component = 2 files MAX (new component + parent that imports it)');
              contextParts.push('- DO NOT exceed these limits unless absolutely necessary');
              contextParts.push('\nEXAMPLES OF CORRECT BEHAVIOR:');
              contextParts.push('✅ "add a chart to the hero" → Edit ONLY Hero.tsx, ADD the chart, KEEP everything else');
              contextParts.push('✅ "change header to black" → Edit ONLY Header.tsx, change ONLY the color');
              contextParts.push('✅ "fix spacing in footer" → Edit ONLY Footer.tsx, adjust ONLY spacing');
              contextParts.push('\nEXAMPLES OF FAILURES:');
              contextParts.push('❌ "change header color" → You edit Header, Footer, and App "for consistency"');
              contextParts.push('❌ "add chart to hero" → You regenerate the entire Hero component');
              contextParts.push('❌ "fix button" → You update 5 different component files');
              contextParts.push('\n⚠️ FINAL WARNING:');
              contextParts.push('If you generate MORE files than necessary, you have FAILED');
              contextParts.push('If you DELETE or REWRITE existing functionality, you have FAILED');
              contextParts.push('ONLY change what was EXPLICITLY requested - NOTHING MORE');
            }
          } else if (context.currentFiles && Object.keys(context.currentFiles).length > 0) {
            // Fallback to frontend-provided files if backend cache is empty
            console.log('[generate-ai-code-stream] Warning: Backend cache empty, using frontend files');
            contextParts.push('\nEXISTING APPLICATION - DO NOT REGENERATE FROM SCRATCH');
            contextParts.push('Current project files (modify these, do not recreate):');
            
            const fileEntries = Object.entries(context.currentFiles);
            for (const [path, content] of fileEntries) {
              if (typeof content === 'string') {
                contextParts.push(`\n<file path="${path}">\n${content}\n</file>`);
              }
            }
            contextParts.push('\nThe above files already exist. When the user asks to modify something (like "change the header color to black"), find the relevant file above and generate ONLY that file with the requested changes.');
          }
          
          // Add explicit edit mode indicator
          if (isEdit) {
            contextParts.push('\nEDIT MODE ACTIVE');
            contextParts.push('This is an incremental update to an existing application.');
            contextParts.push('DO NOT regenerate App.tsx, index.css, or other core files unless explicitly requested.');
            contextParts.push('ONLY create or modify the specific files needed for the user\'s request.');
            contextParts.push('\n⚠️ CRITICAL FILE OUTPUT FORMAT - VIOLATION = FAILURE:');
            contextParts.push('YOU MUST OUTPUT EVERY FILE IN THIS EXACT XML FORMAT:');
            contextParts.push('<file path="src/components/ComponentName.tsx">');
            contextParts.push('// Complete file content here');
            contextParts.push('</file>');
            contextParts.push('<file path="src/index.css">');
            contextParts.push('/* CSS content here */');
            contextParts.push('</file>');
            contextParts.push('\n❌ NEVER OUTPUT: "Generated Files: index.css, App.tsx"');
            contextParts.push('❌ NEVER LIST FILE NAMES WITHOUT CONTENT');
            contextParts.push('✅ ALWAYS: One <file> tag per file with COMPLETE content');
            contextParts.push('✅ ALWAYS: Include EVERY file you modified');
          } else if (!hasBackendFiles) {
            // First generation mode - make it beautiful!
            contextParts.push('\n🎨 FIRST GENERATION MODE - CREATE SOMETHING BEAUTIFUL!');
            contextParts.push('\nThis is the user\'s FIRST experience. Make it impressive:');
            contextParts.push('1. **USE TAILWIND PROPERLY** - Use standard Tailwind color classes');
            contextParts.push('2. **NO PLACEHOLDERS** - Use real content, not lorem ipsum');
            contextParts.push('3. **COMPLETE COMPONENTS** - Header, Hero, Features, Footer minimum');
            contextParts.push('4. **VISUAL POLISH** - Shadows, hover states, transitions');
            contextParts.push('5. **STANDARD CLASSES** - bg-white, text-gray-900, bg-blue-500, NOT bg-background');
            contextParts.push('\nCreate a polished, professional application that works perfectly on first load.');
            contextParts.push('\n⚠️ OUTPUT FORMAT:');
            contextParts.push('Use <file path="...">content</file> tags for EVERY file');
            contextParts.push('NEVER output "Generated Files:" as plain text');
          }
          
          // Add conversation context (scraped websites, etc)
          if (context.conversationContext) {
            if (context.conversationContext.scrapedWebsites?.length > 0) {
              contextParts.push('\nScraped Websites in Context:');
              context.conversationContext.scrapedWebsites.forEach((site: any) => {
                contextParts.push(`\nURL: ${site.url}`);
                contextParts.push(`Scraped: ${new Date(site.timestamp).toLocaleString()}`);
                if (site.content) {
                  // Include a summary of the scraped content
                  const contentPreview = typeof site.content === 'string' 
                    ? site.content.substring(0, 1000) 
                    : JSON.stringify(site.content).substring(0, 1000);
                  contextParts.push(`Content Preview: ${contentPreview}...`);
                }
              });
            }
            
            if (context.conversationContext.currentProject) {
              contextParts.push(`\nCurrent Project: ${context.conversationContext.currentProject}`);
            }
          }
          
          // Add dependency map (component graph summary)
          const manifest: FileManifest | undefined = global.sandboxState?.fileCache?.manifest;
          if (manifest?.componentTree) {
            const tree = manifest.componentTree;
            const entries = Object.entries(tree);
            contextParts.push('\n📊 CURRENT DEPENDENCY MAP (component graph):');
            contextParts.push(`Total files in graph: ${entries.length}`);
            for (const [name, entry] of entries.slice(0, 30)) {
              const deps = entry.imports || [];
              const dependents = entries.filter(([, e]) => e.imports?.includes(name)).length;
              contextParts.push(`  ${name} → imports: [${deps.slice(0, 5).join(', ')}${deps.length > 5 ? ', ...' : ''}], used by: ${dependents} file(s)`);
            }
            contextParts.push('Use the dependency map above to understand how components relate. When editing, check for dependent files that may need updates.');
          }
          
          if (contextParts.length > 0) {
            if (morphFastApplyEnabled) {
              contextParts.push('\nOUTPUT FORMAT (REQUIRED IN MORPH MODE):');
              contextParts.push('<edit target_file="src/components/Component.tsx">');
              contextParts.push('<instructions>Minimal, precise instruction.</instructions>');
              contextParts.push('<update>// Smallest necessary snippet</update>');
              contextParts.push('</edit>');
              contextParts.push('\nIf you need to create a NEW file, then and only then output a full file:');
              contextParts.push('<file path="src/components/NewComponent.tsx">');
              contextParts.push('// Full file content when creating new files');
              contextParts.push('</file>');
            }
            fullPrompt = `CONTEXT:\n${contextParts.join('\n')}\n\nUSER REQUEST:\n${processedPrompt}`;
          }
        }
        
        await sendProgress({ type: 'status', message: 'Planning application structure...' });
        
        console.log('\n[generate-ai-code-stream] Starting streaming response...\n');
        
        // Track packages that need to be installed
        const packagesToInstall: string[] = [];
        
        // Determine which provider to use based on model
        const isAnthropic = model.startsWith('anthropic/');
        const isGoogle = model.startsWith('google/');
        const isOpenAI = model.startsWith('openai/');
        const isKimiGroq = model === 'moonshotai/kimi-k2-instruct-0905';
        const modelProvider = isAnthropic ? anthropic : 
                              (isOpenAI ? openai : 
                              (isGoogle ? googleGenerativeAI : 
                              (isKimiGroq ? groq : groq)));
        
        // Fix model name transformation for different providers
        let actualModel: string;
        if (isAnthropic) {
          actualModel = model.replace('anthropic/', '');
        } else if (isOpenAI) {
          actualModel = model.replace('openai/', '');
        } else if (isKimiGroq) {
          // Kimi on Groq - use full model string
          actualModel = 'moonshotai/kimi-k2-instruct-0905';
        } else if (isGoogle) {
          // Google uses specific model names - convert our naming to theirs  
          actualModel = model.replace('google/', '');
        } else {
          actualModel = model;
        }

        console.log(`[generate-ai-code-stream] Using provider: ${isAnthropic ? 'Anthropic' : isGoogle ? 'Google' : isOpenAI ? 'OpenAI' : 'Groq'}, model: ${actualModel}`);
        console.log(`[generate-ai-code-stream] AI Gateway enabled: ${isUsingAIGateway}`);
        console.log(`[generate-ai-code-stream] Model string: ${model}`);

        // === MULTI-TASK DECOMPOSITION ===
        // If the prompt contains multiple tasks, decompose into a task list
        // and restructure the prompt so the AI executes them sequentially.
        if (isMultiTask) {
          try {
            await sendProgress({ type: 'status', message: 'Analyzing request and creating task plan...' });
            
            const decomposeResult = await generateText({
              model: modelProvider(actualModel),
              messages: [
                {
                  role: 'system',
                  content: 'You are a task decomposition assistant. Analyze the user request and identify each distinct task. Output each task on a separate line starting with "TASK:". Be specific but concise. If it is a single task, output only "SINGLE_TASK". Do NOT output anything else.'
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.1,
            });
            
            const decomposeText = decomposeResult.text.trim();
            if (decomposeText.includes('SINGLE_TASK')) {
              console.log('[generate-ai-code-stream] Decomposition: single task detected');
            } else {
              const taskLines = decomposeText.split('\n')
                .map(l => l.replace(/^TASK:\s*/i, '').trim())
                .filter(Boolean);
              
              if (taskLines.length > 1) {
                console.log(`[generate-ai-code-stream] Decomposed into ${taskLines.length} tasks:`, taskLines);
                
                await sendProgress({ 
                  type: 'task-plan', 
                  tasks: taskLines,
                  count: taskLines.length
                });
                
                const taskPlanText = taskLines.map((t, i) => `${i + 1}. ${t}`).join('\n');
                fullPrompt = `TASK PLAN (execute in order):\n${taskPlanText}\n\n---\n\n${fullPrompt}\n\nCRITICAL: You MUST complete ALL tasks above in order. Start each task with "--- Task N: [name] ---" as a header. Complete one task fully before moving to the next.`;
                
                await sendProgress({ type: 'status', message: `Executing ${taskLines.length} tasks sequentially...` });
              } else {
                console.log('[generate-ai-code-stream] Decomposition: single task from parse');
              }
            }
          } catch (decomposeError) {
            console.error('[generate-ai-code-stream] Decomposition failed (non-fatal):', decomposeError);
          }
        }

        // === PEXELS IMAGE/VIDEO INTEGRATION ===
        // Search for relevant real images/videos based on user prompt
        // and inject them into the prompt so the AI uses real media URLs
        const pexelsKey = process.env.PEXELS_API_KEY;
        if (pexelsKey) {
          try {
            const imageQueries = extractImageQueries(prompt);
            if (imageQueries.length > 0) {
              await sendProgress({ type: 'status', message: 'Fetching relevant images from Pexels...' });
              
              const allAssets: PexelsAsset[] = [];
              for (const query of imageQueries.slice(0, 3)) {
                const images = await searchImages(query, 3);
                allAssets.push(...images);
                if (imageQueries.length <= 2) {
                  const videos = await searchVideos(query, 1);
                  allAssets.push(...videos);
                }
              }
              
              if (allAssets.length > 0) {
                const pexelsBlock = formatAssetsForPrompt(allAssets.slice(0, 10), 'REAL IMAGES/VIDEOS FROM PEXELS');
                fullPrompt += `\n\n${pexelsBlock}`;
                console.log(`[generate-ai-code-stream] Injected ${allAssets.length} Pexels assets into prompt`);
              }
            }
          } catch (pexelsError) {
            console.error('[generate-ai-code-stream] Pexels search failed (non-fatal):', pexelsError);
          }
        }

        // Make streaming API call with appropriate provider
        const streamOptions: any = {
          model: modelProvider(actualModel),
          messages: [
            { 
              role: 'system', 
              content: systemPrompt + `

🚨 CRITICAL CODE GENERATION RULES - VIOLATION = FAILURE 🚨:
1. NEVER truncate ANY code - ALWAYS write COMPLETE files
2. NEVER use "..." anywhere in your code - this causes syntax errors
3. NEVER cut off strings mid-sentence - COMPLETE every string
4. NEVER leave incomplete class names or attributes
5. ALWAYS close ALL tags, quotes, brackets, and parentheses
6. If you run out of space, prioritize completing the current file

CRITICAL STRING RULES TO PREVENT SYNTAX ERRORS:
- NEVER write: className="px-8 py-4 bg-black text-white font-bold neobrut-border neobr...
- ALWAYS write: className="px-8 py-4 bg-black text-white font-bold neobrut-border neobrut-shadow"
- COMPLETE every className attribute
- COMPLETE every string literal
- NO ellipsis (...) ANYWHERE in code

PACKAGE RULES:
- For INITIAL generation: Use ONLY React, no external packages
- For EDITS: You may use packages, specify them with <package> tags
- NEVER install packages like @mendable/firecrawl-js unless explicitly requested

Examples of SYNTAX ERRORS (NEVER DO THIS):
❌ className="px-4 py-2 bg-blue-600 hover:bg-blue-7...
❌ <button className="btn btn-primary btn-...
❌ const title = "Welcome to our...
❌ import { useState, useEffect, ... } from 'react'

Examples of CORRECT CODE (ALWAYS DO THIS):
✅ className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
✅ <button className="btn btn-primary btn-large">
✅ const title = "Welcome to our application"
✅ import { useState, useEffect, useCallback } from 'react'

REMEMBER: Generate EVERY file completely. Do not stop early or skip components.`
            },
            { 
              role: 'user', 
              content: fullPrompt + `

CRITICAL: You MUST complete EVERY file you start. If you write:
<file path="src/components/Hero.tsx">

You MUST include the closing </file> tag and ALL the code in between.

NEVER write partial code like:
<h1>Build and deploy on the AI Cloud.</h1>
<p>Some text...</p>  ❌ WRONG

ALWAYS write complete code:
<h1>Build and deploy on the AI Cloud.</h1>
<p>Some text here with full content</p>  ✅ CORRECT

Generate ALL requested files completely - you have enough output budget.
Do NOT stop early or skip files. Complete EVERY component before finishing.`
            }
          ],
          maxTokens: 16384, // Allow room for complete multi-file generation
          stopSequences: [], // Don't stop early
          tools: aiTools,
          maxSteps: 5,
        };
        
        // Add temperature for non-reasoning models
        if (!model.startsWith('openai/gpt-5')) {
          streamOptions.temperature = 0.7;
        }
        
        // Add reasoning effort for GPT-5 models
        if (isOpenAI) {
          streamOptions.experimental_providerMetadata = {
            openai: {
              reasoningEffort: 'high'
            }
          };
        }
        
        let result;
        let retryCount = 0;
        const maxRetries = 2;
        const TIMEOUT_MS = 30000; // 30s timeout per attempt
        
        await sendProgress({ type: 'info', message: 'Starting generation (may take a few seconds)...' });
        
        while (retryCount <= maxRetries) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
            streamOptions.abortSignal = controller.signal;
            
            if (retryCount > 0) {
              await sendProgress({
                type: 'info',
                message: `${retryCount === 1 ? 'First attempt timed out, trying faster model...' : 'Retrying with different model...'}`
              });
            }
            
            console.log(`[generate-ai-code-stream] Calling streamText (attempt ${retryCount + 1}) with ${actualModel}`);
            result = await streamText(streamOptions);
            clearTimeout(timeoutId);
            break; // Success, exit retry loop
          } catch (streamError: any) {
            console.error(`[generate-ai-code-stream] Error (attempt ${retryCount + 1}):`, streamError.message || streamError);
            
            const isTimeout = streamError.name === 'AbortError' || 
                             streamError.message?.includes('abort') ||
                             streamError.message?.includes('timeout') ||
                             streamError.message?.includes('timed out');
            const isServiceError = streamError.message?.includes('503') ||
                                  streamError.message?.includes('500') ||
                                  streamError.message?.includes('Service unavailable') ||
                                  streamError.message?.includes('Unavailable') ||
                                  streamError.message?.includes('Internal') ||
                                  streamError.message?.includes('rate limit');
            
            const shouldRetry = retryCount < maxRetries && (isTimeout || isServiceError);
            
            if (shouldRetry) {
              retryCount++;
              
              // Fallback to a faster/reliable model
              await sendProgress({
                type: 'info',
                message: `Switching to faster model (${retryCount === 1 ? 'gemini-2.0-flash' : 'gpt-4o-mini'})...`
              });
              
              if (retryCount === 1) {
                console.log('[generate-ai-code-stream] Falling back to gemini-2.0-flash');
                streamOptions.model = googleGenerativeAI('gemini-2.0-flash');
                actualModel = 'gemini-2.0-flash';
              } else {
                console.log('[generate-ai-code-stream] Falling back to gpt-4o-mini');
                streamOptions.model = openai('gpt-4o-mini');
                actualModel = 'gpt-4o-mini';
              }
              
              // Ensure clean state for next attempt (remove old abort signal)
              delete streamOptions.abortSignal;
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              // Final error
              await sendProgress({ 
                type: 'error', 
                message: `Generation failed after ${retryCount + 1} attempts: ${streamError.message || 'Unknown error'}` 
              });
              
              if (isGoogle) {
                await sendProgress({ 
                  type: 'info', 
                  message: 'Tip: Make sure your GEMINI_API_KEY is set correctly.' 
                });
              }
              
              throw streamError;
            }
          }
        }
        
        // Stream the response and parse in real-time
        let generatedCode = '';
        let currentFile = '';
        let currentFilePath = '';
        let componentCount = 0;
        let isInFile = false;
        let isInTag = false;
        let conversationalBuffer = '';
        
        // Buffer for incomplete tags
        let tagBuffer = '';
        
        // Stream the response and parse for packages in real-time
        for await (const textPart of result?.textStream || []) {
          const text = textPart || '';
          generatedCode += text;
          currentFile += text;
          
          // Combine with buffer for tag detection
          const searchText = tagBuffer + text;
          
          // Log streaming chunks to console
          process.stdout.write(text);
          
          // Check if we're entering or leaving a tag
          const hasOpenTag = /<(file|package|packages|explanation|command|structure|template)\b/.test(text);
          const hasCloseTag = /<\/(file|package|packages|explanation|command|structure|template)>/.test(text);
          
          if (hasOpenTag) {
            // Send any buffered conversational text before the tag
            if (conversationalBuffer.trim() && !isInTag) {
              await sendProgress({ 
                type: 'conversation', 
                text: conversationalBuffer.trim()
              });
              conversationalBuffer = '';
            }
            isInTag = true;
          }
          
          if (hasCloseTag) {
            isInTag = false;
          }
          
          // If we're not in a tag, buffer as conversational text
          if (!isInTag && !hasOpenTag) {
            conversationalBuffer += text;
          }
          
          // Stream the raw text for live preview
          await sendProgress({ 
            type: 'stream', 
            text: text,
            raw: true 
          });
          
          // Debug: Log every 100 characters streamed
          if (generatedCode.length % 100 < text.length) {
            console.log(`[generate-ai-code-stream] Streamed ${generatedCode.length} chars`);
          }
          
          // Check for package tags in buffered text (ONLY for edits, not initial generation)
          let lastIndex = 0;
          if (isEdit) {
            const packageRegex = /<package>([^<]+)<\/package>/g;
            let packageMatch;
            
            while ((packageMatch = packageRegex.exec(searchText)) !== null) {
              const packageName = packageMatch[1].trim();
              if (packageName && !packagesToInstall.includes(packageName)) {
                packagesToInstall.push(packageName);
                console.log(`[generate-ai-code-stream] Package detected: ${packageName}`);
                await sendProgress({ 
                  type: 'package', 
                  name: packageName,
                  message: `Package detected: ${packageName}`
                });
              }
              lastIndex = packageMatch.index + packageMatch[0].length;
            }
          }
          
          // Keep unmatched portion in buffer for next iteration
          tagBuffer = searchText.substring(Math.max(0, lastIndex - 50)); // Keep last 50 chars
          
          // Check for file boundaries
          if (text.includes('<file path="')) {
            const pathMatch = text.match(/<file path="([^"]+)"/);
            if (pathMatch) {
              currentFilePath = pathMatch[1];
              isInFile = true;
              currentFile = text;
            }
          }
          
          // Check for file end
          if (isInFile && currentFile.includes('</file>')) {
            isInFile = false;
            
            // Send component progress update
            if (currentFilePath.includes('components/')) {
              componentCount++;
              const componentName = currentFilePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || 'Component';
              await sendProgress({ 
                type: 'component', 
                name: componentName,
                path: currentFilePath,
                index: componentCount
              });
            } else if (currentFilePath.includes('App.tsx')) {
              await sendProgress({ 
                type: 'app', 
                message: 'Generated main App.tsx',
                path: currentFilePath
              });
            }
            
            currentFile = '';
            currentFilePath = '';
          }
        }
        
        console.log('\n\n[generate-ai-code-stream] Streaming complete.');
        
        // Send any remaining conversational text
        if (conversationalBuffer.trim()) {
          await sendProgress({ 
            type: 'conversation', 
            text: conversationalBuffer.trim()
          });
        }
        
        // Also parse <packages> tag for multiple packages - ONLY for edits
        if (isEdit) {
          const packagesRegex = /<packages>([\s\S]*?)<\/packages>/g;
          let packagesMatch;
          while ((packagesMatch = packagesRegex.exec(generatedCode)) !== null) {
            const packagesContent = packagesMatch[1].trim();
            const packagesList = packagesContent.split(/[\n,]+/)
              .map(pkg => pkg.trim())
              .filter(pkg => pkg.length > 0);
            
            for (const packageName of packagesList) {
              if (!packagesToInstall.includes(packageName)) {
                packagesToInstall.push(packageName);
                console.log(`[generate-ai-code-stream] Package from <packages> tag: ${packageName}`);
                await sendProgress({ 
                  type: 'package', 
                  name: packageName,
                  message: `Package detected: ${packageName}`
                });
              }
            }
          }
        }
        
        // Function to extract packages from import statements
        function extractPackagesFromCode(content: string): string[] {
          const packages: string[] = [];
          // Match ES6 imports
          const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
          let importMatch;
          
          while ((importMatch = importRegex.exec(content)) !== null) {
            const importPath = importMatch[1];
            // Skip relative imports and built-in React
            if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
                importPath !== 'react' && importPath !== 'react-dom' &&
                !importPath.startsWith('@/')) {
              // Extract package name (handle scoped packages like @heroicons/react)
              const packageName = importPath.startsWith('@') 
                ? importPath.split('/').slice(0, 2).join('/')
                : importPath.split('/')[0];
              
              if (!packages.includes(packageName)) {
                packages.push(packageName);
              }
            }
          }
          
          return packages;
        }
        
        // Parse files and send progress for each
        const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
        const files = [];
        let match;
        
        while ((match = fileRegex.exec(generatedCode)) !== null) {
          const filePath = match[1];
          const content = match[2].trim();
          files.push({ path: filePath, content });
          
          // Extract packages from file content - ONLY for edits
          if (isEdit) {
            const filePackages = extractPackagesFromCode(content);
            for (const pkg of filePackages) {
              if (!packagesToInstall.includes(pkg)) {
                packagesToInstall.push(pkg);
                console.log(`[generate-ai-code-stream] Package detected from imports: ${pkg}`);
                await sendProgress({ 
                  type: 'package', 
                  name: pkg,
                  message: `Package detected from imports: ${pkg}`
                });
              }
            }
          }
          
          // Send progress for each file (reusing componentCount from streaming)
          if (filePath.includes('components/')) {
            const componentName = filePath.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') || 'Component';
            await sendProgress({ 
              type: 'component', 
              name: componentName,
              path: filePath,
              index: componentCount
            });
          } else if (filePath.includes('App.tsx')) {
            await sendProgress({ 
              type: 'app', 
              message: 'Generated main App.tsx',
              path: filePath
            });
          }
        }
        
        // Build file manifest for graph data
        if (files.length > 0) {
          try {
            const fileManifest: FileManifest = {
              files: {},
              routes: [],
              componentTree: {},
              entryPoint: '',
              styleFiles: [],
              timestamp: Date.now(),
            };

            for (const { path: filePath, content } of files) {
              const relativePath = filePath.replace(/^src\//, '');
              const fullPath = `/${filePath}`;

              const fileInfo: FileInfo = {
                content,
                type: 'utility',
                path: fullPath,
                relativePath,
                lastModified: Date.now(),
              };

              if (relativePath.match(/\.(jsx?|tsx?)$/)) {
                const parseResult = parseJavaScriptFile(content, fullPath);
                Object.assign(fileInfo, parseResult);

                if (relativePath.match(/^(src\/)?App\.(jsx?|tsx?)$/)) {
                  fileManifest.entryPoint = fileManifest.entryPoint || fullPath;
                }
              }

              if (relativePath.endsWith('.css')) {
                fileManifest.styleFiles.push(fullPath);
                fileInfo.type = 'style';
              }

              fileManifest.files[fullPath] = fileInfo;
            }

            fileManifest.componentTree = buildComponentTree(fileManifest.files);

            if (!global.sandboxState) {
              global.sandboxState = { fileCache: null, sandbox: null, sandboxData: null };
            }
            if (!global.sandboxState.fileCache) {
              global.sandboxState.fileCache = {
                files: {},
                lastSync: Date.now(),
                sandboxId: context?.sandboxId || 'unknown',
              };
            }
            global.sandboxState.fileCache.manifest = fileManifest;
            console.log(`[generate-ai-code-stream] Built file manifest with ${Object.keys(fileManifest.files).length} files, ${Object.keys(fileManifest.componentTree).length} components`);
          } catch (manifestError) {
            console.error('[generate-ai-code-stream] Failed to build file manifest:', manifestError);
          }
        }

        // Extract explanation
        const explanationMatch = generatedCode.match(/<explanation>([\s\S]*?)<\/explanation>/);
        const explanation = explanationMatch ? explanationMatch[1].trim() : 'Code generated successfully!';
        
        // Validate generated code for truncation issues
        const truncationWarnings: string[] = [];
        
        // Skip ellipsis checking entirely - too many false positives with spread operators, loading text, etc.
        
        // Check for unclosed file tags
        const fileOpenCount = (generatedCode.match(/<file path="/g) || []).length;
        const fileCloseCount = (generatedCode.match(/<\/file>/g) || []).length;
        if (fileOpenCount !== fileCloseCount) {
          truncationWarnings.push(`Unclosed file tags detected: ${fileOpenCount} open, ${fileCloseCount} closed`);
        }
        
        // Check for files that seem truncated (very short or ending abruptly)
        const truncationCheckRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
        let truncationMatch;
        while ((truncationMatch = truncationCheckRegex.exec(generatedCode)) !== null) {
          const filePath = truncationMatch[1];
          const content = truncationMatch[2];
          
          // Only check for really obvious HTML truncation - file ends with opening tag
          if (content.trim().endsWith('<') || content.trim().endsWith('</')) {
            truncationWarnings.push(`File ${filePath} appears to have incomplete HTML tags`);
          }
          
          // Skip "..." check - too many false positives with loading text, etc.
          
          // Only check for SEVERE truncation issues
          if (filePath.match(/\.(jsx?|tsx?)$/)) {
            // Only check for severely unmatched brackets (more than 3 difference)
            const openBraces = (content.match(/{/g) || []).length;
            const closeBraces = (content.match(/}/g) || []).length;
            const braceDiff = Math.abs(openBraces - closeBraces);
            if (braceDiff > 3) { // Only flag severe mismatches
              truncationWarnings.push(`File ${filePath} has severely unmatched braces (${openBraces} open, ${closeBraces} closed)`);
            }
            
            // Check if file is extremely short and looks incomplete
            if (content.length < 20 && content.includes('function') && !content.includes('}')) {
              truncationWarnings.push(`File ${filePath} appears severely truncated`);
            }
          }
        }
        
        // Handle truncation with automatic retry (if enabled in config)
        if (truncationWarnings.length > 0 && appConfig.codeApplication.enableTruncationRecovery) {
          console.warn('[generate-ai-code-stream] Truncation detected, attempting to fix:', truncationWarnings);
          
          await sendProgress({
            type: 'warning',
            message: 'Detected incomplete code generation. Attempting to complete...',
            warnings: truncationWarnings
          });
          
          // Try to fix truncated files automatically
          const truncatedFiles: string[] = [];
          const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
          let match;
          
          while ((match = fileRegex.exec(generatedCode)) !== null) {
            const filePath = match[1];
            const content = match[2];
            
            // Check if this file appears truncated - be more selective
            const hasEllipsis = content.includes('...') && 
                               !content.includes('...rest') && 
                               !content.includes('...props') &&
                               !content.includes('spread');
                               
            const endsAbruptly = content.trim().endsWith('...') || 
                                 content.trim().endsWith(',') ||
                                 content.trim().endsWith('(');
                                 
            const hasUnclosedTags = content.includes('</') && 
                                    !content.match(/<\/[a-zA-Z0-9]+>/) &&
                                    content.includes('<');
                                    
            const tooShort = content.length < 50 && filePath.match(/\.(jsx?|tsx?)$/);
            
            // Check for unmatched braces specifically
            const openBraceCount = (content.match(/{/g) || []).length;
            const closeBraceCount = (content.match(/}/g) || []).length;
            const hasUnmatchedBraces = Math.abs(openBraceCount - closeBraceCount) > 1;
            
            const isTruncated = (hasEllipsis && endsAbruptly) || 
                               hasUnclosedTags || 
                               (tooShort && !content.includes('export')) ||
                               hasUnmatchedBraces;
            
            if (isTruncated) {
              truncatedFiles.push(filePath);
            }
          }
          
          // If we have truncated files, try to regenerate them
          if (truncatedFiles.length > 0) {
            console.log('[generate-ai-code-stream] Attempting to regenerate truncated files:', truncatedFiles);
            
            for (const filePath of truncatedFiles) {
              await sendProgress({
                type: 'info',
                message: `Completing ${filePath}...`
              });
              
              try {
                // Create a focused prompt to complete just this file
                const completionPrompt = `Complete the following file that was truncated. Provide the FULL file content.
                
File: ${filePath}
Original request: ${prompt}
                
Provide the complete file content without any truncation. Include all necessary imports, complete all functions, and close all tags properly.`;
                
                // Make a focused API call to complete this specific file
                // Create a new client for the completion based on the provider
                let completionClient;
                if (model.includes('gpt') || model.includes('openai')) {
                  completionClient = openai;
                } else if (model.includes('claude')) {
                  completionClient = anthropic;
                } else if (model === 'moonshotai/kimi-k2-instruct-0905') {
                  completionClient = groq;
                } else {
                  completionClient = groq;
                }
                
                // Determine the correct model name for the completion
                let completionModelName: string;
                if (model === 'moonshotai/kimi-k2-instruct-0905') {
                  completionModelName = 'moonshotai/kimi-k2-instruct-0905';
                } else if (model.includes('openai')) {
                  completionModelName = model.replace('openai/', '');
                } else if (model.includes('anthropic')) {
                  completionModelName = model.replace('anthropic/', '');
                } else if (model.includes('google')) {
                  completionModelName = model.replace('google/', '');
                } else {
                  completionModelName = model;
                }
                
                const completionResult = await streamText({
                  model: completionClient(completionModelName),
                  messages: [
                    { 
                      role: 'system', 
                      content: 'You are completing a truncated file. Provide the complete, working file content.'
                    },
                    { role: 'user', content: completionPrompt }
                  ],
                  temperature: model.startsWith('openai/gpt-5') ? undefined : appConfig.ai.defaultTemperature
                });
                
                // Get the full text from the stream
                let completedContent = '';
                for await (const chunk of completionResult.textStream) {
                  completedContent += chunk;
                }
                
                // Replace the truncated file in the generatedCode
                const filePattern = new RegExp(
                  `<file path="${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">[\\s\\S]*?(?:</file>|$)`,
                  'g'
                );
                
                // Extract just the code content (remove any markdown or explanation)
                let cleanContent = completedContent;
                if (cleanContent.includes('```')) {
                  const codeMatch = cleanContent.match(/```[\w]*\n([\s\S]*?)```/);
                  if (codeMatch) {
                    cleanContent = codeMatch[1];
                  }
                }
                
                generatedCode = generatedCode.replace(
                  filePattern,
                  `<file path="${filePath}">\n${cleanContent}\n</file>`
                );
                
                console.log(`[generate-ai-code-stream] Successfully completed ${filePath}`);
                
              } catch (completionError) {
                console.error(`[generate-ai-code-stream] Failed to complete ${filePath}:`, completionError);
                await sendProgress({
                  type: 'warning',
                  message: `Could not auto-complete ${filePath}. Manual review may be needed.`
                });
              }
            }
            
            // Clear the warnings after attempting fixes
            truncationWarnings.length = 0;
            await sendProgress({
              type: 'info',
              message: 'Truncation recovery complete'
            });
          }
        }
        
        // Send completion with packages info
        await sendProgress({ 
          type: 'complete', 
          generatedCode,
          explanation,
          files: files.length,
          components: componentCount,
          model,
          packagesToInstall: packagesToInstall.length > 0 ? packagesToInstall : undefined,
          warnings: truncationWarnings.length > 0 ? truncationWarnings : undefined
        });
        
        // Track edit in conversation history
        if (isEdit && editContext && global.conversationState) {
          const editRecord: ConversationEdit = {
            timestamp: Date.now(),
            userRequest: prompt,
            editType: editContext.editIntent.type,
            targetFiles: editContext.primaryFiles,
            confidence: editContext.editIntent.confidence,
            outcome: 'success' // Assuming success if we got here
          };
          
          global.conversationState.context.edits.push(editRecord);
          
          // Track major changes
          if (editContext.editIntent.type === 'ADD_FEATURE' || files.length > 3) {
            global.conversationState.context.projectEvolution.majorChanges.push({
              timestamp: Date.now(),
              description: editContext.editIntent.description,
              filesAffected: editContext.primaryFiles
            });
          }
          
          // Update last updated timestamp
          global.conversationState.lastUpdated = Date.now();
          
          console.log('[generate-ai-code-stream] Updated conversation history with edit:', editRecord);
        }
        
      } catch (error) {
        console.error('[generate-ai-code-stream] Stream processing error:', error);
        
        // Check if it's a tool validation error
        if ((error as any).message?.includes('tool call validation failed')) {
          console.error('[generate-ai-code-stream] Tool call validation error - this may be due to the AI model sending incorrect parameters');
          await sendProgress({ 
            type: 'warning', 
            message: 'Package installation tool encountered an issue. Packages will be detected from imports instead.'
          });
          // Continue processing - packages can still be detected from the code
        } else {
          await sendProgress({ 
            type: 'error', 
            error: (error as Error).message 
          });
        }
      } finally {
        await writer.close();
      }
    })();
    
    // Return the stream with proper headers for streaming support
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'Content-Encoding': 'none', // Prevent compression that can break streaming
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('[generate-ai-code-stream] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
