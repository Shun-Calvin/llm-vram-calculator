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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HardDrive, Zap, Clock, Award, ChevronUp, ChevronDown, Minus } from "lucide-react";

interface ComparePanelProps {
  baseConfig: CalcConfig;
}

interface GpuResult {
  gpu: GpuSpec;
  vramGb: number;
  ttftMs: number;
  tps: number;
  fitsWithN: number;
  usagePct: number;
}

type SortKey = "vramGb" | "ttftMs" | "tps" | "fitsWithN";

const TIER_COLORS: Record<string, string> = {
  consumer:   "border-sky-500/30 text-sky-400 bg-sky-500/10",
  prosumer:   "border-amber-500/30 text-amber-400 bg-amber-500/10",
  datacenter: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
};

const PROVIDER_FILTER_ALL = "all";

export default function ComparePanel({ baseConfig }: ComparePanelProps) {
  const [providerFilter, setProviderFilter] = useState(PROVIDER_FILTER_ALL);
  const [sortKey, setSortKey] = useState<SortKey>("tps");
  const [sortAsc, setSortAsc] = useState(false);
  const [numGpus, setNumGpus] = useState(baseConfig.numGpus);

  const providers = useMemo(
    () => [PROVIDER_FILTER_ALL, ...new Set(GPU_LIST.map((g) => g.provider))],
    []
  );

  const results: GpuResult[] = useMemo(() => {
    const gpus =
      providerFilter === PROVIDER_FILTER_ALL
        ? GPU_LIST
        : GPU_LIST.filter((g) => g.provider === providerFilter);

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
        fitsWithN: needed,
        usagePct: Math.min((vram.totalGb / available) * 100, 999),
      };
    });
  }, [baseConfig, numGpus, providerFilter]);

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
      setSortAsc(key === "tps" ? false : true);
    }
  };

  const best = {
    tps: Math.max(...results.map((r) => r.tps)),
    ttftMs: Math.min(...results.map((r) => r.ttftMs)),
  };

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
      {/* Controls */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Provider</Label>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === PROVIDER_FILTER_ALL ? "All Providers" : p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">GPUs per node</Label>
          <Select value={String(numGpus)} onValueChange={(v) => setNumGpus(Number(v))}>
            <SelectTrigger className="h-8 text-sm bg-secondary border-border w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 4, 8].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}× GPU
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Comparing for</p>
          <p className="text-sm font-semibold text-foreground">{baseConfig.model.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {baseConfig.quant.label} · {baseConfig.contextLen.toLocaleString()} ctx · {baseConfig.concurrentUsers} user{baseConfig.concurrentUsers > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  GPU
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  VRAM
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("fitsWithN")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Min GPUs <SortIcon col="fitsWithN" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("ttftMs")}
                >
                  <span className="flex items-center justify-end gap-1">
                    TTFT <SortIcon col="ttftMs" />
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort("tps")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Tok/s <SortIcon col="tps" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden md:table-cell">
                  Mem BW
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((r) => {
                const canFit = r.fitsWithN <= numGpus;
                const isBestTps = r.tps === best.tps;
                const isBestTtft = r.ttftMs === best.ttftMs;

                return (
                  <tr
                    key={r.gpu.id}
                    className={`transition-colors ${
                      !canFit
                        ? "opacity-50 bg-muted/5"
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
                            {(isBestTps || isBestTtft) && (
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

                    {/* VRAM availability */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs text-foreground">
                            {r.gpu.vramGb} GB
                          </span>
                        </div>
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              !canFit
                                ? "bg-red-500"
                                : r.usagePct > 85
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(r.usagePct * (numGpus > 0 ? 1 : 1), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Min GPUs */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono text-xs font-bold ${
                          r.fitsWithN <= numGpus
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {r.fitsWithN}×
                      </span>
                    </td>

                    {/* TTFT */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className={`w-3 h-3 ${isBestTtft ? "text-emerald-400" : "text-muted-foreground"}`} />
                        <span className={`font-mono text-xs ${isBestTtft ? "text-emerald-400 font-bold" : "text-foreground"}`}>
                          {r.ttftMs < 1000
                            ? `${r.ttftMs.toFixed(0)}ms`
                            : `${(r.ttftMs / 1000).toFixed(2)}s`}
                        </span>
                      </div>
                    </td>

                    {/* TPS */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className={`w-3 h-3 ${isBestTps ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`font-mono text-xs ${isBestTps ? "text-primary font-bold" : "text-foreground"}`}>
                          {r.tps.toFixed(1)}
                        </span>
                      </div>
                      {/* relative bar */}
                      <div className="w-16 h-1 rounded-full bg-muted overflow-hidden mt-1 ml-auto">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${(r.tps / best.tps) * 100}%` }}
                        />
                      </div>
                    </td>

                    {/* Mem BW */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
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
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Greyed-out rows cannot fit the model with {numGpus}× GPU(s). Click column headers to sort. Award icon marks the best in each performance metric.
      </p>
    </div>
  );
}
