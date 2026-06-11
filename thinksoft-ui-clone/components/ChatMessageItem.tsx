'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Undo, User, Bot, Terminal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TodoList } from './TodoList';

interface ChatMessageItemProps {
  content: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  isStreaming?: boolean;
  streamingContent?: string;
}

function formatDate(d: Date) {
  return d instanceof Date
    ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TypewriterText({ text, speed = 8 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    
    if (!text) return;
    
    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(timerRef.current);
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  if (!text) return null;
  if (text.length <= 100) {
    return <span>{displayed || text[0] || ''}{indexRef.current < text.length ? <span className="animate-pulse">▊</span> : null}</span>;
  }
  return <span>{text}</span>;
}

function parseContent(content: string) {
  const blocks: Array<{ type: 'text' | 'code' | 'todo'; content: string; language?: string }> = [];
  
  const todoRegex = /\[([ x])\]\s*(.+?)(?:\n|$)/g;
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  const combined: Array<{ index: number; type: 'code' | 'todo'; content: string; language?: string; match: string }> = [];
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    combined.push({ index: match.index, type: 'code', content: match[2], language: match[1] || 'text', match: match[0] });
  }
  
  while ((match = todoRegex.exec(content)) !== null) {
    combined.push({ index: match.index, type: 'todo', content: `${match[1]}|${match[2]}`, match: match[0] });
  }
  
  combined.sort((a, b) => a.index - b.index);
  
  for (const item of combined) {
    if (item.index > lastIndex) {
      const text = content.slice(lastIndex, item.index);
      if (text.trim()) {
        blocks.push({ type: 'text', content: text });
      }
    }
    
    if (item.type === 'code') {
      blocks.push({ type: 'code', content: item.content, language: item.language });
    } else if (item.type === 'todo') {
      blocks.push({ type: 'todo', content: item.content });
    }
    
    lastIndex = item.index + item.match.length;
  }
  
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    if (remaining.trim()) {
      blocks.push({ type: 'text', content: remaining });
    }
  }
  
  return blocks;
}

function formatInlineText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const bulletText = trimmed.replace(/^[•\-*]\s*/, '');
      return (
        <div key={i} className="flex items-start gap-2 pl-1">
          <span className="text-[var(--text-secondary)] mt-[7px] shrink-0">
            <span className="block w-1 h-1 rounded-full bg-current" />
          </span>
          <span className="flex-1">{formatInlineText(bulletText)}</span>
        </div>
      );
    }
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      const numText = trimmed.replace(/^\d+[\.\)]\s*/, '');
      return (
        <div key={i} className="flex items-start gap-2 pl-1">
          <span className="text-[11px] text-[var(--text-secondary)] mt-[3px] font-mono w-4 shrink-0 text-right">
            {trimmed.match(/^(\d+)/)?.[1]}
          </span>
          <span className="flex-1">{formatInlineText(numText)}</span>
        </div>
      );
    }
    if (trimmed.startsWith('#')) {
      const headingLevel = trimmed.match(/^(#{1,3})\s/)?.[1]?.length || 1;
      const headingText = trimmed.replace(/^#{1,3}\s/, '');
      const sizes: Record<number, string> = { 1: 'text-sm font-semibold', 2: 'text-[13px] font-semibold', 3: 'text-[13px] font-medium' };
      return (
        <div key={i} className={`${sizes[headingLevel] || 'text-[13px] font-semibold'} text-[var(--text-primary)] mt-2 mb-1`}>
          {headingText}
        </div>
      );
    }
    if (trimmed.startsWith('`★')) {
      return (
        <div key={i} className="flex items-center gap-2 py-1.5 px-2 my-1 text-[12px] font-mono text-[var(--text-secondary)] bg-white/[0.03] rounded border border-[var(--border-subtle)]">
          <span className="text-yellow-500 shrink-0">◆</span>
          <span className="flex-1">{trimmed.replace(/`★\s*───.*───`/, '').replace(/^`★/, '').replace(/`$/, '').trim()}</span>
        </div>
      );
    }
    if (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length > 2) {
      const inner = trimmed.slice(1, -1);
      return (
        <div key={i} className="text-[12px] text-[var(--text-secondary)] italic pl-1">
          {inner}
        </div>
      );
    }
    if (trimmed.match(/^---+$/) || trimmed.match(/^===+$/)) {
      return <div key={i} className="h-px bg-[var(--border-subtle)] my-2" />;
    }
    if (trimmed === '') {
      return <div key={i} className="h-1.5" />;
    }
    const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>');
    const withCode = withBold.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 text-[12.5px] bg-white/[0.06] rounded font-mono text-[var(--text-primary)]">$1</code>');
    return (
      <div key={i} className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: withCode }} />
    );
  });
}

