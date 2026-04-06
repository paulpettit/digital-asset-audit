"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { mockTraces } from "@/lib/mock-data";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

type GraphNode = {
  id: string;
  label: string;
  kind: "wallet" | "tx" | "change";
  color: string;
  txid?: string;
};

type PositionedGraphNode = GraphNode & {
  x?: number;
  y?: number;
  z?: number;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  kind: "input" | "output" | "change";
  txid: string;
  amount: number;
  date: string;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

type TraceCaptureApi = {
  zoomToFit: (ms?: number, padding?: number) => void;
  focusNodeByLabel: (label: string, distance?: number, ms?: number) => boolean;
  selectNodeByLabel: (label: string) => boolean;
  renameSelectedNode: (label: string) => boolean;
  getNodeScreenPosition: (label: string) => { x: number; y: number } | null;
  getSelectedNodeLabel: () => string | null;
};

declare global {
  interface Window {
    traceCaptureApi?: TraceCaptureApi;
  }
}

const nodeId = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);

function buildGraph(): GraphData {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  for (const trace of mockTraces) {
    const fromWalletId = `wallet:${trace.fromWallet}`;
    const toWalletId = `wallet:${trace.toWallet}`;
    const txNodeId = `tx:${trace.id}`;

    if (!nodes.has(fromWalletId)) {
      nodes.set(fromWalletId, {
        id: fromWalletId,
        label: trace.fromWallet,
        kind: "wallet",
        color: "#67E8F9",
      });
    }
    if (!nodes.has(toWalletId)) {
      nodes.set(toWalletId, {
        id: toWalletId,
        label: trace.toWallet,
        kind: "wallet",
        color: "#5EEAD4",
      });
    }
    if (!nodes.has(txNodeId)) {
      nodes.set(txNodeId, {
        id: txNodeId,
        label: trace.txid,
        kind: "tx",
        color: "#F59E0B",
        txid: trace.txid,
      });
    }

    links.push({
      source: fromWalletId,
      target: txNodeId,
      kind: "input",
      txid: trace.txid,
      amount: trace.amount,
      date: trace.date,
    });
    links.push({
      source: txNodeId,
      target: toWalletId,
      kind: "output",
      txid: trace.txid,
      amount: trace.amount,
      date: trace.date,
    });

    if (trace.changeAddress) {
      const changeId = `change:${trace.changeAddress}`;
      if (!nodes.has(changeId)) {
        nodes.set(changeId, {
          id: changeId,
          label: trace.changeAddress,
          kind: "change",
          color: "#C084FC",
        });
      }
      links.push({
        source: txNodeId,
        target: changeId,
        kind: "change",
        txid: trace.txid,
        amount: 0,
        date: trace.date,
      });
    }
  }

  return { nodes: Array.from(nodes.values()), links };
}

