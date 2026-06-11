'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, FileCode, Search, Package, Upload, CheckCircle2 } from 'lucide-react';

export type GenerationCardStatus = 
  | 'thinking' 
  | 'reviewing' 
  | 'editing' 
  | 'creating' 
  | 'reading' 
  | 'working' 
  | 'searching' 
  | 'installing' 
  | 'applying' 
  | 'completed';

export interface GenerationCardProps {
  status: GenerationCardStatus;
  title?: string;
  description?: string;
  currentFile?: string;
  files?: string[];
  summary?: string;
  isVisible: boolean;
  onDetailsClick?: () => void;
  onPreviewClick?: () => void;
  onBookmarkClick?: () => void;
  isBookmarked?: boolean;
}

function TextShimmer({ text, duration = 1.2 }: { text: string; duration?: number }) {
  return (
    <span
      className="inline-block bg-gradient-to-r from-white/30 via-white/90 to-white/30 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer"
      style={{ animationDuration: `${duration}s` }}
    >
      {text}
    </span>
  );
}

function StatusLabel({ status }: { status: GenerationCardStatus }) {
  const statusMap: Record<string, { text: string; icon: React.ReactNode }> = {
    thinking: { text: 'Thinking', icon: null },
    reviewing: { text: 'Reviewing', icon: null },
    editing: { text: 'Edited', icon: <FileCode className="w-3 h-3" /> },
    creating: { text: 'Created', icon: <FileCode className="w-3 h-3" /> },
    reading: { text: 'Read', icon: <FileCode className="w-3 h-3" /> },
    working: { text: 'Working', icon: null },
    searching: { text: 'Searching web', icon: <Search className="w-3 h-3" /> },
    installing: { text: 'Installing packages', icon: <Package className="w-3 h-3" /> },
    applying: { text: 'Applying to sandbox', icon: <Upload className="w-3 h-3" /> },
    completed: { text: 'Completed', icon: <CheckCircle2 className="w-3 h-3" /> },
  };

  const info = statusMap[status] || { text: 'Working', icon: null };
  const isAnimated = status === 'thinking' || status === 'working' || status === 'reviewing' || status === 'searching' || status === 'installing' || status === 'applying';

  return (
    <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-primary)]">
      {info.icon}
      {isAnimated ? (
        <TextShimmer text={info.text} />
      ) : (
        <span>{info.text}</span>
      )}
    </span>
  );
}

function FilePill({ filename, action }: { filename: string; action: string }) {
  const cleanName = filename.split('/').pop() || filename;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-[var(--text-secondary)]"
    >
      <FileCode className="w-3 h-3 opacity-60" />
      <span>{cleanName}</span>
    </motion.div>
  );
}

function ActiveCard({ status, description, currentFile }: { status: GenerationCardStatus; description?: string; currentFile?: string }) {
  const isFileAction = status === 'editing' || status === 'creating' || status === 'reading';
  const actionLabel = status === 'editing' ? 'Edited' : status === 'creating' ? 'Created' : status === 'reading' ? 'Read' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <StatusLabel status={status} />
        {isFileAction && currentFile && (
          <FilePill filename={currentFile} action={actionLabel} />
        )}
      </div>
      {description && (
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}

function CompletedCard({ 
  title, 
  summary, 
  files, 
  onDetailsClick, 
  onPreviewClick, 
  onBookmarkClick,
  isBookmarked 
}: { 
  title?: string; 
  summary?: string; 
  files?: string[];
  onDetailsClick?: () => void;
  onPreviewClick?: () => void;
  onBookmarkClick?: () => void;
  isBookmarked?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl bg-[#1a1a1a] border border-blue-500/30 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
          {title || 'Changes applied'}
        </h3>
        <button
          onClick={onBookmarkClick}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-400' : ''}`} />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onDetailsClick}
          className="flex-1 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[12px] font-medium text-[var(--text-primary)] transition-colors border border-white/[0.08]"
        >
          Details
        </button>
        <button
          onClick={onPreviewClick}
          className="flex-1 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/10 text-[12px] font-medium text-[var(--text-primary)] transition-colors border border-white/[0.08]"
        >
          Preview
        </button>
      </div>

      {summary && (
        <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          {summary}
        </p>
      )}
      
      {files && files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <FilePill key={i} filename={f} action="" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function GenerationCard({
  status,
  title,
  description,
  currentFile,
  files,
  summary,
  isVisible,
  onDetailsClick,
  onPreviewClick,
  onBookmarkClick,
  isBookmarked,
}: GenerationCardProps) {
  if (!isVisible) return null;

  if (status === 'completed') {
    return (
      <CompletedCard
        title={title}
        summary={summary}
        files={files}
        onDetailsClick={onDetailsClick}
        onPreviewClick={onPreviewClick}
        onBookmarkClick={onBookmarkClick}
        isBookmarked={isBookmarked}
      />
    );
  }

  return (
    <ActiveCard
      status={status}
      description={description}
      currentFile={currentFile}
    />
  );
}
