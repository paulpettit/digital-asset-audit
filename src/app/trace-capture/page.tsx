"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { mockTraces } from "@/lib/mock-data";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

type GraphNode = {
  id: string;
  label: string;
  kind: "wallet" | "tx" | "change";
  color: string;
  txid?: string;
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
  } | null>(null);
  const hasInitialFitRef = useRef(false);

  const [graph, setGraph] = useState<GraphData>(() => buildGraph());
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [rootLabel, setRootLabel] = useState("my wallet");
  const [renameInput, setRenameInput] = useState("");

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || null;

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
                if (n.id === selectedNodeId) return "#FACC15";
                if (n.label === rootLabel) return "#22D3EE";
                return n.color;
              }}
              linkColor={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                if (s === selectedNodeId || t === selectedNodeId) return "rgba(250,204,21,0.9)";
                if (l.kind === "change") return "rgba(192,132,252,0.55)";
                return "rgba(110,224,255,0.22)";
              }}
              linkWidth={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                return s === selectedNodeId || t === selectedNodeId ? 4 : 1.7;
              }}
              linkDirectionalParticles={(link: object) => {
                const l = link as GraphLink;
                const s = nodeId(l.source);
                const t = nodeId(l.target);
                return s === selectedNodeId || t === selectedNodeId ? 6 : 2;
              }}
              linkDirectionalParticleWidth={2.8}
              linkDirectionalParticleSpeed={0.009}
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
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="Rename selected node..."
            className="h-11 flex-1 rounded-lg border border-card-border bg-white/[0.03] px-4 text-xl text-white outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => {
              if (!selectedNode) return;
              const next = renameInput.trim();
              if (!next) return;
              setGraph((prev) => ({
                ...prev,
                nodes: prev.nodes.map((node) =>
                  node.id === selectedNode.id ? { ...node, label: next } : node
                ),
              }));
              setRootLabel(next);
              setRenameInput(next);
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
