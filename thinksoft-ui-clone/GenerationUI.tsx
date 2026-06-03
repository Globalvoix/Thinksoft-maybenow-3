'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  History,
  Square,
  Pen,
  Copy,
  Bookmark,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Plus,
  Map,
  Mic,
  ArrowUp,
  Globe,
  FileText,
  Cloud,
  Code,
  LineChart,
  X,
  Database,
  Zap,
  CornerDownLeft,
  Undo,
  Monitor,
  RefreshCw,
  ArrowUpRight,
  MessageSquare,
  Github,
  Laptop,
  HelpCircle,
  ChevronRight,
  File,
  Download,
  WrapText,
  Hash,
  Image,
  Paperclip,
  ExternalLink,
  UserPlus,
  Upload,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CustomCopyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="12" height="12" x="9" y="9" rx="2" ry="2" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </svg>
);

const ReactIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)" />
  </svg>
);

const CustomClockIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Solid right arc */}
    <path d="M 12 3 A 9 9 0 0 1 12 21" />
    {/* 3 Dashes on the left */}
    <path d="M 8.34 3.78 A 9 9 0 0 0 4.91 6.46" />
    <path d="M 3.27 9.83 A 9 9 0 0 0 3.27 14.17" />
    <path d="M 4.91 17.54 A 9 9 0 0 0 8.34 20.22" />
    {/* Hands */}
    <path d="M 12 7 v 5 l 2.5 2.5" />
  </svg>
);

const SidebarToggleIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <line x1="9" y1="5" x2="9" y2="19" />
  </svg>
);

const CustomTabletIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="5" y="4" width="14" height="16" rx="2" />
    <rect x="7.5" y="6.5" width="2" height="2" fill="currentColor" stroke="none" />
  </svg>
);

const CustomMobileIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="7" y="4" width="10" height="16" rx="2" />
    <rect x="9.5" y="6.5" width="2" height="2" fill="currentColor" stroke="none" />
  </svg>
);

interface Message {
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
}

interface FileInfo {
  path: string;
  content: string;
}

interface GenerationUIProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  promptText: string;
  onPromptTextChange: (text: string) => void;
  activeTab: 'preview' | 'code' | 'design';
  onTabChange: (tab: 'preview' | 'code' | 'design') => void;
  sandboxUrl?: string;
  previewKey?: number;
  isGenerating: boolean;
  generationStatus: string;
  files?: FileInfo[];
  selectedFile?: string;
  onFileSelect?: (path: string) => void;
  codeContent?: string;
}

