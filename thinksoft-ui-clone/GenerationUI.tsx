'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, History, Square, Pen, Copy, Bookmark, RotateCcw,
  ThumbsUp, ThumbsDown, MoreHorizontal, Plus, Map, Mic, ArrowUp,
  Globe, FileText, Cloud, Code, LineChart, X, Database, Zap,
  CornerDownLeft, Undo, Monitor, RefreshCw, ArrowUpRight, MessageSquare,
  Github, Laptop, HelpCircle, ChevronRight, File, Download, WrapText,
  Hash, Image, Paperclip, ExternalLink, UserPlus, Upload, Link, Menu,
  Sidebar, Play, Trash, Check, ChevronLeft, Settings, Sun, Moon,
  Shield, Package, Network, Key, Loader2, MousePointer2, Maximize,
  Type, Edit2, PenLine, Book, Gitlab, Scan, AtSign, PlusSquare, Workflow,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SecretsView } from './components/SecretsView';
import ChatMessageItem from './components/ChatMessageItem';
import dynamic from 'next/dynamic';

const GraphView = dynamic(() => import('./components/GraphView').then(m => m.GraphView), { ssr: false });

const CustomCopyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="12" height="12" x="9" y="9" rx="2" ry="2" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </svg>
);

const GithubIconFilled = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const GitlabIconFilled = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M23.955 9.404l-2.029-6.242a.585.585 0 00-1.11 0l-2.028 6.242H5.212L3.183 3.162a.585.585 0 00-1.11 0L.045 9.404a.593.593 0 00.218.665l11.737 8.529 11.737-8.529a.593.593 0 00.218-.665z" />
  </svg>
);

const ConnectorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="2.5" /><circle cx="8" cy="16" r="2.5" /><circle cx="17" cy="14" r="2.5" />
    <path d="M10 9a6 6 0 0 1 5 4" /><path d="M10.5 15.5L14.5 14.5" />
  </svg>
);

const ScreenshotIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4H6a2 2 0 0 0-2 2v2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <path d="M14.5 10.5L13.5 9h-3l-1 1.5H8A1.5 1.5 0 0 0 6.5 12v3A1.5 1.5 0 0 0 8 16.5h8a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 16 10.5h-1.5z" />
    <circle cx="12" cy="13" r="1.5" />
  </svg>
);

const ReferenceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </svg>
);

const SkillIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="12" height="16" rx="3" /><path d="M9 9h3" /><path d="M10.5 7.5v3" /><path d="M12 15h3" />
  </svg>
);

const AttachIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M 12 3 A 9 9 0 0 1 12 21" />
    <path d="M 8.34 3.78 A 9 9 0 0 0 4.91 6.46" />
    <path d="M 3.27 9.83 A 9 9 0 0 0 3.27 14.17" />
    <path d="M 4.91 17.54 A 9 9 0 0 0 8.34 20.22" />
    <path d="M 12 7 v 5 l 2.5 2.5" />
  </svg>
);

const SidebarToggleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" /><line x1="9" y1="5" x2="9" y2="19" />
  </svg>
);

const CustomTabletIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="4" width="14" height="16" rx="2" /><rect x="7.5" y="6.5" width="2" height="2" fill="currentColor" stroke="none" />
  </svg>
);

const CustomMobileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="7" y="4" width="10" height="16" rx="2" /><rect x="9.5" y="6.5" width="2" height="2" fill="currentColor" stroke="none" />
  </svg>
);

