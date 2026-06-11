"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PanelLeftClose,
  ChevronDown,
  Gift,
  Zap,
  Plus,
  Inbox,
  Search,
  MoreHorizontal,
  LayoutGrid,
  List,
  Star,
  Link2,
  ArrowUpRight,
  BarChart2,
  Edit2,
  Settings,
  Trash2,
  Check,
  Info
} from 'lucide-react';
import { SearchModal } from '@/thinksoft-ui-clone/components/SearchModal';
import { ConnectorsModal } from '@/thinksoft-ui-clone/components/ConnectorsModal';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import '@/thinksoft-ui-clone/home-overrides.css';

const logo = '/thinksoft-logo.png';

const Tooltip = ({ children, text, shortcut, position = 'right' }: { children: React.ReactNode, text: string, shortcut?: string, position?: 'right' | 'top' }) => {
  return (
    <div className="relative group/tooltip flex items-center justify-center">
      {children}
      <div className={`absolute ${position === 'right' ? 'left-full ml-3 top-1/2 -translate-y-1/2 translate-x-[-4px] group-hover/tooltip:translate-x-0' : 'bottom-full mb-3 left-1/2 -translate-x-1/2 translate-y-[4px] group-hover/tooltip:translate-y-0'} px-3 py-2 bg-[#1e1e1e] text-[#eeeeee] text-[13px] font-medium rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 delay-150 ease-out pointer-events-none whitespace-nowrap flex items-center gap-2 z-[100] shadow-2xl border border-white/10`}>
        {text}
        {shortcut && (
          <span className="bg-[#333] px-1.5 py-0.5 rounded-md text-[11px] text-neutral-300 font-semibold tracking-wide">
            {shortcut}
          </span>
        )}
      </div>
    </div>
  );
};

const CustomHome = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><line x1="9" y1="16" x2="15" y2="16" /></svg>
);
const CustomSearch = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const CustomGrid = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></svg>
);
const CustomStar = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const CustomUser = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CustomUsers = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const CustomPanelLeft = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></svg>
);
const CustomConnector = ({ size = 16, className = "" }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="7" cy="7" r="3.5" /><circle cx="17" cy="7" r="3.5" /><circle cx="7" cy="17" r="3.5" /><path d="M10.5 17h3a3.5 3.5 0 0 0 3.5-3.5v-3" /></svg>
);