export default function GenerationUI({
  messages, onSendMessage, promptText: extPromptText, onPromptTextChange,
  activeTab, onTabChange,
  sandboxUrl, previewKey, isGenerating, generationStatus,
  files = [], selectedFile, onFileSelect, codeContent = ''
}: GenerationUIProps) {
  const [isGithubPopoverOpen, setIsGithubPopoverOpen] = useState(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [activePromptMode, setActivePromptMode] = useState<'plan' | 'visual' | null>(null);
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [extPromptText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (extPromptText.trim() && !isGenerating) onSendMessage(extPromptText);
  };

  const formatDate = (d: Date) =>
    d instanceof Date
      ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const tabs = [
    { id: 'preview', icon: Globe, label: 'Preview' },
    { id: 'code', icon: Code, label: 'Code' },
    { id: 'design', icon: Pen, label: 'Design' },
  ];

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'webp'].includes(ext || '')) return <Image className="w-4 h-4 text-white" />;
    if (['txt', 'md'].includes(ext || '')) return <FileText className="w-4 h-4 text-white" />;
    if (['lock', 'lockb'].includes(ext || '')) return <Paperclip className="w-4 h-4 text-white" />;
    return <File className="w-4 h-4 text-white" />;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const buildTree = (fileList: FileInfo[]) => {
    const root: { name: string; path: string; isDir: boolean; children: any[] }[] = [];
    for (const file of fileList) {
      const parts = file.path.replace(/^\//, '').split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        let node = current.find(n => n.name === parts[i]);
        if (!node) {
          node = { name: parts[i], path: parts.slice(0, i + 1).join('/'), isDir: !isLast, children: [] };
          current.push(node);
        }
        current = node.children;
      }
    }
    return root;
  };

  const renderNodes = (nodes: ReturnType<typeof buildTree>, depth: number): React.ReactNode => {
    return nodes.map((node) => {
      const expanded = expandedFolders.has(node.path);
      return (
        <div key={node.path}>
          <div
            className={`py-1.5 px-2 rounded cursor-pointer flex items-center gap-2 ${
              selectedFile === node.path ? 'bg-[#2A2D3D]' : 'hover:bg-[#2A2A2A]'
            }`}
            style={{ paddingLeft: `${8 + depth * 20}px` }}
            onClick={() => {
              if (node.isDir) toggleFolder(node.path);
              else if (onFileSelect) onFileSelect(node.path);
            }}
          >
            {node.isDir ? (
              expanded ? (
                <ChevronDown className="w-4 h-4 text-white shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white shrink-0" />
              )
            ) : (
              getFileIcon(node.name)
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {node.isDir && expanded && renderNodes(node.children, depth + 1)}
        </div>
      );
    });
  };

  const renderFileTree = () => {
    if (files.length === 0) {
      return (
        <div className="text-xs text-[#4A4A4A] text-center mt-10 px-2">
          No files generated yet.
        </div>
      );
    }
    const tree = buildTree(files);
    return renderNodes(tree, 0);
  };

  return (
    <div className="flex h-screen w-full bg-[#1A1A1A] text-[#F3F3F3] font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[460px] flex flex-col bg-[#1A1A1A] shrink-0">
        
        {/* Sidebar Header */}
        <div className="h-12 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full opacity-50 mix-blend-overlay"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-normal text-[13px] leading-none">Stream Box</span>
                <ChevronDown className="w-3 h-3 text-[#8B8B8B]" />
              </div>
              <span className="text-[10px] text-[#8B8B8B] mt-0.5 leading-none">Previewing last saved version</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white">
            <button className="p-1.5 hover:bg-[#2A2A2A] rounded-md transition-colors"><CustomClockIcon className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-[#2A2A2A] rounded-md transition-colors"><SidebarToggleIcon className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6 custom-scrollbar relative">
          
          {/* Chat Messages */}
          <div className="flex flex-col gap-6">
            {messages.map((msg, i) => (
              <React.Fragment key={i}>
                {i === 0 && (
                  <div className="text-center text-[11px] font-normal text-[#8B8B8B] mt-2">
                    {formatDate(msg.timestamp)}
                  </div>
                )}
                {msg.type === 'user' ? (
                  <div className="bg-[#262626] rounded-[20px] py-[10px] px-[18px] text-[14px] font-[300] ml-auto max-w-[85%] leading-relaxed text-[#E5E5E5] shadow-sm">
                    {msg.content}
                  </div>
                ) : msg.type === 'ai' ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-[14px] font-normal text-[#A3A3A3]">
                      {isGenerating ? 'Thinking...' : 'Thought for a moment'}
                    </div>
                    <div className="text-[14px] leading-relaxed text-[#E5E5E5]">
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-3 text-[#A3A3A3]">
                      <button className="hover:text-[#F3F3F3] transition-colors"><Undo className="w-4 h-4" /></button>
                      <button className="hover:text-[#F3F3F3] transition-colors"><ThumbsUp className="w-4 h-4" /></button>
                      <button className="hover:text-[#F3F3F3] transition-colors"><ThumbsDown className="w-4 h-4" /></button>
                      <button className="hover:text-[#F3F3F3] transition-colors"><Copy className="w-4 h-4" /></button>
                      <button className="hover:text-[#F3F3F3] transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[14px] leading-relaxed text-[#E5E5E5]">
                    {msg.content}
                  </div>
                )}
              </React.Fragment>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-[14px] text-[#8B8B8B] mt-8">
                Start a conversation to begin building your app.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer / Input Area */}
        <div className="px-2 pb-2 pt-0 flex flex-col gap-3 bg-[#1A1A1A] shrink-0 relative z-10">
          {/* Gradient Fade Effect */}
          <div className="absolute bottom-full left-0 right-0 h-16 bg-gradient-to-t from-[#1A1A1A] to-transparent pointer-events-none"></div>
          
          {/* Suggestions */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button className="whitespace-nowrap px-3 py-1.5 bg-[#262626] hover:bg-[#333] rounded-lg text-[13px] font-normal text-[#E5E5E5] transition-colors">Add movie detail modal</button>
            <button className="whitespace-nowrap px-3 py-1.5 bg-[#262626] hover:bg-[#333] rounded-lg text-[13px] font-normal text-[#E5E5E5] transition-colors">Auto-rotating hero banner</button>
            <button className="whitespace-nowrap px-3 py-1.5 bg-[#262626] hover:bg-[#333] rounded-lg text-[13px] font-normal text-[#E5E5E5] transition-colors">Add site footer</button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="bg-[#262626] border border-[#3A3A3A] rounded-[28px] p-[18px] flex flex-col gap-2 shadow-sm focus-within:border-[#555] transition-colors">
            <textarea 
              ref={textareaRef}
              placeholder="Ask Thinksoft..." 
              value={extPromptText}
              onChange={(e) => onPromptTextChange(e.target.value)}
              className="w-full bg-transparent text-[16px] px-1 outline-none resize-none placeholder:text-[#A3A3A3] text-[#F3F3F3] min-h-[30px] max-h-48 overflow-y-auto custom-scrollbar"
              rows={1}
            />

            <div className="flex items-center justify-between pl-1">
              <div className="flex items-center gap-2">
                <button type="button" className="w-8 h-8 rounded-full border border-[#3A3A3A] flex items-center justify-center text-[#F3F3F3] hover:bg-[#333] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setActivePromptMode(prev => prev === 'visual' ? null : 'visual')}
                  className={`h-8 px-3 rounded-full border flex items-center gap-1.5 transition-colors ${
                    activePromptMode === 'visual'
                      ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                      : 'border-[#3A3A3A] text-[#E5E5E5] hover:bg-[#333]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 3a2 2 0 0 0-2 2"/>
                    <path d="M19 3a2 2 0 0 1 2 2"/>
                    <path d="M21 19a2 2 0 0 1-2 2"/>
                    <path d="M5 21a2 2 0 0 1-2-2"/>
                    <path d="M9 3h1"/>
                    <path d="M9 21h1"/>
                    <path d="M14 3h1"/>
                    <path d="M14 21h1"/>
                    <path d="M3 9v1"/>
                    <path d="M21 9v1"/>
                    <path d="M3 14v1"/>
                    <path d="M21 14v1"/>
                    <path d="m10 10 4 10 1.7-4.3L20 14Z"/>
                  </svg>
                  <span className="text-[13px] font-medium">Visual edits</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  type="button"
                  onClick={() => setActivePromptMode(prev => prev === 'plan' ? null : 'plan')}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                    activePromptMode === 'plan'
                      ? 'border-[#2E5CFF] bg-[#2E5CFF] text-white'
                      : 'border-[#3A3A3A] text-[#F3F3F3] hover:bg-[#333]'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="w-8 h-8 rounded-full border border-[#3A3A3A] flex items-center justify-center text-[#F3F3F3] hover:bg-[#333] transition-colors">
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={!extPromptText.trim() || isGenerating}
                  className={`w-8 h-8 ml-0.5 rounded-full flex items-center justify-center transition-colors ${
                    extPromptText.trim().length > 0 
                      ? 'bg-[#F3F3F3] text-[#171717]' 
                      : 'bg-[#737373] text-[#171717]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Navigation */}
        <div className="h-12 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  layout
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as 'preview' | 'code' | 'design')}
                  className={`flex items-center justify-center h-7 rounded-md border border-solid overflow-hidden transition-colors duration-200 ${
                    isActive
                      ? 'px-2.5 bg-[#1E2B4A] border-[#3B82F6] text-[#3B82F6]'
                      : 'w-7 bg-transparent border-white/40 text-white hover:bg-[#2A2A2A]'
                  }`}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  style={{ borderRadius: 6 }}
                >
                  <motion.div layout="position" className="flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        layout="position"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap flex items-center"
                      >
                        <span className="text-[13px] font-medium pl-1.5 pr-0.5 block">{tab.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
            {activeTab === 'preview' ? (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-transparent border border-white/20 rounded-full text-white text-xs w-[280px]">
                <button 
                  onClick={() => {
                    if (deviceMode === 'desktop') setDeviceMode('tablet');
                    else if (deviceMode === 'tablet') setDeviceMode('mobile');
                    else setDeviceMode('desktop');
                  }}
                  className="hover:text-gray-300 transition-colors flex items-center justify-center"
                >
                  {deviceMode === 'mobile' ? (
                    <CustomMobileIcon className="w-3.5 h-3.5" />
                  ) : deviceMode === 'tablet' ? (
                    <CustomTabletIcon className="w-3.5 h-3.5" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="font-bold text-base leading-none">/</span>
                <div className="flex-1"></div>
                <ArrowUpRight className="w-3.5 h-3.5 cursor-pointer transition-colors hover:text-gray-300" />
                <RefreshCw className="w-3.5 h-3.5 cursor-pointer transition-colors hover:text-gray-300" />
              </div>
            ) : (
              <span className="font-semibold text-[15px] capitalize text-white">{activeTab}</span>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {activeTab === 'preview' && (
              <>
                <button className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2A2A2A] hover:bg-[#333] text-white transition-colors">
                  <MessageSquare className="w-[15px] h-[15px] scale-x-[-1]" strokeWidth={2.5} />
                </button>
                <div className="flex items-center relative">
                  <div className="w-6 h-6 rounded-full bg-[#6BA539] flex items-center justify-center text-white text-xs font-medium relative z-0">P</div>
                  <button 
                    onClick={() => setIsSharePopoverOpen(!isSharePopoverOpen)}
                    className="h-6 px-3 flex items-center justify-center text-xs font-bold text-white bg-[#2A2A2A] hover:bg-[#333] rounded-full transition-colors relative z-10 -ml-2"
                  >
                    Share
                  </button>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setIsGithubPopoverOpen(!isGithubPopoverOpen)}
                    className="flex items-center justify-center w-7 h-7 bg-[#2A2A2A] hover:bg-[#333] text-white rounded-md transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </button>
                  
                  <AnimatePresence>
                    {isGithubPopoverOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-2 w-[320px] bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 flex flex-col gap-2">
                          <h3 className="text-white font-semibold text-[15px]">GitHub</h3>
                          <p className="text-[#A3A3A3] text-[13px] leading-relaxed">
                            Sync your project 2-way with GitHub to collaborate at source.
                          </p>
                        </div>
                        <div className="px-4 py-3 border-t border-[#3A3A3A] flex items-center justify-between bg-[#1A1A1A]">
                          <button className="text-[#A3A3A3] hover:text-white transition-colors">
                            <HelpCircle className="w-4 h-4" />
                          </button>
                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 text-black text-[13px] font-medium rounded-md transition-colors">
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Connect GitHub
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button className="h-7 flex items-center gap-1.5 px-3 text-[13px] font-medium text-white bg-[#635BFF] hover:bg-[#534BE5] rounded-md transition-colors">
                  <Zap className="w-3.5 h-3.5 fill-white stroke-none" />
                  Upgrade
                </button>
                <button className="h-7 px-3 flex items-center justify-center text-[13px] font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-colors">
                  Publish
                </button>

                <AnimatePresence>
                  {isSharePopoverOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-[440px] bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 flex flex-col gap-4">
                        <h3 className="text-white font-semibold text-[17px]">Share project</h3>
                        
                        <input 
                          type="text" 
                          placeholder="Add people" 
                          className="w-full bg-transparent border border-[#666] rounded-lg px-3 py-2.5 text-[14px] text-white placeholder:text-[#D4D4D4] focus:outline-none focus:border-[#888]"
                        />
                        
                        <div className="flex flex-col gap-3">
                          <h4 className="text-white font-semibold text-[13px]">Project access</h4>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-[#3A3A3A] flex items-center justify-center text-[#A3A3A3]">
                                <Globe className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[#E5E5E5] text-[13px]">People you invited</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#A3A3A3]" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#E85D04] flex items-center justify-center text-white text-xs font-medium">P</div>
                              <span className="text-[#E5E5E5] text-[13px]">Prasuk's Thinksoft</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#E5E5E5] text-[13px] cursor-pointer">
                              Can edit <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-xs font-medium">P</div>
                              <div className="flex flex-col">
                                <span className="text-[#E5E5E5] text-[13px]">Prasuk Jain (you)</span>
                                <span className="text-[#A3A3A3] text-[11px]">prasukjaincreate13914@gmail.com</span>
                              </div>
                            </div>
                            <span className="text-[#A3A3A3] text-[13px]">Owner</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-[#3A3A3A] flex items-center justify-center text-[#A3A3A3]">
                                <UserPlus className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[#E5E5E5] text-[13px]">Invite link</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#A3A3A3] text-[13px] cursor-pointer">
                              Disabled <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                        
                        <button className="w-full py-2 bg-white hover:bg-gray-100 text-black text-[13px] font-medium rounded-md transition-colors">
                          Create invite link
                        </button>
                        
                        <div className="flex flex-col gap-2 pt-2">
                          <button className="w-full py-2 flex items-center justify-center gap-2 border border-[#3A3A3A] hover:bg-[#2A2A2A] text-[#E5E5E5] text-[13px] font-medium rounded-md transition-colors">
                            <Upload className="w-4 h-4" /> Publish project
                          </button>
                          <button className="w-full py-2 flex items-center justify-center gap-2 border border-[#3A3A3A] hover:bg-[#2A2A2A] text-[#E5E5E5] text-[13px] font-medium rounded-md transition-colors">
                            <Link className="w-4 h-4" /> Share preview
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {activeTab === 'code' && (
              <>
                <span className="text-[13px] text-[#A3A3A3] mr-2">Read only</span>
                <button className="h-7 px-3 flex items-center justify-center text-[13px] font-medium text-white bg-[#635BFF] hover:bg-[#534BE5] rounded-md transition-colors">
                  Upgrade
                </button>
                <button className="h-7 px-3 flex items-center justify-center text-[13px] font-medium border border-[#3A3A3A] hover:bg-[#2A2A2A] text-white rounded-md transition-colors">
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar mr-2 mb-2 border border-[#2A2A2A] rounded-2xl bg-[#0A0A0A] relative">
            {sandboxUrl ? (
              <iframe
                key={previewKey || 0}
                src={sandboxUrl}
                className="w-full h-full border-none"
                title="App Preview"
                allow="clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            ) : (
              <div className="text-[#4A4A4A] text-sm">
                {isGenerating ? generationStatus || 'Generating...' : 'Preview Content'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="flex-1 flex overflow-hidden mr-2 mb-2 border border-[#2A2A2A] rounded-2xl bg-[#1A1A1A] relative">
            <div className="w-64 border-r border-[#2A2A2A] p-4 flex flex-col bg-[#1A1A1A]">
              <div className="text-sm font-normal text-[#F3F3F3] mb-4">Design</div>
              <div className="text-xs text-[#8B8B8B] text-center mt-10">
                You haven't generated any design variations yet.<br/>
                <span className="text-[#4A4A4A]">Once you create some, it will appear here.</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-[#141414] text-[#4A4A4A] text-sm">
              Design preview unavailable.
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="flex-1 flex overflow-hidden mr-2 mb-2 border border-[#2A2A2A] rounded-2xl bg-[#1E1E1E] relative">
            {/* File Explorer */}
            <div className="w-[240px] border-r border-[#2A2A2A] flex flex-col bg-[#141414] shrink-0">
              <div className="p-3">
                <div className="bg-transparent border border-white/50 rounded-md px-2.5 py-1.5 flex items-center">
                  <input type="text" placeholder="Search code" className="bg-transparent text-[13px] text-white placeholder:text-white outline-none w-full" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 text-[13px] text-white">
                {renderFileTree()}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col bg-[#1E1E1E]">
              {/* Editor Top Bar */}
              <div className="h-10 flex items-center justify-between pr-3 bg-[#141414]">
                <div className="flex items-center h-full">
                  {selectedFile && (
                    <div className="h-full px-4 flex items-center gap-2.5 bg-[#1E1E1E] border-r border-[#2A2A2A] text-[13px] text-white">
                      {selectedFile}
                      <X className="w-3.5 h-3.5 text-[#8B8B8B] hover:text-[#F3F3F3] cursor-pointer ml-1" onClick={() => onFileSelect?.('')} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CustomCopyIcon className="w-4 h-4 text-[#E5E5E5] hover:text-white cursor-pointer" />
                  <button className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-100 text-black text-xs font-medium rounded transition-colors ml-1">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
              
              {/* Editor Content */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                {selectedFile && codeContent ? (
                  <SyntaxHighlighter
                    language={(() => {
                      const ext = selectedFile.split('.').pop()?.toLowerCase();
                      if (ext === 'css') return 'css';
                      if (ext === 'json') return 'json';
                      if (ext === 'html') return 'html';
                      if (ext === 'md') return 'markdown';
                      return 'jsx';
                    })()}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.8125rem',
                      background: '#1E1E1E',
                      minHeight: '100%',
                    }}
                    showLineNumbers={true}
                    wrapLongLines={true}
                  >
                    {codeContent}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#4A4A4A] text-sm">
                    Select a file to view its code
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #333;
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

