import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, GitMerge } from 'lucide-react';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  enabled?: boolean;
  overview?: string;
  features?: { title: string; description: string }[];
}

const CONNECTORS: Connector[] = [
  {
    id: "ai",
    name: "AI",
    description: "Unlock powerful AI features",
    icon: (
      <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#ai-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#ff00a0" />
               <stop offset="100%" stopColor="#ffb300" />
            </linearGradient>
          </defs>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
    ),
    enabled: true,
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Connect your own Supabase project",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://cdn.simpleicons.org/supabase/3ECF8E" className="w-[18px] h-[18px] object-contain" alt="Supabase" title="Supabase" />
       </div>
    ),
    enabled: true,
    overview: "Integrate user authentication, data storage, and backend capabilities.",
    features: [
      {
        title: "Database (PostgreSQL)",
        description: "Store and query your app data with full SQL support. Lovable can automatically generate the necessary tables and schema based on your prompts. User Authentication – Securely manage user sign-ups, logins, and access control. Lovable can add pre-built authentication flows (email/password, etc.) to your app with a simple prompt."
      },
      {
        title: "File Storage",
        description: "Upload and serve images or other files via Supabase Storage. Great for user profile photos, uploads, or any static media your app needs to handle."
      },
      {
        title: "Real-time Updates",
        description: "Supabase can stream live data changes to your app. This enables features like live chat, activity feeds, or collaborative dashboards that update instantly for all users."
      },
      {
        title: "Edge Functions (Serverless)",
        description: "Run custom backend logic (in JavaScript/TypeScript) on Supabase's infrastructure. Lovable will create and deploy these functions for tasks like sending emails, processing payments, or integrating with external APIs."
      }
    ]
  },
  {
    id: "neon",
    name: "Neon",
    description: "Serverless Postgres platform",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-black border border-[#00e599]/30 flex items-center justify-center overflow-hidden">
         <img src="https://cdn.simpleicons.org/neon/00e599" className="w-[20px] h-[20px] object-contain" alt="Neon" />
       </div>
    ),
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Access GPT-4 and other OpenAI models",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=openai.com&sz=128" className="w-[20px] h-[20px] object-contain" alt="OpenAI" />
       </div>
    ),
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Access Claude 3 models",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#f0ebd8] flex items-center justify-center overflow-hidden">
         <img src="https://cdn.simpleicons.org/anthropic/black" className="w-[18px] h-[18px] object-contain" alt="Anthropic" />
       </div>
    ),
  },
  {
    id: "google-gemini",
    name: "Google Gemini",
    description: "Google's most capable AI models",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128" className="w-[20px] h-[20px] object-contain" alt="Google Gemini" />
       </div>
    ),
  },
  {
    id: "together-ai",
    name: "Together AI",
    description: "Fast cloud for open-source AI models",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-white flex items-center justify-center overflow-hidden border border-[#e5e5e5]">
         <img src="https://www.google.com/s2/favicons?domain=together.ai&sz=128" className="w-[20px] h-[20px] object-contain" alt="Together AI" />
       </div>
    ),
  },
  {
    id: "groq",
    name: "Groq",
    description: "The LPU inference engine",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=groq.com&sz=128" className="w-[18px] h-[18px] object-contain rounded-sm" alt="Groq" />
       </div>
    ),
  },
  {
    id: "grok",
    name: "Grok",
    description: "xAI's Grok models",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-white flex items-center justify-center overflow-hidden border border-[#e5e5e5]">
         <img src="https://www.google.com/s2/favicons?domain=grok.com&sz=128" className="w-[20px] h-[20px] object-contain" alt="Grok" />
       </div>
    ),
  },
  {
    id: "clerk",
    name: "Clerk",
    description: "Complete user management and authentication",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=clerk.com&sz=128" className="w-[18px] h-[18px] object-contain" alt="Clerk" />
       </div>
    ),
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "AI voice generation, text-to-speech, and speech-to-text",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://cdn.simpleicons.org/elevenlabs/white" className="w-[18px] h-[18px] object-contain" alt="ElevenLabs" />
       </div>
    ),
  },
  {
    id: "exa",
    name: "Exa",
    description: "Search engine for AI",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=exa.ai&sz=128" className="w-[18px] h-[18px] object-contain rounded-sm" alt="Exa" />
       </div>
    ),
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "Crawl and convert any website into LLM-ready markdown",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=firecrawl.dev&sz=128" className="w-[18px] h-[18px] object-contain rounded-sm" alt="Firecrawl" />
       </div>
    ),
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "A unified interface for LLMs",
    icon: (
       <div className="w-[32px] h-[32px] flex-shrink-0 rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden">
         <img src="https://www.google.com/s2/favicons?domain=openrouter.ai&sz=128" className="w-[18px] h-[18px] object-contain rounded-sm" alt="OpenRouter" />
       </div>
    ),
  }
];

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectorsModal({ isOpen, onClose }: ConnectorsModalProps) {
  const [activeConnector, setActiveConnector] = useState<Connector | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => setActiveConnector(null), 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1200px] h-[92vh] max-h-[900px] bg-[#1a1a1a] rounded-[24px] shadow-2xl z-[101] flex flex-col overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#222]">
              <h2 className="text-[14px] font-medium text-white flex items-center gap-[8px]">
                {activeConnector ? (
                  <>
                    <button 
                      onClick={() => setActiveConnector(null)} 
                      className="text-neutral-400 hover:text-white transition-colors flex items-center gap-[8px]"
                    >
                      <GitMerge size={16} />
                      Connectors
                    </button>
                    <span className="text-neutral-500">/</span>
                    <span>{activeConnector.name}</span>
                  </>
                ) : (
                  <>
                    <GitMerge size={16} className="text-neutral-400" />
                    Connectors
                  </>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-[280px] h-9 pl-9 pr-4 bg-transparent border border-[#333] hover:border-[#444] rounded-[8px] text-[13px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 hide-scrollbar flex flex-col gap-6" style={{ background: '#0a0a0a' }}>
              {activeConnector ? (
                <div className="flex flex-col text-left">
                  {/* Top Card */}
                  <div className="flex items-center justify-between px-6 py-4 rounded-[12px] border border-[#2a2a2a] bg-transparent h-[76px] mb-8">
                    <div className="flex items-center gap-[16px]">
                      {activeConnector.icon}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-white">{activeConnector.name}</span>
                        </div>
                        {activeConnector.enabled && (
                          <div className="flex items-center gap-[6px] mt-0.5">
                            <div className="w-[6px] h-[6px] rounded-full bg-[#4ade80]"></div>
                            <span className="text-[13px] font-medium text-white tracking-wide">Enabled</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="px-[14px] py-[6px] rounded-[6px] border border-[#333] hover:border-[#444] text-[13px] font-medium text-white bg-transparent transition-colors">
                      {activeConnector.enabled ? "Disable for workspace" : "Enable for workspace"}
                    </button>
                  </div>

                  {/* Overview */}
                  <div className="mb-10">
                    <h3 className="text-[17px] font-semibold text-white mb-2">Overview</h3>
                    <p className="text-[14px] text-neutral-300 leading-relaxed">
                      {activeConnector.overview || activeConnector.description}
                    </p>
                  </div>

                  {/* Organizations */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-[17px] font-semibold text-white">Organizations</h3>
                        <span className="px-[6px] py-[2px] rounded bg-[#2a2a2a] text-neutral-300 text-[11px] font-medium tracking-wide">Admin</span>
                      </div>
                      <button className="px-[14px] py-[6px] rounded-[6px] border border-[#333] hover:border-[#444] text-[13px] font-medium text-white bg-transparent transition-colors">
                        Manage Connected Organizations
                      </button>
                    </div>
                    <p className="text-[14px] text-neutral-300">
                      Connected {activeConnector.name} organizations will be accessible to all members in this workspace.
                    </p>
                  </div>

                  {/* Key features */}
                  {activeConnector.features && activeConnector.features.length > 0 && (
                    <div>
                      <h3 className="text-[16px] font-bold text-white mb-4">
                        Key features unlocked by {activeConnector.name} integration
                      </h3>
                      <ul className="space-y-[14px]">
                        {activeConnector.features.map((feature, i) => (
                          <li key={i} className="text-[14px] text-neutral-300 leading-relaxed flex items-start">
                            <span className="mr-[12px] mt-[8px] w-[5px] h-[5px] bg-white rounded-full flex-shrink-0"></span>
                            <div>
                              <strong className="text-white">{feature.title}:</strong> {feature.description}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-[16px] font-semibold text-white mb-2">App & Chat connectors</h3>
                    <p className="text-neutral-400 text-[13px]">Add functionality to your apps. Configured once by admins, available to your workspace.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-[12px]">
                    {CONNECTORS.map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => setActiveConnector(connector)}
                        className="flex text-left items-center gap-[12px] px-[12px] py-[10px] rounded-[10px] border border-[#2a2a2a] hover:border-[#444] bg-transparent transition-colors group flex-row h-[56px]"
                      >
                        {connector.icon}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                          <div className="flex justify-between items-center w-full line-clamp-1">
                            <span className="text-[13px] font-semibold text-white truncate pr-2">{connector.name}</span>
                            {connector.enabled && (
                              <span className="text-[10px] font-medium text-[#4ade80] bg-[#162719] border border-[#203a24] px-[6px] py-[1px] rounded-[4px]">
                                Enabled
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] text-neutral-400 truncate mt-[1px]">{connector.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Dark overlay at bottom for scroll effect */}
            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