const SidebarItem = ({ icon: Icon, label, active = false, badge = null, rightElement = null, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${active ? 'bg-neutral-800/50 text-white' : 'text-white hover:bg-neutral-800/30'}`}>
    <div className="flex items-center gap-3">
      {Icon && <Icon size={14} className="text-white" />}
      <span className="font-normal">{label}</span>
    </div>
    {badge && <span className="text-[9px] font-semibold bg-neutral-800 text-white px-1.5 py-0.5 rounded border border-neutral-700">{badge}</span>}
    {rightElement}
  </button>
);

const ProjectItem = ({ label }: { label: string }) => (
  <button className="w-full flex items-center px-3 py-1.5 rounded-lg text-[13px] text-white hover:bg-neutral-800/30 transition-colors">
    <span className="truncate font-normal">{label}</span>
  </button>
);

interface ProjectData {
  id: string;
  title: string;
  creator_name: string;
  avatar: string;
  prompt: string;
  sandbox_id: string;
  created_at: string;
  updated_at: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Edited ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Edited ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `Edited ${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCreatedAt(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [starredProjects, setStarredProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const seen = new Set<string>();
          setProjects(data.filter((p: any) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          }));
        }
      } catch (e) {
        console.error('[projects] Failed to load', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  const activeProjects = projects.filter(p => {
    const diff = Date.now() - new Date(p.updated_at).getTime();
    return diff < 14 * 86400000;
  });

  const inactiveProjects = projects.filter(p => {
    const diff = Date.now() - new Date(p.updated_at).getTime();
    return diff >= 14 * 86400000;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleStar = (id: string) => {
    setStarredProjects(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleRename = async (id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (e) {
      console.error('[projects] Failed to rename', e);
    }
  };

  const filteredActiveProjects = activeProjects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactiveProjects = inactiveProjects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#171717] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex-shrink-0 relative z-50 h-full bg-[#171717]"
      >
        <AnimatePresence initial={false}>
          {isSidebarOpen ? (
            <motion.div
              key="open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full overflow-hidden"
            >
              <div className="w-[240px] flex flex-col h-full">
                {/* Top Section */}
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <img src={logo} alt="Logo" className="w-6 h-6 object-contain rounded-md" />
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-white transition-colors cursor-ew-resize"
                    >
                      <CustomPanelLeft size={18} />
                    </button>
                  </div>

                  <button className="flex items-center justify-between w-full px-3 py-2 bg-neutral-800/40 hover:bg-neutral-800/60 rounded-lg border border-neutral-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center text-[11px] font-bold text-white">P</div>
                      <span className="text-[13px] font-semibold text-white">Prasuk's Lovable</span>
                    </div>
                    <ChevronDown size={14} className="text-white" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar px-2 pb-4 flex flex-col gap-6">
                  {/* Main Nav */}
                  <div className="flex flex-col gap-0.5">
                    <SidebarItem icon={CustomHome} label="Home" onClick={() => router.push('/')} />
                    <div onClick={() => setIsSearchOpen(true)}>
                      <SidebarItem icon={CustomSearch} label="Search" badge="Ctrl K" />
                    </div>
                    <div onClick={() => setIsConnectorsOpen(true)}>
                      <SidebarItem icon={CustomConnector} label="Connectors" />
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="flex flex-col gap-0.5">
                    <div className="px-3 py-2 text-[13px] font-semibold text-[#a3a3a3]">Projects</div>
                    <SidebarItem icon={CustomGrid} label="All projects" active />
                    <SidebarItem icon={CustomStar} label="Starred" />
                    <SidebarItem icon={CustomUser} label="Created by me" />
                    <SidebarItem icon={CustomUsers} label="Shared with me" />
                  </div>

                  {/* Recents */}
                  <div className="flex flex-col gap-0.5">
                    <div className="px-3 py-2 text-[13px] font-semibold text-[#a3a3a3]">Recents</div>
                    <ProjectItem label="Vibe Clone Studio" />
                    <ProjectItem label="Landing Page Spark" />
                    <ProjectItem label="SchoolDash Premium" />
                    <ProjectItem label="Stream Central (82)" />
                    <ProjectItem label="Stream Scene" />
                    <ProjectItem label="Shop & Sign" />
                    <ProjectItem label="Image Weaver" />
                    <ProjectItem label="AI Launchpad" />
                    <ProjectItem label="AI Launchpad (91)" />
                    <ProjectItem label="Stream Central" />
                    <ProjectItem label="SaaS Launchpad" />
                    <ProjectItem label="ali-echo-clone-kit" />
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="p-4 flex flex-col gap-2 border-t border-neutral-800/50">
                  <button className="flex items-center justify-between w-full p-3 bg-[#1c1c1c] hover:bg-[#252525] rounded-xl border border-white/5 transition-colors group">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[13px] font-semibold text-white">Share Lovable</span>
                      <span className="text-[11px] text-white">100 credits per paid referral</span>
                    </div>
                    <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-white transition-colors">
                      <Gift size={12} />
                    </div>
                  </button>

                  <button className="flex items-center justify-between w-full p-3 bg-[#1c1c1c] hover:bg-[#252525] rounded-xl border border-white/5 transition-colors group mt-1">
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[13px] font-semibold text-white">Upgrade to Pro</span>
                      <span className="text-[11px] text-white">Unlock more features</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#2b2d42] flex items-center justify-center text-white transition-colors">
                      <Zap size={12} className="fill-white" />
                    </div>
                  </button>

                  <div className="flex items-center justify-between mt-4 px-1">
                    <div className="w-6 h-6 rounded-full bg-[#5c9c49] flex items-center justify-center text-xs font-bold text-white">
                      P
                    </div>
                    <button className="text-white transition-colors">
                      <Inbox size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-[64px] flex flex-col items-center py-5"
            >
              <Tooltip text="Open sidebar" shortcut="Ctrl B">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-white mb-6 hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-ew-resize"
                >
                  <CustomPanelLeft size={16} />
                </button>
              </Tooltip>

              <div className="w-6 h-6 rounded-[5px] bg-[#e35a1e] flex items-center justify-center text-[11px] font-bold text-white mb-8 shadow-sm">
                P
              </div>

              <div className="flex flex-col gap-2 w-full items-center">
                <Tooltip text="Home">
                  <button onClick={() => router.push('/')} className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <line x1="9" y1="16" x2="15" y2="16" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Open search (⌘K)">
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Connectors">
                  <button
                    onClick={() => setIsConnectorsOpen(true)}
                    className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  >
                    <CustomConnector size={14} />
                  </button>
                </Tooltip>
              </div>

              <div className="flex flex-col gap-2 w-full items-center mt-6">
                <Tooltip text="All projects">
                  <button className="text-white bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="7" r="3" />
                      <circle cx="17" cy="7" r="3" />
                      <circle cx="7" cy="17" r="3" />
                      <circle cx="17" cy="17" r="3" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Starred">
                  <button className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Created by me">
                  <button className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text="Shared with me">
                  <button className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </button>
                </Tooltip>
              </div>

              <div className="mt-auto flex flex-col items-center gap-4">
                <div className="w-7 h-7 rounded-full bg-[#5c9c49] flex items-center justify-center text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity">
                  P
                </div>
                <Tooltip text="Inbox">
                  <button className="text-white hover:bg-[#333333] w-9 h-9 flex items-center justify-center rounded-xl transition-colors">
                    <Inbox size={18} strokeWidth={1.5} />
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col overflow-hidden rounded-[32px] bg-[#050505] m-3 ml-2 border border-white/5 shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight">Projects</h1>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-10">
            <div className="relative flex-1 xl:mr-8">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[#e0e0e0] rounded-lg pl-10 pr-4 py-1.5 text-[13px] border border-white/20 focus:border-white/40 focus:outline-none transition-colors placeholder:text-[#a0a0a0]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SortDropdown />
              <VisibilityDropdown />
              <StatusDropdown />
              <CreatorsDropdown />

              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center bg-[#222] rounded-[10px] p-1 ml-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#141414] text-[#e0e0e0] shadow-sm' : 'text-[#a0a0a0] hover:text-[#e0e0e0]'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#141414] text-[#e0e0e0] shadow-sm' : 'text-[#a0a0a0] hover:text-[#e0e0e0]'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-[#a0a0a0] text-[14px]">Loading projects...</span>
              </div>
            </div>
          ) : projects.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-xl bg-neutral-800/50 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#666]">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className="text-white text-[16px] font-medium mb-1">No projects yet</h3>
              <p className="text-[#a0a0a0] text-[13px] mb-6">Start by creating your first project from the home page.</p>
              <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-white text-black rounded-xl font-semibold text-[13px] hover:bg-neutral-200 transition-colors">
                Create your first project
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              {/* Active Section */}
              <div className="mb-12">
                <h2 className="text-[13px] font-semibold text-[#a0a0a0] mb-4 tracking-wide">Active in last 14 days</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
                  {/* Create New */}
                  <div onClick={() => router.push('/')} className="group cursor-pointer flex flex-col">
                    <div className="aspect-video bg-transparent border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center group-hover:border-white/40 transition-colors mb-3">
                      <Plus className="w-6 h-6 text-[#666] group-hover:text-[#888] transition-colors" />
                    </div>
                    <h3 className="text-[#e0e0e0] font-medium text-[14px] px-1">Create new project</h3>
                  </div>

                  {filteredActiveProjects.map(project => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      edited={formatTimeAgo(project.updated_at)}
                      image={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=333&color=fff&size=400`}
                      avatar={project.creator_name?.charAt(0)?.toUpperCase() || 'Y'}
                      avatarColor="bg-[#659b4a]"
                      isStarred={starredProjects.includes(project.id)}
                      onToggleStar={toggleStar}
                      onRename={handleRename}
                      onClick={() => router.push(`/generation?projectId=${project.id}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Inactive Section */}
              {filteredInactiveProjects.length > 0 && (
                <div>
                  <h2 className="text-[13px] font-semibold text-[#a0a0a0] mb-4 tracking-wide">Inactive 60+ days</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
                    {filteredInactiveProjects.map(project => (
                      <ProjectCard
                        key={project.id}
                        id={project.id}
                        title={project.title}
                        edited={formatTimeAgo(project.updated_at)}
                        image={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=333&color=fff&size=400`}
                        avatar={project.creator_name?.charAt(0)?.toUpperCase() || 'Y'}
                        avatarColor="bg-[#659b4a]"
                        isStarred={starredProjects.includes(project.id)}
                        onToggleStar={toggleStar}
                        onRename={handleRename}
                        onClick={() => router.push(`/generation?projectId=${project.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col w-full">
              {/* List Header */}
              <div className="grid grid-cols-[116px_minmax(300px,2.5fr)_minmax(200px,1fr)_minmax(150px,1fr)_40px] gap-4 px-3 mb-6 text-[13px] font-medium text-[#a0a0a0]">
                <div></div>
                <div>Name</div>
                <div>Created at</div>
                <div>Created by</div>
                <div></div>
              </div>

              {/* Active Section */}
              <div className="mb-8">
                <h2 className="text-[13px] font-semibold text-[#e0e0e0] mb-4 px-3 tracking-wide">Active in last 14 days</h2>
                <div className="flex flex-col gap-2">
                  {filteredActiveProjects.map(project => (
                    <ProjectListItem
                      key={project.id}
                      id={project.id}
                      title={project.title}
                      edited={formatTimeAgo(project.updated_at)}
                      createdAt={formatCreatedAt(project.created_at)}
                      creator={project.creator_name || 'You'}
                      image={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=333&color=fff&size=400`}
                      avatar={project.creator_name?.charAt(0)?.toUpperCase() || 'Y'}
                      avatarColor="bg-[#659b4a]"
                      isStarred={starredProjects.includes(project.id)}
                      onToggleStar={toggleStar}
                      onRename={handleRename}
                      onClick={() => router.push(`/generation?projectId=${project.id}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Inactive Section */}
              {filteredInactiveProjects.length > 0 && (
                <div>
                  <h2 className="text-[13px] font-semibold text-[#e0e0e0] mb-4 px-3 tracking-wide">Inactive 60+ days</h2>
                  <div className="flex flex-col gap-2">
                    {filteredInactiveProjects.map(project => (
                      <ProjectListItem
                        key={project.id}
                        id={project.id}
                        title={project.title}
                        edited={formatTimeAgo(project.updated_at)}
                        createdAt={formatCreatedAt(project.created_at)}
                        creator={project.creator_name || 'You'}
                        image={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.title)}&background=333&color=fff&size=400`}
                        avatar={project.creator_name?.charAt(0)?.toUpperCase() || 'Y'}
                        avatarColor="bg-[#659b4a]"
                        isStarred={starredProjects.includes(project.id)}
                        onToggleStar={toggleStar}
                        onRename={handleRename}
                        onClick={() => router.push(`/generation?projectId=${project.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ConnectorsModal isOpen={isConnectorsOpen} onClose={() => setIsConnectorsOpen(false)} />
    </div>
  );
}

const ProjectListItem = ({ id, title, edited, createdAt, creator, image, avatar, avatarColor, isStarred, onToggleStar, onClick }: any) => (
  <div onClick={onClick} className="group grid grid-cols-[116px_minmax(300px,2.5fr)_minmax(200px,1fr)_minmax(150px,1fr)_40px] gap-4 items-center px-3 py-1.5 hover:bg-white/5 transition-colors rounded-xl cursor-pointer">
    <div className="w-[116px] h-[65px] bg-[#141414] rounded-lg overflow-hidden shrink-0 border border-white/10">
      <img src={image} alt={title} className="w-full h-full object-cover" />
    </div>
    <div className="flex flex-col justify-center">
      <h3 className="text-[#e0e0e0] font-medium text-[14px] leading-tight mb-1 group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-[#a0a0a0] text-[12px] leading-tight">{edited}</p>
    </div>
    <div className="text-[#a0a0a0] text-[13px]">
      {createdAt}
    </div>
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0 ${avatarColor}`}>
        {avatar}
      </div>
      <span className="text-[#e0e0e0] text-[13px]">{creator}</span>
    </div>
    <div className="flex justify-end pr-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(id);
        }}
        className="focus:outline-none"
      >
        <Star
          className={`w-4 h-4 transition-colors ${
            isStarred
              ? "text-yellow-400 fill-yellow-400"
              : "text-[#666] group-hover:text-[#a0a0a0]"
          }`}
        />
      </button>
    </div>
  </div>
);

const Dropdown = ({ label }: { label: string }) => (
  <button className="flex items-center gap-2 bg-transparent hover:bg-white/5 text-[#e0e0e0] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors border border-white/20">
    {label}
    <ChevronDown className="w-4 h-4 text-[#a0a0a0] ml-1" />
  </button>
);

const SortDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-transparent hover:bg-white/5 text-[#e0e0e0] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${isOpen ? 'border-[#555] bg-white/5' : 'border-white/20'}`}
      >
        Last edited
        <ChevronDown className="w-4 h-4 text-[#a0a0a0] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[200px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-50 py-1.5">
          <div className="px-4 py-2">
            <span className="text-[#888] text-[13px] font-medium">Sort by</span>
          </div>

          <div className="flex flex-col">
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Last edited</span>
              <Check className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Last viewed</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Created</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Name</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors cursor-default">
              <span className="text-[#666] text-[13px] font-medium">Relevance</span>
              <Info className="w-4 h-4 text-[#666]" />
            </button>
          </div>

          <div className="h-px bg-[#333] my-1.5" />

          <div className="px-4 py-2">
            <span className="text-[#888] text-[13px] font-medium">Order</span>
          </div>

          <div className="flex flex-col">
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Newest first</span>
              <Check className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Oldest first</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VisibilityDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-transparent hover:bg-white/5 text-[#e0e0e0] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${isOpen ? 'border-[#555] bg-white/5' : 'border-white/20'}`}
      >
        Any visibility
        <ChevronDown className="w-4 h-4 text-[#a0a0a0] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[180px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-50 py-1.5">
          <div className="px-4 py-2">
            <span className="text-[#888] text-[13px] font-medium">Visibility</span>
          </div>

          <div className="flex flex-col">
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Any visibility</span>
              <Check className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Public</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Workspace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-transparent hover:bg-white/5 text-[#e0e0e0] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${isOpen ? 'border-[#555] bg-white/5' : 'border-white/20'}`}
      >
        Any status
        <ChevronDown className="w-4 h-4 text-[#a0a0a0] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[200px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-50 py-1.5">
          <div className="px-4 py-2">
            <span className="text-[#888] text-[13px] font-medium">Publish status</span>
          </div>

          <div className="flex flex-col">
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Any status</span>
              <Check className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">All published</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Internally published</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Externally published</span>
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Not published</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatorsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-transparent hover:bg-white/5 text-[#e0e0e0] px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${isOpen ? 'border-[#555] bg-white/5' : 'border-white/20'}`}
      >
        All creators
        <ChevronDown className="w-4 h-4 text-[#a0a0a0] ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-[240px] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-50 py-1.5">
          <div className="px-4 py-2">
            <span className="text-[#888] text-[13px] font-medium">Creator</span>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a0a0a0]" />
              <input
                type="text"
                placeholder="Search creators..."
                className="w-full bg-transparent text-[#e0e0e0] rounded-md pl-8 pr-3 py-1.5 text-[13px] focus:outline-none transition-colors placeholder:text-[#a0a0a0]"
              />
            </div>
          </div>

          <div className="h-px bg-[#333] mb-1.5" />

          <div className="flex flex-col">
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">All creators</span>
              <Check className="w-4 h-4 text-[#a0a0a0]" />
            </button>
            <button className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-white/5 transition-colors">
              <span className="text-[#e0e0e0] text-[13px] font-medium">Think (You)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ id, title, edited, image, avatar, avatarColor, isStarred, onToggleStar, onRename, onClick }: any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (editTitle.trim() && editTitle !== title) {
      onRename(id, editTitle.trim());
    } else {
      setEditTitle(title);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(title);
      setIsRenaming(false);
    }
  };

  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col relative">
      <div className="aspect-video bg-transparent rounded-xl overflow-hidden mb-3 relative border border-white/20">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

        {/* Hover Star Icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(id);
            }}
            className="bg-[#222]/80 hover:bg-[#333] backdrop-blur-sm p-2 rounded-lg transition-colors"
          >
            <Star className={`w-4 h-4 ${isStarred ? "text-yellow-400 fill-yellow-400" : "text-[#e0e0e0]"}`} />
          </button>
        </div>
      </div>
      <div className="flex items-start gap-3 relative">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-medium shrink-0 ${avatarColor}`}>
          {avatar}
        </div>
        <div className="flex flex-col justify-center min-h-[28px] flex-1">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              className="bg-[#141414] text-white font-medium text-[14px] leading-tight mb-1 border border-blue-500 rounded px-1 outline-none w-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="text-[#e0e0e0] font-medium text-[14px] leading-tight mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">{title}</h3>
          )}
          <p className="text-[#a0a0a0] text-[12px] leading-tight">{edited}</p>
        </div>

        {/* Hover Action Icons */}
        <div className={`flex items-center gap-1 transition-opacity self-center ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button className="p-1.5 text-[#a0a0a0] hover:text-[#e0e0e0] transition-colors rounded-md hover:bg-white/5">
            <Link2 className="w-4 h-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1.5 transition-colors rounded-md hover:bg-white/5 ${isMenuOpen ? 'text-[#e0e0e0] bg-white/5' : 'text-[#a0a0a0] hover:text-[#e0e0e0]'}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-1.5 z-50">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-[#a0a0a0]" />
                  View published site
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors">
                  <BarChart2 className="w-4 h-4 text-[#a0a0a0]" />
                  Analytics
                </button>
                <div className="h-px bg-white/10 my-1.5 mx-3" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setIsRenaming(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#a0a0a0]" />
                  Rename
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors">
                  <Settings className="w-4 h-4 text-[#a0a0a0]" />
                  Settings
                </button>
                <div className="h-px bg-white/10 my-1.5 mx-3" />
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors">
                  <Trash2 className="w-4 h-4 text-[#a0a0a0]" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