function CopiedToast() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white/10 text-[11px] text-white px-2 py-0.5 rounded"
    >
      Copied!
    </motion.div>
  );
}

export default function ChatMessageItem({ content, type, timestamp, isStreaming, streamingContent }: ChatMessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayContent = isStreaming ? (streamingContent || content) : content;
  const blocks = useMemo(() => parseContent(displayContent), [displayContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (type === 'system') {
    return (
      <div className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)]">
        <Terminal className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
        <div className="flex-1 leading-relaxed">{content}</div>
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">You</span>
          <span className="text-[10px] text-[var(--text-secondary)] opacity-50">{formatDate(timestamp)}</span>
        </div>
        <div className="bg-white/[0.06] rounded-[14px] py-[9px] px-[14px] max-w-[88%]">
          <div className="text-[13px] leading-relaxed text-[var(--text-primary)]">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center">
          <Bot className="w-3 h-3 text-[var(--text-primary)]" />
        </div>
        <span className="text-[11px] font-medium text-[var(--text-secondary)]">Thinksoft</span>
        <span className="text-[10px] text-[var(--text-secondary)] opacity-50">
          {isStreaming ? 'Streaming...' : formatDate(timestamp)}
        </span>
        {isStreaming && (
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>

      <div className="text-[var(--text-primary)]">
        {blocks.map((block, i) => {
          if (block.type === 'code') {
            return (
              <div key={i} className="my-2 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-[var(--border-subtle)]">
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                    {block.language || 'code'}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(block.content);
                      } catch {}
                    }}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <SyntaxHighlighter
                  language={block.language || 'typescript'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '12px',
                    padding: '12px',
                    background: '#0d1117',
                  }}
                  showLineNumbers={false}
                >
                  {block.content}
                </SyntaxHighlighter>
              </div>
            );
          }

          if (block.type === 'todo') {
            const [checked, text] = block.content.split('|');
            const todoItems = [
              { id: `todo-${i}`, text, completed: checked === 'x' }
            ];
            return <TodoList key={i} items={todoItems} compact />;
          }

          if (block.type === 'text') {
            if (isStreaming) {
              return (
                <div key={i} className="text-[13px] leading-relaxed">
                  <TypewriterText text={block.content} speed={6} />
                </div>
              );
            }
            return <div key={i}>{formatInlineText(block.content)}</div>;
          }

          return null;
        })}
      </div>

      <AnimatePresence>
        {showActions && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-[var(--text-secondary)] relative"
          >
            <button onClick={handleCopy} className="relative p-1 hover:text-[var(--text-primary)] transition-colors">
              <Copy className="w-3.5 h-3.5" />
              <AnimatePresence>{copied && <CopiedToast />}</AnimatePresence>
            </button>
            <button className="p-1 hover:text-[var(--text-primary)] transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:text-[var(--text-primary)] transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:text-[var(--text-primary)] transition-colors"><Undo className="w-3.5 h-3.5" /></button>
            <button className="p-1 hover:text-[var(--text-primary)] transition-colors"><MoreHorizontal className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
