export type StarterFile = {
  path: string;
  content: string;
};

type StarterOptions = {
  port: number;
  allowedHosts: string[];
  hmr?: string | false;
};

function jsStringArray(values: string[]) {
  return values.map(value => `      ${JSON.stringify(value)}`).join(',\n');
}

function createPackageJson() {
  return JSON.stringify({
    name: 'sandbox-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite --host',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      '@vitejs/plugin-react': '^4.0.0',
      'class-variance-authority': '^0.7.1',
      clsx: '^2.1.1',
      'lucide-react': '^0.468.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'tailwind-merge': '^2.5.4'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      autoprefixer: '^10.4.16',
      postcss: '^8.4.31',
      tailwindcss: '^3.3.0',
      typescript: '^5.3.0',
      vite: '^4.3.9'
    }
  }, null, 2);
}

function createViteConfig(options: StarterOptions) {
  const hmrBlock = options.hmr === false
    ? '    hmr: false,'
    : options.hmr || `    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },`;

  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: ${options.port},
    strictPort: true,
${hmrBlock}
    allowedHosts: [
${jsStringArray(options.allowedHosts)}
    ]
  }
})`;
}

export function createRichViteStarterFiles(options: StarterOptions): StarterFile[] {
  return [
    {
      path: 'package.json',
      content: createPackageJson()
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}`
    },
    {
      path: 'vite.config.js',
      content: createViteConfig(options)
    },
    {
      path: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(59, 130, 246, 0.28)',
      },
    },
  },
  plugins: [],
}`
    },
    {
      path: 'postcss.config.js',
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    },
    {
      path: 'src/main.tsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
    },
    {
      path: 'src/App.tsx',
      content: `import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'

const capabilities = [
  'Reusable UI primitives',
  'Typed React components',
  'Tailwind design tokens',
  'Ready for multi-file apps',
]

function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <Badge className="mb-6 w-fit border-blue-400/30 bg-blue-400/10 text-blue-100">
          <Sparkles className="mr-2 h-3.5 w-3.5" /> Rich sandbox ready
        </Badge>
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Build complete apps from the first prompt.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              This sandbox starts with typed utilities, polished UI primitives, and a structure designed for larger generated applications.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200">
                Start generating <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                Inspect starter files
              </Button>
            </div>
          </div>
          <Card className="border-white/10 bg-white/[0.04] text-white shadow-glow backdrop-blur">
            <CardHeader>
              <CardTitle>Included foundation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {capabilities.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

export default App`
    },
    {
      path: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    background: rgb(9 9 11);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
}`
    },
    {
      path: 'src/lib/utils.ts',
      content: `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`
    },
    {
      path: 'src/lib/mock-data.ts',
      content: `export const starterStats = [
  { label: 'Files scaffolded', value: '12+' },
  { label: 'UI primitives', value: '8' },
  { label: 'Stack', value: 'Vite + React + TS' },
]
`
    },
    {
      path: 'src/hooks/use-mobile.ts',
      content: `import { useEffect, useState } from 'react'

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(` + '`(max-width: ${breakpoint - 1}px)`' + `)
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [breakpoint])

  return isMobile
}`
    },
    {
      path: 'src/components/ui/button.tsx',
      content: `import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white hover:bg-zinc-800',
        secondary: 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200',
        outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-100 hover:text-zinc-950',
        ghost: 'hover:bg-zinc-100 hover:text-zinc-950',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-12 rounded-xl px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
))

Button.displayName = 'Button'
export { buttonVariants }`
    },
    {
      path: 'src/components/ui/card.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-sm', className)} {...props} />
))
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-zinc-500', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'`
    },
    {
      path: 'src/components/ui/input.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn('flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50', className)}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'`
    },
    {
      path: 'src/components/ui/textarea.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn('flex min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50', className)}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'`
    },
    {
      path: 'src/components/ui/badge.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return <div className={cn('inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold transition-colors', className)} {...props} />
}`
    },
    {
      path: 'src/components/ui/avatar.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200', className)} {...props} />
}

export function AvatarImage({ className, alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-700', className)} {...props} />
}`
    },
    {
      path: 'src/components/ui/tabs.tsx',
      content: `import * as React from 'react'
import { cn } from '../../lib/utils'

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('w-full', className)} {...props} />
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 p-1 text-zinc-500', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white hover:text-zinc-950', className)} {...props} />
}

export function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4', className)} {...props} />
}`
    },
    {
      path: 'src/components/ui/skeleton.tsx',
      content: `import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-zinc-200', className)} {...props} />
}`
    },
    {
      path: 'README.md',
      content: `# Generated App Sandbox

This starter includes Vite, React, TypeScript, Tailwind CSS, utility helpers, and reusable UI primitives so generated apps can be larger than a single component.

Useful paths:

- \`src/App.tsx\` - main app entry component
- \`src/components/ui\` - reusable UI primitives
- \`src/lib/utils.ts\` - className merge helper
- \`src/hooks/use-mobile.ts\` - responsive helper
`
    }
  ];
}

export const richStarterFilePaths = createRichViteStarterFiles({
  port: 5173,
  allowedHosts: [],
}).map(file => file.path);
