"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/Card";
import { mockTraces } from "@/lib/mock-data";
import { GitBranch, Route, Search, Sparkles, Focus } from "lucide-react";
import SpriteText from "three-spritetext";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });
const TRACE_ALIAS_STORAGE_KEY = "trace-node-aliases-v1";

type GraphNode = {
  id: string;
  label: string;
  kind: "wallet" | "tx" | "change";
  color: string;
  depth: number;
  x?: number;
  y?: number;
  z?: number;
  txid?: string;
  amount?: number;
  date?: string;
  changeAddress?: string;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  kind: "input" | "output" | "change";
  txid: string;
  amount: number;
  depth: number;
  date: string;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const nodeId = (n: string | GraphNode) => (typeof n === "string" ? n : n.id);

function findPath(rootId: string, targetId: string, links: GraphLink[]): string[] {
  if (!rootId || !targetId) return [];
  if (rootId === targetId) return [rootId];

  const adjacency = new Map<string, string[]>();
  for (const link of links) {
    const from = nodeId(link.source);
    const to = nodeId(link.target);
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from)!.push(to);
  }

  const queue: string[] = [rootId];
  const seen = new Set([rootId]);
  const parent = new Map<string, string>();

  while (queue.length) {
    const current = queue.shift()!;
    const next = adjacency.get(current) ?? [];
    for (const child of next) {
      if (seen.has(child)) continue;
      seen.add(child);
      parent.set(child, current);
      if (child === targetId) {
        const path = [child];
        let p = current;
        path.push(p);
        while (parent.has(p)) {
          p = parent.get(p)!;
          path.push(p);
        }
        return path.reverse();
      }
      queue.push(child);
    }
  }
  const undirected = new Map<string, string[]>();
  for (const link of links) {
    const a = nodeId(link.source);
    const b = nodeId(link.target);
    if (!undirected.has(a)) undirected.set(a, []);
    if (!undirected.has(b)) undirected.set(b, []);
    undirected.get(a)!.push(b);
    undirected.get(b)!.push(a);
  }

  const q: string[] = [rootId];
  const seenU = new Set([rootId]);
  const parentU = new Map<string, string>();
  while (q.length) {
    const current = q.shift()!;
    const next = undirected.get(current) ?? [];
    for (const child of next) {
      if (seenU.has(child)) continue;
      seenU.add(child);
      parentU.set(child, current);
      if (child === targetId) {
        const pathU = [child];
        let p = current;
        pathU.push(p);
        while (parentU.has(p)) {
          p = parentU.get(p)!;
          pathU.push(p);
        }
        return pathU.reverse();
      }
      q.push(child);
    }
  }
  return [];
}