const CustomInspectIcon = ({ className, strokeWidth = 1.5 }: { className?: string, strokeWidth?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
    <path d="M6 4H5a2 2 0 0 0-2 2v1" /><path d="M18 4h1a2 2 0 0 1 2 2v1" /><path d="M3 18v1a2 2 0 0 0 2 2h1" />
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

interface SelectedElement {
  tag: string;
  id: string;
  classes: string;
  text: string;
  selector: string;
}

interface GenerationUIProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  promptText: string;
  onPromptTextChange: (text: string) => void;
  activeTab: 'preview' | 'code' | 'security' | 'graph' | 'secrets';
  onTabChange: (tab: 'preview' | 'code' | 'security' | 'graph' | 'secrets') => void;
  sandboxUrl?: string;
  previewKey?: number;
  isGenerating: boolean;
  generationStatus: string;
  files?: FileInfo[];
  selectedFile?: string;
  onFileSelect?: (path: string) => void;
  codeContent?: string;
  sandboxId?: string | null;
  streamingAiContent?: string;
  selectedElement?: SelectedElement | null;
  onElementSelect?: (el: SelectedElement | null) => void;
  onQuickTextEdit?: (oldText: string, newText: string) => void;
}

const tabs = [
  { id: 'preview', icon: Globe, label: 'Preview' },
  { id: 'code', icon: Code, label: 'Code' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'graph', icon: Network, label: 'Graph' },
  { id: 'secrets', icon: Key, label: 'Secrets' },
];

export default function GenerationUI({
  messages, onSendMessage, promptText: extPromptText, onPromptTextChange,
  activeTab, onTabChange,
  sandboxUrl, previewKey, isGenerating, generationStatus,
  files = [], selectedFile, onFileSelect, codeContent = '',
  sandboxId, streamingAiContent = '',
  selectedElement, onElementSelect,
  onQuickTextEdit
}: GenerationUIProps) {
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [mobileBottomState, setMobileBottomState] = useState<'default' | 'slash' | 'share' | 'recording' | 'transcribing' | 'transcribed' | 'project' | 'appearance'>('default');
  const [transcriptText, setTranscriptText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [activePromptMode, setActivePromptMode] = useState<'plan' | 'visual' | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selRefresh, setSelRefresh] = useState(0);
  const [textEditMode, setTextEditMode] = useState(false);
  const [textEditRefresh, setTextEditRefresh] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectionRef = useRef(false);
  const isInjectingRef = useRef(false);
  const textEditRef = useRef(false);
  const textIsInjectingRef = useRef(false);

  // Refs so the message listener always has the latest callbacks
  const onElementSelectRef = useRef(onElementSelect);
  onElementSelectRef.current = onElementSelect;
  const onQuickTextEditRef = useRef(onQuickTextEdit);
  onQuickTextEditRef.current = onQuickTextEdit;

  // Listen for element selection and text selection results from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data.type === '__THINK_SELECTOR_RESULT__') {
        selectionRef.current = false;
        setSelectionMode(false);
        setSelRefresh(0);
        onElementSelectRef.current?.({
          tag: e.data.tag,
          id: e.data.id,
          classes: e.data.classes,
          text: e.data.text,
          selector: e.data.selector,
        });
      } else if (e.data.type === '__THINK_TEXT_SAVED__') {
        if (e.data.oldText && e.data.newText && e.data.newText !== e.data.oldText) {
          onQuickTextEditRef.current?.(e.data.oldText, e.data.newText);
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle selection mode toggle
  useEffect(() => {
    selectionRef.current = selectionMode;
    if (selectionMode && sandboxUrl && !isInjectingRef.current) {
      isInjectingRef.current = true;
      fetch('/api/inject-selector', { method: 'POST' })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (data?.success && selectionRef.current) {
            setSelRefresh(n => n + 1);
          }
          isInjectingRef.current = false;
        })
        .catch(() => {
          isInjectingRef.current = false;
        });
    } else if (!selectionMode) {
      isInjectingRef.current = false;
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: '__THINK_SELECTOR_DISABLE__' }, '*');
      }
    }
  }, [selectionMode, sandboxUrl]);

  // Handle text edit mode toggle (inject script + reload iframe)
  useEffect(() => {
    textEditRef.current = textEditMode;
    if (textEditMode && sandboxUrl && !textIsInjectingRef.current) {
      textIsInjectingRef.current = true;
      fetch('/api/inject-selector', { method: 'POST' })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (data?.success && textEditRef.current) {
            setTextEditRefresh(n => n + 1);
          }
          textIsInjectingRef.current = false;
        })
        .catch(() => {
          textIsInjectingRef.current = false;
        });
    } else if (!textEditMode) {
      textIsInjectingRef.current = false;
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: '__THINK_TEXT_EDIT_DISABLE__' }, '*');
      }
    }
  }, [textEditMode, sandboxUrl]);

  // When iframe finishes loading and selection/text mode is active, send enable
  const handleIframeLoad = () => {
    if (!iframeRef.current?.contentWindow) return;
    setTimeout(() => {
      if (!iframeRef.current?.contentWindow) return;
      if (selectionRef.current) {
        iframeRef.current.contentWindow.postMessage({ type: '__THINK_SELECTOR_ENABLE__' }, '*');
      } else if (textEditRef.current) {
        iframeRef.current.contentWindow.postMessage({ type: '__THINK_TEXT_EDIT_ENABLE__' }, '*');
      }
    }, 100);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [extPromptText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (extPromptText.trim() && !isGenerating) {
      let message = extPromptText;
      if (selectedElement) {
        message = `[Target element: ${selectedElement.selector}]\n${message}`;
        onElementSelect?.(null);
      }
      onSendMessage(message);
    }
  };

  const formatDate = (d: Date) =>
    d instanceof Date
      ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden selection:bg-blue-500/30">

      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-[460px] flex flex-col bg-[var(--bg-main)] shrink-0 ${showMobilePreview ? 'hidden md:flex' : 'flex'}`}>

        {/* Sidebar Header */}
        <div className="h-14 md:h-12 flex items-center justify-between px-4 shrink-0 mt-2 md:mt-0">
          <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-solid border-[var(--border-main)] bg-[var(--bg-main)] shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200">
            <Sidebar className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>

          <div className="hidden md:flex items-center gap-3">
            <button className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-solid border-transparent hover:border-[var(--border-main)] shadow-none hover:shadow-sm transition-all duration-200 shrink-0">
              <Sidebar className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-normal text-[13px] leading-none">Project</span>
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-none">{isGenerating ? generationStatus : 'Previewing last saved version'}</span>
            </div>
          </div>

          <button onClick={() => setMobileBottomState('project')} className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-main)] border border-solid border-[var(--border-main)] rounded-full shadow-sm hover:bg-[var(--bg-hover)] transition-colors">
            <span className="font-normal text-[15px] leading-none text-[var(--text-primary)]">Project</span>
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>

          <div className="hidden md:flex items-center gap-2 text-[var(--text-primary)]">
            <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors"><CustomClockIcon className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors"><SidebarToggleIcon className="w-4 h-4" /></button>
          </div>

          <button
            onClick={() => setShowMobilePreview(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-solid border-[var(--border-main)] bg-transparent text-[var(--text-primary)] transition-colors"
          >
            <Play className="w-5 h-5 ml-0.5" />
          </button>
        </div>

        {/* Sidebar Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6 custom-scrollbar relative">
          <div className="flex flex-col gap-5">
            {messages.map((msg, i) => (
              <ChatMessageItem
                key={i}
                content={msg.content}
                type={msg.type}
                timestamp={msg.timestamp}
              />
            ))}
            {streamingAiContent && (
              <ChatMessageItem
                content=""
                type="ai"
                timestamp={new Date()}
                isStreaming
                streamingContent={streamingAiContent}
              />
            )}
            {messages.length === 0 && !streamingAiContent && (
              <div className="text-center text-[13px] text-[var(--text-secondary)] mt-8 leading-relaxed">
                Start a conversation to begin building your app.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer / Input Area */}
        <div className="px-2 pb-2 pt-0 flex flex-col gap-3 bg-[var(--bg-main)] shrink-0 relative z-10">
          <div className="absolute bottom-full left-0 right-0 h-16 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to top, var(--bg-main), var(--bg-main-transparent))' }}></div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button className="whitespace-nowrap px-2.5 py-1.5 border border-solid border-white/20 hover:bg-white/10 bg-transparent rounded-[10px] text-[12.5px] font-medium text-white transition-colors">Add feature</button>
            <button className="whitespace-nowrap px-2.5 py-1.5 border border-solid border-white/20 hover:bg-white/10 bg-transparent rounded-[10px] text-[12.5px] font-medium text-white transition-colors">Fix bug</button>
            <button className="whitespace-nowrap px-2.5 py-1.5 border border-solid border-white/20 hover:bg-white/10 bg-transparent rounded-[10px] text-[12.5px] font-medium text-white transition-colors">Improve UI</button>
          </div>

          {selectedElement && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-[12px] text-blue-300">
                <span className="font-mono text-[11px] opacity-70">{selectedElement.tag}</span>
                <span className="max-w-[140px] truncate">{selectedElement.text || selectedElement.selector}</span>
                <button
                  type="button"
                  onClick={() => onElementSelect?.(null)}
                  className="ml-0.5 hover:text-blue-200 transition-colors"
                >
                  <X className="w-3 h-3" strokeWidth={2} />
                </button>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Element selected — prompt will target this element</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#212121] border border-[#333] rounded-[32px] p-4 flex flex-col gap-2 transition-colors">
            <textarea
              ref={textareaRef}
              placeholder="Ask Thinksoft..."
              value={extPromptText}
              onChange={(e) => onPromptTextChange(e.target.value)}
              className="w-full bg-transparent text-[15px] px-1 outline-none focus:outline-none focus:ring-0 border-none resize-none placeholder:text-[#A3A3A3] text-white min-h-[24px] max-h-48 overflow-y-auto custom-scrollbar"
              rows={1}
            />

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className="relative" ref={plusMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className={`w-8 h-8 rounded-full border border-solid border-[#444] bg-transparent flex items-center justify-center transition-all duration-300 ${showPlusMenu ? 'text-white bg-[#333] border-solid border-[#555]' : 'text-[#A3A3A3] hover:text-white hover:bg-[#333]'}`}
                  >
                    <motion.div
                      animate={{ rotate: showPlusMenu ? 45 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex items-center justify-center"
                    >
                      <Plus className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showPlusMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 mb-2 w-[220px] bg-[#1a1a1a] border border-[#333] rounded-[16px] shadow-xl overflow-hidden py-1.5 z-50 flex flex-col"
                      >
                        <div className="flex flex-col mb-1.5">
                          <button type="button" className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <div className="flex items-center gap-2.5">
                              <Settings className="w-[15px] h-[15px] text-white" strokeWidth={1.5} />
                              <span className="text-[13px]">Settings</span>
                            </div>
                            <span className="text-[11px] text-[#888]">Ctrl .</span>
                          </button>
                        </div>
                        <div className="h-[1px] bg-[#333] mx-3 mb-1.5" />
                        <div className="flex flex-col mb-1.5">
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <History className="w-[15px] h-[15px] text-white" strokeWidth={1.5} />
                            <span className="text-[13px]">History</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <Book className="w-[15px] h-[15px] text-white" strokeWidth={1.5} />
                            <span className="text-[13px]">Knowledge</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <GithubIconFilled className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">GitHub</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <GitlabIconFilled className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">GitLab</span>
                          </button>
                          <button type="button" className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <div className="flex items-center gap-2.5">
                              <ConnectorIcon className="w-[15px] h-[15px] text-white" />
                              <span className="text-[13px]">Connectors</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                          </button>
                        </div>
                        <div className="h-[1px] bg-[#333] mx-3 mb-1.5" />
                        <div className="flex flex-col pb-1">
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <ScreenshotIcon className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">Take a screenshot</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <ReferenceIcon className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">Add reference</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <SkillIcon className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">Add skill</span>
                          </button>
                          <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-[#2a2a2a] text-white transition-colors group">
                            <AttachIcon className="w-[15px] h-[15px] text-white" />
                            <span className="text-[13px]">Attach</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="h-8 px-3 flex items-center justify-center transition-colors text-[13px] font-medium text-white hover:bg-[#333] rounded-full">
                  Build <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#A3A3A3]" strokeWidth={2} />
                </button>
                <div className="flex items-center gap-1.5 ml-1">
                  <button type="button" className="w-8 h-8 rounded-full bg-[#333] border-none flex items-center justify-center text-[#E0E0E0] hover:bg-[#444] transition-colors">
                    <Mic className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="submit"
                    disabled={extPromptText.trim().length === 0}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      extPromptText.trim().length > 0
                        ? 'bg-white text-black'
                        : 'bg-[#666] text-[#222]'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Mobile Bottom Sheets */}
        <AnimatePresence>
          {!showMobilePreview && mobileBottomState === 'project' && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileBottomState('default')}
                className="md:hidden absolute inset-0 bg-black/50 z-40" />
              <motion.div key="project" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => { if (info.offset.y > 50) setMobileBottomState('default'); }}
                className="md:hidden absolute bottom-0 left-0 w-full bg-[var(--bg-panel)] p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-6 border-t border-[var(--border-subtle)] z-50 text-[var(--text-primary)]"
              >
                <div className="w-12 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-6"></div>
                <div className="bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-semibold text-[15px]">Credits</span>
                    <span className="text-[13px] text-[var(--text-secondary)] flex items-center gap-0.5">15 left <ChevronRight className="w-[14px] h-[14px]"/></span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border-strong)] rounded-full mb-3 flex overflow-hidden">
                    <div className="w-[80%] h-full bg-[#2E5CFF]"></div>
                    <div className="w-[1px] h-full bg-[var(--bg-panel)]"></div>
                    <div className="flex-1 h-full bg-[#4E7CFF]"></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4D4D4]"></div>
                    Daily credits reset at midnight UTC
                  </div>
                </div>
                <div className="flex flex-col mb-1">
                  <button type="button" className="flex items-center gap-3 px-3 py-[9px] hover:bg-[var(--bg-main)] rounded-xl transition-colors">
                    <Settings className="w-5 h-5 text-[#D4D4D4]" strokeWidth={1.5} />
                    <span className="text-[15px] font-medium flex-1 text-left text-[var(--text-primary)]">Settings</span>
                  </button>
                  <button type="button" className="flex items-center gap-3 px-3 py-[9px] hover:bg-[var(--bg-main)] rounded-xl transition-colors">
                    <Pen className="w-5 h-5 text-[#D4D4D4]" strokeWidth={1.5} />
                    <span className="text-[15px] font-medium flex-1 text-left text-[var(--text-primary)]">Rename project</span>
                  </button>
                  <button onClick={() => setMobileBottomState('appearance')} type="button" className="flex items-center gap-3 px-3 py-[9px] hover:bg-[var(--bg-main)] rounded-xl transition-colors">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[var(--border-subtle)]">
                      <div className="w-full h-full bg-black ml-[50%]"></div>
                    </div>
                    <span className="text-[15px] font-medium flex-1 text-left text-[var(--text-primary)]">Appearance</span>
                    <span className="text-[14px] text-[var(--text-secondary)] flex items-center flex-row gap-0.5 capitalize">dark <ChevronRight className="w-4 h-4 ml-0.5" /></span>
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {!showMobilePreview && mobileBottomState === 'appearance' && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileBottomState('default')}
                className="md:hidden absolute inset-0 bg-black/50 z-40" />
              <motion.div key="appearance" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => { if (info.offset.y > 50) setMobileBottomState('default'); }}
                className="md:hidden absolute bottom-0 left-0 w-full bg-[var(--bg-panel)] p-4 pt-5 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-8 border-t border-[var(--border-subtle)] z-50 text-[var(--text-primary)]"
              >
                <div className="w-10 h-[5px] bg-[var(--border-strong)] rounded-full mx-auto mb-6"></div>
                <div className="flex items-center gap-5 mb-6 relative px-1">
                  <button onClick={() => setMobileBottomState('project')} type="button" className="flex items-center gap-1.5 px-3 py-[7px] bg-[var(--bg-main)] border border-solid border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] rounded-xl text-[14px] font-medium transition-colors border-solid border-[var(--border-strong)]">
                    <ChevronLeft className="w-4 h-4 ml-[-2px]" strokeWidth={2.5} /> Back
                  </button>
                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Appearance</h3>
                </div>
                <div className="grid grid-cols-3 gap-3 px-1">
                  <button type="button" className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-[18px] border border-solid border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all bg-transparent h-[100px]">
                    <div className="w-[20px] h-[20px] rounded-full border-[1.5px] border-[var(--text-primary)] flex overflow-hidden">
                      <div className="w-1/2 h-full bg-transparent"></div>
                      <div className="w-1/2 h-full bg-[var(--text-primary)]"></div>
                    </div>
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">System</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-[18px] border border-solid border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all bg-transparent h-[100px]">
                    <Sun className="w-[22px] h-[22px] text-[var(--text-primary)]" strokeWidth={2} />
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">Light</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-[18px] border border-solid border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all bg-transparent h-[100px]">
                    <Moon className="w-[22px] h-[22px] text-[var(--text-primary)]" strokeWidth={2} />
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">Dark</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col relative ${!showMobilePreview ? 'hidden md:flex' : 'flex'}`}>

        {/* Top Navigation */}
        <div className="hidden md:flex h-12 items-center justify-between px-4 shrink-0 gap-4 md:gap-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowMobilePreview(false)}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-md border border-solid border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  layout
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`flex items-center justify-center h-7 rounded-md border border-solid overflow-hidden transition-colors duration-200 shrink-0 ${
                    isActive
                      ? 'px-2.5 bg-[#1E2B4A] border-solid border-[#3B82F6] text-[#3B82F6]'
                      : 'w-7 bg-transparent border-solid border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  style={{ borderRadius: 6 }}
                >
                  <motion.div layout="position" className="flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </motion.div>
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="whitespace-nowrap flex items-center"
                      >
                        <span className="text-[13px] font-medium pl-1.5 pr-0.5 block">{tab.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          <div className="flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center justify-center shrink-0">
            {activeTab === 'preview' ? (
              <div className="flex items-center gap-3 px-4 py-1.5 bg-transparent border border-[var(--border-subtle)] rounded-full text-[var(--text-primary)] text-xs w-[280px]">
                <button onClick={() => {
                  if (deviceMode === 'desktop') setDeviceMode('tablet');
                  else if (deviceMode === 'tablet') setDeviceMode('mobile');
                  else setDeviceMode('desktop');
                }} className="hover:text-gray-300 transition-colors flex items-center justify-center">
                  {deviceMode === 'mobile' ? <CustomMobileIcon className="w-3.5 h-3.5" /> :
                   deviceMode === 'tablet' ? <CustomTabletIcon className="w-3.5 h-3.5" /> :
                   <Laptop className="w-3.5 h-3.5" />}
                </button>
                <span className="font-bold text-base leading-none">/</span>
                <div className="flex-1"></div>
                <ArrowUpRight className="w-3.5 h-3.5 cursor-pointer transition-colors hover:text-gray-300" />
                <RefreshCw className="w-3.5 h-3.5 cursor-pointer transition-colors hover:text-gray-300" />
              </div>
            ) : (
              <span className="font-semibold text-[15px] capitalize text-[var(--text-primary)]">{activeTab}</span>
            )}
          </div>

          <div className="flex items-center gap-2 relative shrink-0">
            {activeTab === 'preview' && (
              <>
                <button type="button" className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-2)] text-[var(--text-primary)] transition-colors">
                  <MessageSquare className="w-[15px] h-[15px] scale-x-[-1]" strokeWidth={2.5} />
                </button>
                <div className="flex items-center relative">
                  <div className="w-6 h-6 rounded-full bg-[#6BA539] flex items-center justify-center text-[var(--text-primary)] text-xs font-medium relative z-0">P</div>
                  <button onClick={() => setIsSharePopoverOpen(!isSharePopoverOpen)} type="button"
                    className="h-6 px-3 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-2)] rounded-full transition-colors relative z-10 -ml-2"
                  >Share</button>
                </div>
                <button type="button" className="h-7 flex items-center gap-1.5 px-3 text-[13px] font-medium text-[var(--text-primary)] bg-[#635BFF] hover:bg-[#534BE5] rounded-md transition-colors">
                  <Zap className="w-3.5 h-3.5 fill-white stroke-none" />Upgrade
                </button>
                <button type="button" className="h-7 px-3 flex items-center justify-center text-[13px] font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-md transition-colors">Publish</button>

                <AnimatePresence>
                  {isSharePopoverOpen && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-[440px] bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 flex flex-col gap-4">
                        <h3 className="text-[var(--text-primary)] font-semibold text-[17px]">Share project</h3>
                        <input type="text" placeholder="Add people"
                          className="w-full bg-transparent border border-[#666] rounded-lg px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[#D4D4D4] focus:outline-none focus:border-[#888]" />
                        <div className="flex flex-col gap-3">
                          <h4 className="text-[var(--text-primary)] font-semibold text-[13px]">Project access</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)]"><Globe className="w-3.5 h-3.5" /></div>
                              <span className="text-[var(--text-primary)] text-[13px]">People you invited</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#E85D04] flex items-center justify-center text-[var(--text-primary)] text-xs font-medium">P</div>
                              <span className="text-[var(--text-primary)] text-[13px]">Thinksoft</span>
                            </div>
                            <div className="flex items-center gap-1 text-[var(--text-primary)] text-[13px] cursor-pointer">Can edit <ChevronDown className="w-3.5 h-3.5" /></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center text-[var(--text-primary)] text-xs font-medium">P</div>
                              <div className="flex flex-col">
                                <span className="text-[var(--text-primary)] text-[13px]">You</span>
                                <span className="text-[var(--text-secondary)] text-[11px]">email@example.com</span>
                              </div>
                            </div>
                            <span className="text-[var(--text-secondary)] text-[13px]">Owner</span>
                          </div>
                        </div>
                        <button type="button" className="w-full py-2 bg-white hover:bg-gray-100 text-black text-[13px] font-medium rounded-md transition-colors">Create invite link</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            {activeTab === 'code' && (
              <>
                <span className="text-[13px] text-[var(--text-secondary)] mr-2">Read only</span>
                <button type="button" className="h-7 px-3 flex items-center justify-center text-[13px] font-medium text-[var(--text-primary)] bg-[#635BFF] hover:bg-[#534BE5] rounded-md transition-colors">Upgrade</button>
                <button type="button" className="h-7 px-3 flex items-center justify-center text-[13px] font-medium border border-solid border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-md transition-colors">Close</button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'preview' && (
          <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar md:mr-2 md:mb-2 md:border border-[var(--border-main)] md:rounded-2xl bg-[var(--bg-panel)] relative w-full h-full pb-20 md:pb-0">
            {sandboxUrl ? (
              <div
                className="flex items-center justify-center transition-all duration-300 ease-in-out"
                style={{
                  width: deviceMode === 'mobile' ? '375px' : deviceMode === 'tablet' ? '768px' : '100%',
                  height: deviceMode === 'mobile' ? '812px' : deviceMode === 'tablet' ? '1024px' : '100%',
                  maxHeight: deviceMode !== 'desktop' ? '90%' : '100%',
                  borderRadius: deviceMode !== 'desktop' ? deviceMode === 'mobile' ? '36px' : '24px' : '0',
                  overflow: 'hidden',
                  boxShadow: deviceMode !== 'desktop' ? '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                <iframe
                  ref={iframeRef}
                  key={previewKey}
                  src={sandboxUrl + (selRefresh > 0 || textEditRefresh > 0 ? '?v=' + selRefresh + '-' + textEditRefresh : '')}
                  onLoad={handleIframeLoad}
                  className="w-full h-full border-0"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-[var(--bg-main)]" />
            )}

            {/* Floating Toolbar */}
            <motion.div
              onMouseEnter={() => setIsToolbarHovered(true)}
              onMouseLeave={() => setIsToolbarHovered(false)}
              layout
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center px-1.5 py-1.5 rounded-full backdrop-blur-2xl bg-[#1a1a1a]/60 border border-white/20 shadow-2xl z-50 overflow-hidden"
              style={{ paddingLeft: '8px', paddingRight: '8px' }}
            >
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (selectionMode) {
                      setSelectionMode(false);
                      onElementSelect?.(null);
                    } else {
                      if (textEditMode) setTextEditMode(false);
                      setSelectionMode(true);
                    }
                  }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    selectionMode ? 'bg-blue-500/20 text-blue-400' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <CustomInspectIcon className="w-[14px] h-[14px]" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (textEditMode) {
                      setTextEditMode(false);
                    } else {
                      if (selectionMode) {
                        setSelectionMode(false);
                        onElementSelect?.(null);
                      }
                      setTextEditMode(true);
                    }
                  }}
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    textEditMode ? 'bg-blue-500/20 text-blue-400' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Type className="w-[14px] h-[14px]" strokeWidth={1.5} />
                </button>
                <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors">
                  <PenLine className="w-[14px] h-[14px]" strokeWidth={1.5} />
                </button>
                <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors relative">
                  <MessageSquare className="w-[14px] h-[14px]" strokeWidth={1.5} />
                  <span className="absolute top-[6px] right-[6px] w-1.5 h-1.5 bg-[#2E5CFF] rounded-full border-[1.5px] border-[#1a1a1a]"></span>
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isToolbarHovered && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center shrink-0 overflow-hidden"
                  >
                    <div className="w-[1px] h-4 bg-white/20 mx-1.5 shrink-0" />
                    <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors shrink-0">
                      <MoreHorizontal className="w-[14px] h-[14px]" strokeWidth={1.5} />
                    </button>
                    <button type="button" className="w-7 h-7 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors shrink-0">
                      <ChevronRight className="w-[14px] h-[14px]" strokeWidth={1.5} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex-1 flex flex-col mr-2 mb-2 border border-[var(--border-main)] rounded-2xl bg-[var(--bg-panel)] overflow-y-auto custom-scrollbar p-5 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--text-primary)]" />
                <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">Security</h1>
              </div>
            </div>
            <div className="bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div className="flex items-start md:items-center gap-3">
                <div className="w-[40px] h-[40px] rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-[var(--text-primary)] opacity-80" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-[14px] text-[var(--text-primary)] leading-tight">Run your first security scan</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-normal max-w-xl">
                    Scan your project to surface vulnerabilities and risky configuration.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg text-[12px] transition-all shadow-sm cursor-pointer">
                  Deep security scan
                </button>
                <button type="button" className="px-4 py-1.5 border border-solid border-[var(--border-strong)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium rounded-lg text-[12px] transition-all bg-transparent cursor-pointer">
                  Basic security scan
                </button>
              </div>
            </div>
            <div className="border border-[#262626] rounded-xl bg-[#141416] flex-1 flex flex-col min-h-[300px] relative mb-5">
              <div className="p-4 border-b border-[#262626]">
                <h3 className="font-semibold text-[16px] text-white tracking-tight">Detected Issues</h3>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center rounded-full mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-[14px] text-[var(--text-primary)] mb-1">No scan has run yet</h4>
                <p className="text-[12px] text-[var(--text-secondary)] max-w-sm">
                  Run a security scan to surface issues.
                </p>
              </div>
            </div>
            <div className="bg-[#1e1e1e] border border-[var(--border-subtle)] rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-[var(--text-primary)] opacity-80" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-semibold text-[15px] text-white leading-tight">Project dependencies</h3>
                  <p className="text-[12px] text-[#d4d4d8] mt-0.5">Packages will appear here</p>
                </div>
              </div>
              <button type="button" className="px-3 py-1 border border-solid border-[#3f3f46] hover:bg-[#27272a] text-white font-medium rounded-lg text-[13px] transition-colors bg-transparent cursor-pointer">Review</button>
            </div>
          </div>
        )}

        {activeTab === 'graph' && <GraphView sandboxId={sandboxId} />}

        {activeTab === 'secrets' && <SecretsView />}

        {activeTab === 'code' && (
          <div className="flex-1 flex overflow-hidden mr-2 mb-2 border border-[var(--border-main)] rounded-2xl bg-[#1E1E1E] relative">
            {/* File Explorer */}
            <div className="w-[240px] border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-panel)] shrink-0">
              <div className="p-3">
                <div className="bg-transparent border border-white/50 rounded-md px-2.5 py-1.5 flex items-center">
                  <input type="text" placeholder="Search code" className="bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-primary)] outline-none w-full" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 text-[13px] text-[var(--text-primary)]">
                {files.length === 0 ? (
                  <div className="text-xs text-[#4A4A4A] text-center mt-10 px-2">No files generated yet.</div>
                ) : (
                  (() => {
                    const roots: { name: string; path: string; isDir: boolean; children: any[] }[] = [];
                    const expandedFolders = new Set<string>();
                    for (const file of files) {
                      const parts = file.path.replace(/^\//, '').split('/');
                      let current = roots;
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
                    const renderNode = (node: any, depth: number): React.ReactNode => {
                      const expanded = localExpanded.has(node.path);
                      const getIcon = (name: string) => {
                        const ext = name.split('.').pop()?.toLowerCase();
                        if (['jpg','jpeg','png','gif','svg','ico','webp'].includes(ext||'')) return <Image className="w-4 h-4 text-[var(--text-primary)]" />;
                        if (['txt','md'].includes(ext||'')) return <FileText className="w-4 h-4 text-[var(--text-primary)]" />;
                        if (['lock','lockb'].includes(ext||'')) return <Paperclip className="w-4 h-4 text-[var(--text-primary)]" />;
                        return <File className="w-4 h-4 text-[var(--text-primary)]" />;
                      };
                      return (
                        <div key={node.path}>
                          <div className={`py-1.5 px-2 rounded cursor-pointer flex items-center gap-2 ${
                            selectedFile === node.path ? 'bg-[#2A2D3D]' : 'hover:bg-[#2A2A2A]'
                          }`}
                            style={{ paddingLeft: `${8 + depth * 20}px` }}
                            onClick={() => {
                              if (node.isDir) {
                                const next = new Set(localExpanded);
                                if (next.has(node.path)) next.delete(node.path); else next.add(node.path);
                                setLocalExpanded(next);
                              } else if (onFileSelect) onFileSelect(node.path);
                            }}
                          >
                            {node.isDir ? (
                              expanded ? <ChevronDown className="w-4 h-4 text-[var(--text-primary)] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--text-primary)] shrink-0" />
                            ) : getIcon(node.name)}
                            <span className="truncate">{node.name}</span>
                          </div>
                          {node.isDir && expanded && node.children.map((c: any) => renderNode(c, depth + 1))}
                        </div>
                      );
                    };
                    return roots.map((r: any) => renderNode(r, 0));
                  })()
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col bg-[#1E1E1E]">
              <div className="h-10 flex items-center justify-between pr-3 bg-[var(--bg-panel)]">
                <div className="flex items-center h-full">
                  {selectedFile && (
                    <div className="h-full px-4 flex items-center gap-2.5 bg-[#1E1E1E] border-r border-[var(--border-main)] text-[13px] text-[var(--text-primary)]">
                      {selectedFile}
                      <X className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer ml-1" onClick={() => onFileSelect?.('')} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <CustomCopyIcon className="w-4 h-4 text-[var(--text-primary)] hover:text-[var(--text-primary)] cursor-pointer" />
                  <button type="button" className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-100 text-black text-xs font-medium rounded transition-colors ml-1">
                    <Download className="w-3.5 h-3.5" />Download
                  </button>
                </div>
              </div>
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
                    customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8125rem', background: '#1E1E1E', minHeight: '100%' }}
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

      {/* Mobile Action Bar */}
      {showMobilePreview && (
        <div className="md:hidden absolute bottom-0 left-0 w-full z-50">
          <AnimatePresence>
            {mobileBottomState === 'default' && (
              <motion.div key="default" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 w-full bg-[var(--bg-panel)] p-4 flex items-center justify-between shadow-[0_-1px_0_rgba(255,255,255,0.05)]"
              >
                <button onClick={() => setShowMobilePreview(false)} type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-solid border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors"
                ><ChevronLeft className="w-4 h-4" />Chat</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setMobileBottomState('recording')} type="button" className="w-10 h-10 rounded-full border border-solid border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
                    <Mic className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                  <button type="button" className="w-10 h-10 rounded-full border border-solid border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
                    <RefreshCw className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                  <button onClick={() => setMobileBottomState('slash')} type="button" className="w-10 h-10 rounded-full border border-solid border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
                    <span className="font-mono text-lg text-[var(--text-primary)] leading-none">/</span>
                  </button>
                  <button onClick={() => setMobileBottomState('share')} type="button" className="w-10 h-10 rounded-full border border-solid border-[var(--border-subtle)] flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors">
                    <Upload className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                </div>
              </motion.div>
            )}
            {mobileBottomState === 'recording' && (
              <motion.div key="recording" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 w-full bg-[var(--bg-panel)] p-4 flex items-center justify-center shadow-[0_-1px_0_rgba(255,255,255,0.05)]"
              >
                <div className="w-full max-w-sm bg-[var(--bg-hover)] rounded-full p-2 flex items-center shadow-lg border border-[var(--border-subtle)]">
                  <div className="flex-1 px-4 flex items-center justify-center opacity-70">
                    <span className="text-[var(--text-primary)] font-bold tracking-widest text-xs">|||&#183;&#183;&#183;&#183;|||||||&#183;&#183;|||||</span>
                  </div>
                  <button onClick={() => setMobileBottomState('default')} type="button" className="w-10 h-10 shrink-0 bg-[var(--border-strong)] hover:bg-[#4A4A4A] transition-colors shadow flex items-center justify-center rounded-full mr-2">
                    <X className="w-5 h-5 text-[var(--text-primary)]" />
                  </button>
                  <button onClick={() => setMobileBottomState('transcribing')} type="button" className="w-10 h-10 shrink-0 bg-white hover:bg-gray-200 transition-colors text-black flex items-center justify-center rounded-full">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
            {(mobileBottomState === 'transcribing' || mobileBottomState === 'transcribed') && (
              <motion.div key="transcribing" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 w-full bg-[var(--bg-panel)] pt-3 pb-6 px-4 shadow-[0_-1px_0_rgba(255,255,255,0.05)]"
              >
                <div className="w-full bg-[var(--bg-input)] rounded-3xl p-4 flex flex-col shadow-lg min-h-[100px] relative border border-[var(--border-subtle)]">
                  <div className="text-[var(--text-primary)] text-sm mb-4">
                    {mobileBottomState === 'transcribing' ? 'Transcribing...' : transcriptText || 'Voice input'}
                  </div>
                  <div className="flex items-center gap-3 absolute bottom-3 right-3 text-[var(--text-primary)]">
                    <button onClick={() => setMobileBottomState('default')} type="button" className="w-10 h-10 bg-[var(--bg-hover)] border border-solid border-[var(--border-subtle)] rounded-full flex items-center justify-center hover:bg-[var(--bg-hover-2)] transition-colors">
                      <Trash className="w-4 h-4 text-[var(--text-primary)]/70" />
                    </button>
                    <button onClick={() => { if(mobileBottomState === 'transcribed') setMobileBottomState('default'); }} type="button"
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${mobileBottomState === 'transcribing' ? 'bg-[var(--border-strong)] text-[var(--text-primary)]/50 cursor-not-allowed' : 'bg-white text-black'}`}
                    ><ArrowUp className="w-5 h-5" strokeWidth={2.5} /></button>
                  </div>
                </div>
              </motion.div>
            )}
            {mobileBottomState === 'slash' && (
              <motion.div key="slash" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => { if (info.offset.y > 50) setMobileBottomState('default'); }}
                className="absolute bottom-0 w-full bg-[var(--bg-panel)] p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-6 border-t border-[var(--border-subtle)]"
              >
                <div className="w-12 h-1 bg-[var(--bg-hover-2)] rounded-full mx-auto mb-6"></div>
                <div className="flex items-center gap-2 mb-3 bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-xl px-4 py-3">
                  <span className="font-mono text-[var(--text-primary)]">/</span>
                  <div className="flex-1"></div>
                  <button onClick={() => setMobileBottomState('default')} type="button" className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-hover-2)] transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => setMobileBottomState('default')} type="button" className="w-full py-3 mb-3 border border-solid border-[var(--border-subtle)] hover:bg-[var(--bg-main)] flex items-center justify-center gap-2 text-[var(--text-primary)] text-[15px] font-medium rounded-xl transition-colors">
                  <History className="w-4 h-4" /> History
                </button>
                <button type="button" className="w-full py-3 bg-[#2E5CFF] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 text-[15px] font-medium rounded-xl transition-colors">
                  <Globe className="w-4 h-4" /> Open in browser
                </button>
              </motion.div>
            )}
            {mobileBottomState === 'share' && (
              <motion.div key="share" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(e, info) => { if (info.offset.y > 50) setMobileBottomState('default'); }}
                className="absolute bottom-0 w-full bg-[var(--bg-input)] p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col pb-6 border-t border-[var(--border-subtle)]"
              >
                <div className="w-12 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-6"></div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[var(--text-primary)] font-semibold text-lg">Share project</h3>
                  <button type="button" className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5 hover:text-gray-300 transition-colors"><Link className="w-4 h-4" /> Share invite link</button>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  <input type="text" placeholder="Invite by email" className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[var(--text-primary)] placeholder:text-gray-500 outline-none text-[15px]" />
                  <button type="button" className="px-5 py-3 bg-[var(--border-strong)] hover:bg-[#4A4A4A] transition-colors text-[var(--text-primary)] font-medium rounded-xl border border-solid border-[#4A4A4A]">Invite</button>
                </div>
                <button onClick={() => setMobileBottomState('default')} type="button" className="w-full py-3 border border-solid border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] flex items-center justify-center gap-2 text-[var(--text-primary)] text-[15px] font-medium rounded-xl transition-colors">
                  <Link className="w-4 h-4" /> Share preview
                </button>
                <button onClick={() => setMobileBottomState('default')} type="button" className="w-full py-3 bg-[#2E5CFF] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 text-[15px] font-medium rounded-xl transition-colors">
                  <Upload className="w-4 h-4" /> Publish project
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
