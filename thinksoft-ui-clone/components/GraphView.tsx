'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Play, Pause, Maximize, ZoomIn, ZoomOut, Settings2, Search } from 'lucide-react';

const NODE_COLORS: Record<string, string> = {
  component: '#61afef',
  page: '#98c379',
  layout: '#e5c07b',
  config: '#abb2bf',
  style: '#c678dd',
  hook: '#56b6c2',
  context: '#d19a66',
  utility: '#5c6370',
  design: '#7ec8a0',
};

function getNodeColor(type: string, group: string): string {
  return NODE_COLORS[type] || NODE_COLORS[group] || '#5c6370';
}

interface GraphData {
  nodes: any[];
  links: any[];
  features: Array<{ name: string; components: string[]; description: string }>;
}

interface GraphViewProps {
  sandboxId?: string | null;
}

export function GraphView({ sandboxId }: GraphViewProps) {
  const fgRef = useRef<any>(null);
  const [data, setData] = useState<GraphData>({ nodes: [], links: [], features: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph-data');
      const result = await res.json();
      if (result.nodes?.length > 0) {
        setData(result);
      }
    } catch (e) {
      console.error('[GraphView] Failed to fetch graph data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sandboxId) {
      fetchGraphData();
      const interval = setInterval(fetchGraphData, 15000);
      const onRefresh = () => fetchGraphData();
      window.addEventListener('graph-refresh', onRefresh);
      return () => {
        clearInterval(interval);
        window.removeEventListener('graph-refresh', onRefresh);
      };
    } else {
      setData({ nodes: [], links: [], features: [] });
    }
  }, [sandboxId, fetchGraphData]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }

    return () => resizeObserver.disconnect();
  }, []);

  const filteredNodes = search
    ? data.nodes.filter((n: any) => n.name.toLowerCase().includes(search.toLowerCase()))
    : data.nodes;

  const filteredIds = new Set(filteredNodes.map((n: any) => n.id));
  const filteredLinks = data.links.filter(
    (l: any) => filteredIds.has(l.source) && filteredIds.has(l.target)
  );

  return (
    <div className="flex-1 flex flex-col mr-2 mb-2 border border-[var(--border-main)] rounded-2xl bg-[var(--bg-main)] overflow-hidden relative" ref={containerRef}>
      {loading && data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[var(--bg-main)]/80">
          <div className="text-sm text-[var(--text-secondary)]">Loading graph data...</div>
        </div>
      )}

      {!loading && data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[var(--bg-main)]/80">
          <div className="text-sm text-[var(--text-secondary)]">No files to display. Generate code to see the dependency graph.</div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex items-center bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg p-1 shadow-xl shadow-black/20">
        <div className="flex items-center px-2 py-1 gap-2">
          <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent text-sm w-32 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>
      </div>

      {data.features.length > 0 && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg p-2 shadow-xl shadow-black/20 max-w-48">
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Features</div>
          {data.features.slice(0, 6).map((f, i) => (
            <div key={i} className="text-xs text-[var(--text-primary)] truncate">
              {f.name}
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-[var(--bg-panel)] border border-[var(--border-strong)] rounded-lg p-1 shadow-xl shadow-black/20 text-[var(--text-secondary)]">
        <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors cursor-pointer">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors cursor-pointer">
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[var(--border-strong)] mx-1"></div>
        <button onClick={() => fgRef.current?.zoomToFit(400)} className="p-1.5 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors cursor-pointer">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes: filteredNodes, links: filteredLinks }}
        nodeLabel=""
        nodeColor={(node: any) => getNodeColor(node.type, node.group)}
        nodeRelSize={5}
        linkColor={() => '#3e4451'}
        linkWidth={0.5}
        backgroundColor="#0d1117"
        onNodeHover={setHoverNode}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name as string;
          const fontSize = Math.max(12 / globalScale, 4);
          const nodeR = Math.sqrt(Math.max(1, node.incoming + node.outgoing + 1)) * 2;

          ctx.beginPath();
          ctx.arc(node.x as number, node.y as number, nodeR, 0, 2 * Math.PI, false);
          ctx.fillStyle = node === hoverNode ? '#e2e8f0' : getNodeColor(node.type, node.group);
          ctx.fill();

          if (node === hoverNode) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          if (globalScale > 1.2 || node === hoverNode) {
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#a8b2c1';
            ctx.fillText(label, node.x as number, (node.y as number) + nodeR + fontSize / 2 + 2);
          }
        }}
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
      />
    </div>
  );
}