export default function TraceCapturePage() {
  const fgRef = useRef<{
    zoomToFit?: (ms?: number, paddingPx?: number, nodeFilterFn?: (node: object) => boolean) => void;
    cameraPosition?: (
      position?: { x?: number; y?: number; z?: number },
      lookAt?: { x?: number; y?: number; z?: number },
      ms?: number
    ) => void;
    graph2ScreenCoords?: (x: number, y: number, z: number) => { x: number; y: number };
  } | null>(null);
  const hasInitialFitRef = useRef(false);

  const [graph, setGraph] = useState<GraphData>(() => buildGraph());
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [rootLabel, setRootLabel] = useState("Seed V_06");
  const [renameInput, setRenameInput] = useState("");

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || null;
  const selectedNodeLabel = selectedNode?.label ?? null;

  const findNodeByLabel = useCallback((label: string) => {
    const target = label.trim().toLowerCase();
    if (!target) return null;
    return (
      (graph.nodes.find((node) => node.label.toLowerCase() === target) as PositionedGraphNode | undefined) ||
      null
    );
  }, [graph.nodes]);

  const selectNodeByLabel = useCallback((label: string) => {
    const node = findNodeByLabel(label);
    if (!node) return false;
    setSelectedNodeId(node.id);
    setRenameInput(node.label);
    return true;
  }, [findNodeByLabel]);

  const renameSelectedNode = useCallback((nextLabel: string) => {
    if (!selectedNode) return false;
    const next = nextLabel.trim();
    if (!next) return false;

    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === selectedNode.id ? { ...node, label: next } : node
      ),
    }));
    setRootLabel(next);
    setRenameInput(next);
    return true;
  }, [selectedNode]);

  const focusNodeByLabel = useCallback((label: string, distance = 120, ms = 1000) => {
    const node = findNodeByLabel(label);
    if (!node || node.x == null || node.y == null || node.z == null) return false;

    const fg = fgRef.current;
    if (!fg?.cameraPosition) return false;

    const dist = Math.hypot(node.x, node.y, node.z) || 1;
    const ratio = 1 + distance / dist;
    fg.cameraPosition(
      {
        x: node.x * ratio,
        y: node.y * ratio,
        z: node.z * ratio,
      },
      {
        x: node.x,
        y: node.y,
        z: node.z,
      },
      ms
    );

    return true;
  }, [findNodeByLabel]);

  const getNodeScreenPosition = useCallback((label: string) => {
    const node = findNodeByLabel(label);
    const fg = fgRef.current;
    if (!node || node.x == null || node.y == null || node.z == null || !fg?.graph2ScreenCoords) {
      return null;
    }

    const projected = fg.graph2ScreenCoords(node.x, node.y, node.z);
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + projected.x,
      y: rect.top + projected.y,
    };
  }, [findNodeByLabel]);

  useEffect(() => {
    window.traceCaptureApi = {
      zoomToFit: (ms = 850, padding = 55) => {
        fgRef.current?.zoomToFit?.(ms, padding, () => true);
      },
      focusNodeByLabel,
      selectNodeByLabel,
      renameSelectedNode,
      getNodeScreenPosition,
      getSelectedNodeLabel: () => {
        return selectedNodeLabel;
      },
    };

    return () => {
      delete window.traceCaptureApi;
    };
  }, [
    selectedNodeLabel,
    focusNodeByLabel,
    getNodeScreenPosition,
    renameSelectedNode,
    selectNodeByLabel,
  ]);

  return (
    <div className="min-h-screen bg-background px-8 py-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="rounded-xl border border-card-border bg-[#07253A]/65 px-5 py-3 text-4xl font-semibold tracking-tight text-cyan-200 md:text-5xl">
          Root Focus: {rootLabel}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-card-border bg-black shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
          <div className="h-[78vh] min-h-[740px] w-full">
            <ForceGraph3D
              ref={fgRef}
              graphData={graph}
              backgroundColor="#010513"
              nodeLabel={(node: object) => {
                const n = node as GraphNode;
                return n.kind === "tx" ? `TX ${n.label}` : n.label;
              }}
              linkLabel={(link: object) => {
                const l = link as GraphLink;
                return `${l.kind.toUpperCase()} | ${l.txid} | ${l.amount} BTC`;
              }}
              nodeVal={(node: object) => {
                const n = node as GraphNode;
                if (n.id === selectedNodeId) return 14;
                return n.kind === "tx" ? 10 : 7;
              }}
              nodeColor={(node: object) => {
                const n = node as GraphNode;
                if (n.id === selectedNodeId) return "#F59E0B";
                if (n.label === rootLabel) return "#22D3EE";
                return n.color;
              }}
              linkColor={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                if (s === selectedNodeId || t === selectedNodeId) return "rgba(245,158,11,0.96)";
                if (l.kind === "change") return "rgba(192,132,252,0.55)";
                return "rgba(110,224,255,0.22)";
              }}
              linkDirectionalParticleColor={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                if (s === selectedNodeId || t === selectedNodeId) return "#F59E0B";
                if (l.kind === "change") return "#C084FC";
                return "#7DD3FC";
              }}
              linkWidth={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                return s === selectedNodeId || t === selectedNodeId ? 5 : 1.7;
              }}
              linkDirectionalParticles={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                return s === selectedNodeId || t === selectedNodeId ? 8 : 2;
              }}
              linkDirectionalParticleWidth={3.2}
              linkDirectionalParticleSpeed={0.011}
              onNodeClick={(node: object) => {
                const n = node as GraphNode;
                setSelectedNodeId(n.id);
                setRenameInput(n.label);
              }}
              onEngineStop={() => {
                if (hasInitialFitRef.current) return;
                hasInitialFitRef.current = true;
                fgRef.current?.zoomToFit?.(550, 50, () => true);
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xl text-slate-500 md:text-2xl">
            Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3">
          <input
            data-testid="trace-rename-input"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="Rename selected node..."
            className="h-11 flex-1 rounded-lg border border-card-border bg-white/[0.03] px-4 text-xl text-white outline-none focus:border-accent"
          />
          <button
            data-testid="trace-save-name"
            type="button"
            onClick={() => {
              renameSelectedNode(renameInput);
            }}
            className="h-11 rounded-lg border border-amber-400/40 bg-amber-400/15 px-5 text-base font-semibold text-amber-200"
          >
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
}
