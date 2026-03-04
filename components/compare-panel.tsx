"use client";

import { useMemo, useState } from "react";
import {
  GPU_LIST,
  calcTotalVram,
  calcTTFT,
  calcTokensPerSecond,
  gpusRequired,
  type GpuSpec,
} from "@/lib/llm-data";
import type { CalcConfig } from "@/components/config-panel";
import { SearchableSelect, type SearchableOption } from "@/components/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { HardDrive, Zap, Clock, Award, ChevronUp, ChevronDown, Minus, Layers } from "lucide-react";

interface ComparePanelProps {
  baseConfig: CalcConfig;
}

interface GpuResult {
  gpu: GpuSpec;
  vramGb: number;
  ttftMs: number;
  tps: number;
  totalTps: number;
  fitsWithN: number;
  usagePct: number;
}

type SortKey = "vramGb" | "ttftMs" | "tps" | "totalTps" | "fitsWithN";

const TIER_COLORS: Record<string, string> = {
  consumer:   "border-sky-500/30 text-sky-400 bg-sky-500/10",
  prosumer:   "border-amber-500/30 text-amber-400 bg-amber-500/10",
  datacenter: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
};

const NUM_GPUS_OPTIONS = [1, 2, 4, 8, 16, 32, 64];

export default function ComparePanel({ baseConfig }: ComparePanelProps) {
  const [providerFilter, setProviderFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("tps");
  const [sortAsc, setSortAsc] = useState(false);
  const [numGpus, setNumGpus] = useState(baseConfig.numGpus);

  const providers = useMemo(
    () => [...new Set(GPU_LIST.map((g) => g.provider))].sort(),
    []
  );

  const providerOptions: SearchableOption[] = [
    { value: "all", label: "All Providers" },
    ...providers.map((p) => ({ value: p, label: p })),
  ];

  const tierOptions: SearchableOption[] = [
    { value: "all", label: "All Tiers" },
    { value: "consumer", label: "Consumer / Gaming" },
    { value: "prosumer", label: "Pro / Workstation" },
    { value: "datacenter", label: "Datacenter / Cloud" },
  ];

  const numGpusOptions: SearchableOption[] = NUM_GPUS_OPTIONS.map((n) => ({
    value: String(n),
    label: `${n}× GPU${n > 1 ? "s" : ""}`,
  }));

  const results: GpuResult[] = useMemo(() => {
    const gpus = GPU_LIST.filter((g) => {
      const provOk = providerFilter === "all" || g.provider === providerFilter;
      const tierOk = tierFilter === "all" || g.tier === tierFilter;
      return provOk && tierOk;
    });

    return gpus.map((gpu) => {
      const vram = calcTotalVram(
        baseConfig.model,
        baseConfig.quant,
        baseConfig.kvCache,
        baseConfig.contextLen,
        baseConfig.concurrentUsers
      );
      const ttftMs = calcTTFT(
        baseConfig.model,
        baseConfig.quant,
        gpu,
        numGpus,
        baseConfig.promptTokens
      );
      const tps = calcTokensPerSecond(
        baseConfig.model,
        baseConfig.quant,
        gpu,
        numGpus,
        baseConfig.concurrentUsers
      );
      const needed = gpusRequired(vram.totalGb, gpu);
      const available = gpu.vramGb * numGpus;
      return {
        gpu,
        vramGb: vram.totalGb,
        ttftMs,
        tps,
        totalTps: tps * baseConfig.concurrentUsers,
        fitsWithN: needed,
        usagePct: Math.min((vram.totalGb / available) * 100, 999),
      };
    });
  }, [baseConfig, numGpus, providerFilter, tierFilter]);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [results, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "fitsWithN");
    }
  };

  const bestTps = Math.max(...results.map((r) => r.tps), 0);
  const bestTtft = Math.min(...results.filter((r) => r.fitsWithN <= numGpus).map((r) => r.ttftMs), Infinity);
  const bestTotalTps = Math.max(...results.map((r) => r.totalTps), 0);

  const isMoE = Boolean(baseConfig.model.numExperts);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <Minus className="w-3 h-3 text-muted-foreground/40" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Provider</Label>
          <SearchableSelect
            options={providerOptions}
            value={providerFilter}
            onValueChange={setProviderFilter}
            searchPlaceholder="Search provider..."
            triggerClassName="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tier</Label>
          <SearchableSelect
            options={tierOptions}
            value={tierFilter}
            onValueChange={setTierFilter}
            searchPlaceholder="Search tier..."
            triggerClassName="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">GPUs per node</Label>
          <SearchableSelect
            options={numGpusOptions}
            value={String(numGpus)}
            onValueChange={(v) => setNumGpus(Number(v))}
            searchPlaceholder="Select GPU count..."
            triggerClassName="w-32"
          />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Comparing for</p>
          <div className="flex items-center gap-1.5 justify-end">
            <p className="text-sm font-semibold text-foreground">{baseConfig.model.name}</p>
            {isMoE && (
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary bg-primary/10">
                MoE
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {baseConfig.quant.label} · {(baseConfig.contextLen / 1000).toFixed(0)}K ctx · {baseConfig.concurrentUsers} user{baseConfig.concurrentUsers > 1 ? "s" : ""}
          </p>
          {isMoE && (
            <p className="text-[10px] text-primary mt-0.5">
              {baseConfig.model.activeParams}B active / {baseConfig.model.params}B total
            </p>
          )}
        </div>
      </div>

      {/* ── MoE note ─────────────────────────────────────────── */}
      {isMoE && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">MoE GPU comparison:</span>{" "}
            VRAM requirements are based on total params ({baseConfig.model.params}B — all experts must fit).
            TTFT and Tok/s are based on active params ({baseConfig.model.activeParams}B).
            This is why MoE models need more VRAM but run faster than equivalent-sized dense models.
          </p>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  GPU
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("fitsWithN")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Min GPUs <SortIcon col="fitsWithN" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
                  GPU VRAM
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("ttftMs")}
                >
                  <span className="flex items-center justify-end gap-1">
                    TTFT <SortIcon col="ttftMs" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  onClick={() => handleSort("tps")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Tok/s (per user) <SortIcon col="tps" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground select-none hidden md:table-cell"
                  onClick={() => handleSort("totalTps")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Total Tok/s <SortIcon col="totalTps" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden lg:table-cell">
                  Mem BW
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((r) => {
                const canFit = r.fitsWithN <= numGpus;
                const isBestTps = canFit && r.tps === bestTps;
                const isBestTtft = canFit && r.ttftMs === bestTtft;
                const isBestTotal = canFit && r.totalTps === bestTotalTps;
                const anyBest = isBestTps || isBestTtft || isBestTotal;

                return (
                  <tr
                    key={r.gpu.id}
                    className={`transition-colors ${
                      !canFit
                        ? "opacity-40 bg-muted/5"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    {/* GPU name */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-foreground text-xs">
                              {r.gpu.name}
                            </span>
                            {anyBest && (
                              <Award className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 h-4 ${TIER_COLORS[r.gpu.tier]}`}
                            >
                              {r.gpu.tier}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {r.gpu.provider}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Min GPUs */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono text-xs font-bold ${
                          r.fitsWithN <= numGpus ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {r.fitsWithN}×
                      </span>
                    </td>

                    {/* GPU VRAM */}
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs text-foreground">
                            {r.gpu.vramGb} GB
                          </span>
                        </div>
                        <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              !canFit
                                ? "bg-red-500"
                                : r.usagePct > 85
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(r.usagePct / numGpus, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* TTFT */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Clock
                          className={`w-3 h-3 ${
                            isBestTtft ? "text-emerald-400" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`font-mono text-xs ${
                            isBestTtft
                              ? "text-emerald-400 font-bold"
                              : "text-foreground"
                          }`}
                        >
                          {r.ttftMs < 1000
                            ? `${r.ttftMs.toFixed(0)}ms`
                            : `${(r.ttftMs / 1000).toFixed(2)}s`}
                        </span>
                      </div>
                    </td>

                    {/* TPS per user */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Zap
                          className={`w-3 h-3 ${
                            isBestTps ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`font-mono text-xs ${
                            isBestTps ? "text-primary font-bold" : "text-foreground"
                          }`}
                        >
                          {r.tps.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-16 h-1 rounded-full bg-muted overflow-hidden mt-1 ml-auto">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${bestTps > 0 ? (r.tps / bestTps) * 100 : 0}%` }}
                        />
                      </div>
                    </td>

                    {/* Total TPS */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span
                        className={`font-mono text-xs ${
                          isBestTotal ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {r.totalTps.toFixed(0)}
                      </span>
                    </td>

                    {/* Mem BW */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {r.gpu.memoryBandwidthGBs} GB/s
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[10px] text-muted-foreground">
            {sorted.filter((r) => r.fitsWithN <= numGpus).length} of {sorted.length} GPUs can fit this model with {numGpus}× GPU{numGpus > 1 ? "s" : ""}. Dimmed rows need more GPUs.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Click column headers to sort. <Award className="w-3 h-3 text-amber-400 inline mb-0.5" /> = best in category.
          </p>
        </div>
      </div>
    </div>
  );
}