export default function TracingPage() {
  const graphWrapRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<{
    zoomToFit?: (ms?: number, paddingPx?: number, nodeFilterFn?: (node: object) => boolean) => void;
    cameraPosition?: (
      position?: { x?: number; y?: number; z?: number },
      lookAt?: { x?: number; y?: number; z?: number },
      ms?: number,
    ) => void;
  } | null>(null);
  const [walletSearch, setWalletSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [rootTxNodeId, setRootTxNodeId] = useState<string>(`tx:${mockTraces[0].id}`);
  const [graphSize, setGraphSize] = useState({ width: 1100, height: 640 });
  const [nodeAliases, setNodeAliases] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(TRACE_ALIAS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? parsed as Record<string, string> : {};
    } catch {
      return {};
    }
  });
  const [renameInput, setRenameInput] = useState("");

  const graph = useMemo<GraphData>(() => {
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
          color: "#5EEAD4",
          depth: trace.traceDepth,
        });
      }
      if (!nodes.has(toWalletId)) {
        nodes.set(toWalletId, {
          id: toWalletId,
          label: trace.toWallet,
          kind: "wallet",
          color: "#67E8F9",
          depth: trace.traceDepth + 1,
        });
      }
      if (!nodes.has(txNodeId)) {
        nodes.set(txNodeId, {
          id: txNodeId,
          label: trace.txid,
          kind: "tx",
          color: "#F59E0B",
          depth: trace.traceDepth,
          txid: trace.txid,
          amount: trace.amount,
          date: trace.date,
          changeAddress: trace.changeAddress,
        });
      }

      links.push({
        source: fromWalletId,
        target: txNodeId,
        kind: "input",
        txid: trace.txid,
        amount: trace.amount,
        depth: trace.traceDepth,
        date: trace.date,
      });
      links.push({
        source: txNodeId,
        target: toWalletId,
        kind: "output",
        txid: trace.txid,
        amount: trace.amount,
        depth: trace.traceDepth,
        date: trace.date,
      });

      if (trace.changeAddress) {
        const changeNodeId = `change:${trace.changeAddress}`;
        if (!nodes.has(changeNodeId)) {
          nodes.set(changeNodeId, {
            id: changeNodeId,
            label: trace.changeAddress,
            kind: "change",
            color: "#C084FC",
            depth: trace.traceDepth + 1,
          });
        }
        links.push({
          source: txNodeId,
          target: changeNodeId,
          kind: "change",
          txid: trace.txid,
          amount: 0,
          depth: trace.traceDepth,
          date: trace.date,
        });
      }
    }

    return { nodes: Array.from(nodes.values()), links };
  }, []);

  const fitGraph = useCallback((ms = 650) => {
    const g = fgRef.current;
    if (!g) return;
    const positioned = graph.nodes.filter(
      (n) => Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z),
    );
    if (!positioned.length) {
      g.zoomToFit?.(ms, 110, () => true);
      return;
    }

    const xs = positioned.map((n) => n.x as number);
    const ys = positioned.map((n) => n.y as number);
    const zs = positioned.map((n) => n.z as number);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 120);

    g.cameraPosition?.(
      { x: cx + span * 1.1, y: cy + span * 0.7, z: cz + span * 1.25 },
      { x: cx, y: cy, z: cz },
      ms,
    );
    g.zoomToFit?.(ms, 130, () => true);
  }, [graph.nodes]);

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graph.nodes, selectedNodeId],
  );
  const rootNode = useMemo(
    () => graph.nodes.find((n) => n.id === rootTxNodeId) ?? null,
    [graph.nodes, rootTxNodeId],
  );

  const getDisplayName = useCallback(
    (node: GraphNode | null | undefined) => {
      if (!node) return "";
      return nodeAliases[node.id]?.trim() || node.label;
    },
    [nodeAliases],
  );

  const tracesByTxNodeId = useMemo(() => {
    const m = new Map<string, (typeof mockTraces)[number]>();
    for (const t of mockTraces) m.set(`tx:${t.id}`, t);
    return m;
  }, []);

  const path = useMemo(
    () => (selectedNodeId ? findPath(rootTxNodeId, selectedNodeId, graph.links) : []),
    [graph.links, rootTxNodeId, selectedNodeId],
  );

  const pathEdgeSet = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i < path.length - 1; i += 1) {
      s.add(`${path[i]}->${path[i + 1]}`);
      s.add(`${path[i + 1]}->${path[i]}`);
    }
    return s;
  }, [path]);

  const routeLegs = useMemo(() => {
    if (path.length < 2) return [] as GraphLink[];
    const legs: GraphLink[] = [];
    for (let i = 0; i < path.length - 1; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      const leg = graph.links.find((l) => {
        const s = nodeId(l.source);
        const t = nodeId(l.target);
        return (s === a && t === b) || (s === b && t === a);
      });
      if (leg) legs.push(leg);
    }
    return legs;
  }, [graph.links, path]);

  const selectedTx = selectedNode?.kind === "tx" ? tracesByTxNodeId.get(selectedNode.id) : undefined;
  const selectedWalletTraces = useMemo(() => {
    if (!selectedNode || selectedNode.kind === "tx") return [];
    const label = selectedNode.label;
    return mockTraces.filter((t) => t.fromWallet === label || t.toWallet === label);
  }, [selectedNode]);

  const totalVolume = mockTraces.reduce((sum, t) => sum + t.amount, 0);


  useEffect(() => {
    const el = graphWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = Math.max(320, Math.floor(entry.contentRect.width));
      const height = Math.max(420, Math.floor(entry.contentRect.height));
      setGraphSize({ width, height });
      setTimeout(() => fitGraph(450), 120);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitGraph]);

  useEffect(() => {
    const t1 = setTimeout(() => fitGraph(0), 180);
    const t2 = setTimeout(() => fitGraph(850), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [fitGraph, rootTxNodeId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TRACE_ALIAS_STORAGE_KEY, JSON.stringify(nodeAliases));
    } catch {
      // Ignore storage write failures (private mode/quota)
    }
  }, [nodeAliases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet Tracing 3D</h1>
          <p className="mt-1 text-sm text-slate-400">
            Interactive transaction web with click-to-route tracing.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-slate-300">
            Nodes: {graph.nodes.length}
          </span>
          <span className="rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-slate-300">
            Links: {graph.links.length}
          </span>
          <span className="rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-slate-300">
            Traces: {mockTraces.length}
          </span>
          <span className="rounded-md border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-slate-300">
            Volume: {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 4 })} BTC
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden border-cyan-500/20 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.12),transparent_35%),#05070d]">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="min-w-56 flex-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Root Transaction</label>
              <select
                value={rootTxNodeId}
                onChange={(e) => setRootTxNodeId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                {mockTraces.map((trace) => (
                  <option key={trace.id} value={`tx:${trace.id}`}>
                    {(nodeAliases[`tx:${trace.id}`] || trace.txid)} | {trace.amount} BTC | {trace.date}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-56 flex-1">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Highlight Wallet/Seed</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  placeholder="Seed V_06, Seed V_12..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-fuchsia-500/50"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => fitGraph(650)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                <Focus className="h-4 w-4" />
                Re-center
              </button>
            </div>
          </div>
          {rootNode && (
            <div className="mb-3 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              Root Focus: <span className="font-semibold">{getDisplayName(rootNode)}</span>
            </div>
          )}

          <div ref={graphWrapRef} className="h-[70vh] min-h-[560px] rounded-xl border border-slate-700/60">
            <ForceGraph3D
              ref={fgRef}
              graphData={graph}
              width={graphSize.width}
              height={graphSize.height}
              backgroundColor="#05070d"
              nodeLabel={(node: object) => {
                const n = node as GraphNode;
                const name = getDisplayName(n);
                if (n.kind === "tx") return `TX ${name} | ${n.amount} BTC | ${n.date}`;
                return name;
              }}
              linkLabel={(link: object) => {
                const l = link as GraphLink;
                return `${l.kind.toUpperCase()} | ${l.txid} | ${l.amount} BTC`;
              }}
              nodeVal={(node: object) => ((node as GraphNode).kind === "tx" ? 8 : 5)}
              nodeThreeObject={(node: object) => {
                const n = node as GraphNode;
                const shouldLabel = n.id === rootTxNodeId || n.id === selectedNodeId || path.includes(n.id);
                if (!shouldLabel) return null;
                const label = new SpriteText(getDisplayName(n));
                label.textHeight = 7;
                label.padding = 2;
                label.backgroundColor = "rgba(2, 6, 23, 0.75)";
                label.color = n.id === selectedNodeId ? "#fb923c" : n.id === rootTxNodeId ? "#67e8f9" : "#fde047";
                return label;
              }}
              nodeThreeObjectExtend={true}
              linkDirectionalParticles={(link: object) => {
                const l = link as GraphLink;
                const key = `${nodeId(l.source)}->${nodeId(l.target)}`;
                return pathEdgeSet.size ? (pathEdgeSet.has(key) ? 5 : 0) : 2;
              }}
              linkDirectionalParticleWidth={(link: object) =>
                pathEdgeSet.has(`${nodeId((link as GraphLink).source)}->${nodeId((link as GraphLink).target)}`) ? 3.5 : 1.1
              }
              linkDirectionalParticleSpeed={0.008}
              nodeColor={(node: object) => {
                const n = node as GraphNode;
                const inPath = path.includes(n.id);
                const isRoot = n.id === rootTxNodeId;
                const isSelected = n.id === selectedNodeId;
                const matchesSearch = walletSearch.trim()
                  ? n.label.toLowerCase().includes(walletSearch.toLowerCase())
                  : false;

                if (isSelected) return "#F97316";
                if (isRoot) return "#22D3EE";
                if (inPath) return "#FACC15";
                if (matchesSearch) return "#E879F9";
                return n.color;
              }}
              linkColor={(link: object) => {
                const l = link as GraphLink;
                const key = `${nodeId(l.source)}->${nodeId(l.target)}`;
                if (pathEdgeSet.has(key)) return "rgba(250,204,21,0.95)";
                if (l.kind === "change") return "rgba(192,132,252,0.7)";
                if (l.kind === "input") return "rgba(94,234,212,0.45)";
                return "rgba(103,232,249,0.45)";
              }}
              linkWidth={(link: object) => {
                const l = link as GraphLink;
                const key = `${nodeId(l.source)}->${nodeId(l.target)}`;
                return pathEdgeSet.has(key) ? 3.2 : 1.2;
              }}
              onNodeClick={(node: object) => {
                const n = node as GraphNode;
                setSelectedNodeId(n.id);
                setRenameInput(getDisplayName(n));
              }}
              onEngineStop={() => fitGraph(520)}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-amber-500/25 bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2">
              <Route className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Exact Route Explorer</h2>
            </div>
            {!selectedNode ? (
              <p className="text-sm text-slate-400">Click any node in the 3D map to inspect the route from the selected root transaction.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selected Node</p>
                  <p className="mt-1 text-sm font-medium text-white">{getDisplayName(selectedNode)}</p>
                  <p className="text-xs text-slate-400">Type: {selectedNode.kind}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Path</p>
                  {path.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {path.map((step) => {
                        const node = graph.nodes.find((n) => n.id === step);
                        return (
                          <span key={step} className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] text-slate-200">
                            {node?.kind === "tx" ? `TX ${getDisplayName(node)}` : getDisplayName(node)}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No route found from the selected root transaction.</p>
                  )}
                </div>

                {routeLegs.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Route Legs</p>
                    <div className="mt-2 space-y-1.5">
                      {routeLegs.map((leg, idx) => (
                        <div key={`${leg.txid}-${idx}`} className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                          {leg.kind.toUpperCase()} | TX {leg.txid} | {leg.amount} BTC | {leg.date}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="border-fuchsia-500/25 bg-slate-900/70">
            <h2 className="mb-3 text-sm font-semibold text-white">Node Details</h2>
            {!selectedNode ? (
              <p className="text-sm text-slate-400">Select a node to inspect transaction or wallet details.</p>
            ) : selectedNode.kind === "tx" && selectedTx ? (
              <div className="space-y-1.5 text-xs text-slate-300">
                <p><span className="text-slate-500">Display Name:</span> {getDisplayName(selectedNode)}</p>
                <p><span className="text-slate-500">TXID:</span> {selectedTx.txid}</p>
                <p><span className="text-slate-500">From Wallet:</span> {selectedTx.fromWallet}</p>
                <p><span className="text-slate-500">To Wallet:</span> {selectedTx.toWallet}</p>
                <p><span className="text-slate-500">Amount:</span> {selectedTx.amount} BTC</p>
                <p><span className="text-slate-500">Date:</span> {selectedTx.date}</p>
                <p><span className="text-slate-500">Trace Depth:</span> {selectedTx.traceDepth}</p>
                <p><span className="text-slate-500">Change Address:</span> {selectedTx.changeAddress ?? "None"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  <span className="text-slate-500">Wallet/Node:</span> {getDisplayName(selectedNode)}
                </p>
                <p className="text-xs text-slate-500">Connected Transactions ({selectedWalletTraces.length})</p>
                <div className="max-h-48 space-y-1 overflow-auto pr-1">
                  {selectedWalletTraces.map((t) => (
                    <div key={t.id} className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] text-slate-200">
                      {t.fromWallet} {" -> "} {t.toWallet} | {t.amount} BTC | {t.txid}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedNode && (
              <div className="mt-4 border-t border-slate-700/70 pt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Rename Node</p>
                <div className="flex gap-2">
                  <input
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    placeholder="e.g. Paul's Wallet"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-1.5 text-xs text-white outline-none focus:border-fuchsia-500/60"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNodeAliases((prev) => ({
                        ...prev,
                        [selectedNode.id]: renameInput.trim() || selectedNode.label,
                      }))
                    }
                    className="rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/15 px-2 py-1.5 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/25"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className="border-cyan-500/25 bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Trace Legend</h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Transaction node</li>
              <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-300" /> Wallet node</li>
              <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400" /> Search highlight</li>
              <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-yellow-300" /> Active route</li>
              <li className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Selected node</li>
            </ul>
          </Card>

          <Card className="border-slate-700/70 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">How To Use</h2>
            </div>
            <ol className="mt-3 space-y-1 text-xs text-slate-400">
              <li>1. Pick a root transaction at the top.</li>
              <li>2. Rotate/zoom/pan the 3D map.</li>
              <li>3. Click any node to trace exact directed route.</li>
              <li>4. Search a wallet/seed to spotlight related nodes.</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
