"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Activity,
  HardDrive,
  Layers,
} from "lucide-react";
import {
  calcTotalVram,
  calcTTFT,
  calcTokensPerSecond,
  gpusRequired,
  effectiveBandwidthGBs,
  getActiveParams,
  type GpuSpec,
} from "@/lib/llm-data";
import type { CalcConfig } from "@/components/config-panel";

interface ResultsPanelProps {
  config: CalcConfig;
}

function fmtGb(n: number) {
  return `${n.toFixed(2)} GB`;
}

type FitStatus = "fits" | "tight" | "overflow";

function getFitStatus(totalVram: number, gpu: GpuSpec, numGpus: number): FitStatus {
  const ratio = totalVram / (gpu.vramGb * numGpus);
  if (ratio <= 0.85) return "fits";
  if (ratio <= 1.0) return "tight";
  return "overflow";
}

const FIT_CONFIG: Record<
  FitStatus,
  { label: string; color: string; icon: React.ElementType; bg: string; bar: string }
> = {
  fits:     { label: "Fits comfortably",  color: "text-emerald-400", icon: CheckCircle2,  bg: "bg-emerald-500/10 border-emerald-500/25", bar: "bg-emerald-500" },
  tight:    { label: "Tight fit (>85%)",  color: "text-amber-400",   icon: AlertTriangle, bg: "bg-amber-500/10 border-amber-500/25",    bar: "bg-amber-500"   },
  overflow: { label: "Insufficient VRAM", color: "text-red-400",     icon: XCircle,       bg: "bg-red-500/10 border-red-500/25",        bar: "bg-red-500"     },
};

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  accent = false,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  accent?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-2 ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        {badge}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-mono font-bold ${
            accent ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {sub && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{sub}</p>
      )}
    </div>
  );
}

function FormulaBlock({
  title,
  formula,
  explanation,
}: {
  title: string;
  formula: string;
  explanation: string;
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left group">
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3">
        <div className="rounded-md bg-muted/40 border border-border p-3 font-mono text-xs text-primary leading-relaxed mb-2 whitespace-pre-wrap">
          {formula}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{explanation}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ResultsPanel({ config }: ResultsPanelProps) {
  const { gpu, numGpus, model, quant, kvCache, contextLen, concurrentUsers, promptTokens } =
    config;

  const vram = useMemo(
    () => calcTotalVram(model, quant, kvCache, contextLen, concurrentUsers),
    [model, quant, kvCache, contextLen, concurrentUsers]
  );

  const ttft = useMemo(
    () => calcTTFT(model, quant, gpu, numGpus, promptTokens),
    [model, quant, gpu, numGpus, promptTokens]
  );

  const tps = useMemo(
    () => calcTokensPerSecond(model, quant, gpu, numGpus, concurrentUsers),
    [model, quant, gpu, numGpus, concurrentUsers]
  );

  const totalAvailableVram = gpu.vramGb * numGpus;
  const fitStatus = getFitStatus(vram.totalGb, gpu, numGpus);
  const fitCfg = FIT_CONFIG[fitStatus];
  const FitIcon = fitCfg.icon;
  const usagePercent = Math.min((vram.totalGb / totalAvailableVram) * 100, 100);
  const minGpus = gpusRequired(vram.totalGb, gpu);
  const effectiveBw = effectiveBandwidthGBs(gpu, numGpus);
  const isMoE = vram.isMoE;
  const activeParams = getActiveParams(model);

  const ttftDisplay =
    ttft < 1000 ? `${ttft.toFixed(0)} ms` : `${(ttft / 1000).toFixed(2)} s`;

  const headDim = Math.round(model.hiddenDim / model.numHeads);
  const kvPerUser =
    (2 * model.numKvHeads * headDim * contextLen * model.layers * (kvCache.bitsPerElement / 8)) /
    1024 ** 3;

  // Throughput per user vs total system throughput
  const totalSystemTps = tps * concurrentUsers;

  return (
    <div className="flex flex-col gap-6 p-5 overflow-y-auto h-full">
      {/* ── Fit Status ──────────────────────────────────────── */}
      <div className={`rounded-lg border p-4 flex items-start gap-3 ${fitCfg.bg}`}>
        <FitIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${fitCfg.color}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${fitCfg.color}`}>{fitCfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtGb(vram.totalGb)} required / {fmtGb(totalAvailableVram)} available (
            {numGpus}× {gpu.name})
          </p>
          {fitStatus === "overflow" && (
            <p className="text-xs text-muted-foreground mt-1">
              Minimum GPUs needed:{" "}
              <span className="font-mono font-bold text-foreground">{minGpus}×</span>
            </p>
          )}
        </div>
      </div>

      {/* ── VRAM Usage Bar ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>VRAM Utilization</span>
          <span className="font-mono font-semibold text-foreground">
            {usagePercent.toFixed(1)}% of {fmtGb(totalAvailableVram)}
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${fitCfg.bar}`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {/* Stacked breakdown bar */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary transition-all duration-500"
            style={{ width: `${(vram.weightsGb / vram.totalGb) * 100}%` }}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${(vram.kvCacheGb / vram.totalGb) * 100}%` }}
          />
          <div
            className="bg-purple-400 transition-all duration-500"
            style={{ width: `${(vram.activationsGb / vram.totalGb) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary inline-block" />
            Weights {fmtGb(vram.weightsGb)}{" "}
            <span className="text-muted-foreground/60">
              ({((vram.weightsGb / vram.totalGb) * 100).toFixed(0)}%)
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" />
            KV Cache {fmtGb(vram.kvCacheGb)}{" "}
            <span className="text-muted-foreground/60">
              ({((vram.kvCacheGb / vram.totalGb) * 100).toFixed(0)}%)
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-purple-400 inline-block" />
            Activations {fmtGb(vram.activationsGb)}{" "}
            <span className="text-muted-foreground/60">
              ({((vram.activationsGb / vram.totalGb) * 100).toFixed(0)}%)
            </span>
          </span>
        </div>
      </div>

      {/* ── Primary Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          icon={HardDrive}
          label="Total VRAM"
          value={vram.totalGb.toFixed(1)}
          unit="GB"
          sub={`${quant.label} · ${concurrentUsers} user${concurrentUsers > 1 ? "s" : ""}`}
          accent
          badge={
            isMoE ? (
              <Badge
                variant="outline"
                className="text-[9px] border-primary/30 text-primary bg-primary/10"
              >
                MoE
              </Badge>
            ) : undefined
          }
        />
        <MetricCard
          icon={Clock}
          label="Time to First Token"
          value={ttft < 1000 ? ttft.toFixed(0) : (ttft / 1000).toFixed(2)}
          unit={ttft < 1000 ? "ms" : "s"}
          sub={`${promptTokens} prompt tokens · ${numGpus}× GPU · ${isMoE ? `${activeParams}B active params` : `${model.params}B params`}`}
        />
        <MetricCard
          icon={Zap}
          label="Tokens / Second"
          value={tps.toFixed(1)}
          unit="tok/s"
          sub={`Per user · ${totalSystemTps.toFixed(0)} tok/s total · ${effectiveBw.toFixed(0)} GB/s eff. BW`}
        />
      </div>

      {/* ── MoE explanation callout ──────────────────────────── */}
      {isMoE && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
          <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">MoE Calculation Notes:</span>{" "}
            Weights VRAM uses <span className="font-mono text-foreground">{model.params}B total params</span>{" "}
            (all experts loaded). TTFT and tok/s use{" "}
            <span className="font-mono text-foreground">{activeParams}B active params</span>{" "}
            ({model.numExpertsActive}/{model.numExperts} experts, {((activeParams / model.params) * 100).toFixed(1)}% of weights).
            This gives {model.name} significantly faster inference than a dense model of the same total size.
          </div>
        </div>
      )}

      {/* ── Detailed Breakdown Table ─────────────────────────── */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            VRAM Breakdown
          </p>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              label: "Model Weights",
              value: vram.weightsGb,
              sub: `${model.params}B params × ${quant.bitsPerWeight} bpw × ${quant.overheadFactor}× overhead${isMoE ? ` (${model.numExperts} experts, all loaded)` : ""}`,
              color: "bg-primary",
            },
            {
              label: "KV Cache",
              value: vram.kvCacheGb,
              sub: `2 × ${model.numKvHeads} KV heads × ${headDim} head dim × ${contextLen.toLocaleString()} ctx × ${model.layers} layers × ${concurrentUsers} users × ${kvCache.bitsPerElement / 8}B`,
              color: "bg-amber-500",
            },
            {
              label: "Activations",
              value: vram.activationsGb,
              sub: `${concurrentUsers} users × ${contextLen.toLocaleString()} ctx × ${model.hiddenDim} hidden × 2B${isMoE ? " + MoE routing overhead" : ""}`,
              color: "bg-purple-400",
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="px-4 py-3 flex items-start gap-3">
              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-1 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="font-mono text-sm font-bold text-foreground flex-shrink-0">
                    {fmtGb(value)}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 break-all">
                  {sub}
                </p>
              </div>
            </div>
          ))}
          <div className="px-4 py-3 flex items-center justify-between bg-muted/20">
            <p className="text-sm font-bold text-foreground">Total</p>
            <p className="font-mono text-sm font-bold text-primary">{fmtGb(vram.totalGb)}</p>
          </div>
        </div>
      </div>

      {/* ── Multi-GPU note ────────────────────────────────────── */}
      {numGpus > 1 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">
              Tensor Parallelism ({numGpus}× GPUs):
            </span>{" "}
            Weights sharded across {numGpus} GPUs — each holds{" "}
            {fmtGb(vram.weightsGb / numGpus)} of weights. Effective memory bandwidth:{" "}
            {effectiveBw.toFixed(0)} GB/s
            {gpu.nvlinkBandwidthGBs >= 400
              ? " (NVLink, 85% efficiency)"
              : " (PCIe, 65% efficiency)"}
            . TTFT uses {numGpus}× {gpu.tflops16} TF ={" "}
            {(gpu.tflops16 * numGpus * 0.8).toFixed(0)} TF effective.
          </div>
        </div>
      )}

      {/* ── Per-user KV note for high concurrency ────────────── */}
      {concurrentUsers > 1 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">
              Concurrency ({concurrentUsers} users):
            </span>{" "}
            Each user requires {kvPerUser.toFixed(3)} GB KV cache. Total KV:{" "}
            {fmtGb(vram.kvCacheGb)}. System total throughput:{" "}
            <span className="font-mono text-foreground font-bold">
              {totalSystemTps.toFixed(0)} tok/s
            </span>{" "}
            shared across all users ({tps.toFixed(1)} tok/s per user).
          </div>
        </div>
      )}

      <Separator className="bg-border" />

      {/* ── Formula Reference ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Formula Reference
        </p>
        <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden px-4">
          <FormulaBlock
            title="Model Weights VRAM"
            formula={[
              `weights_GB = total_params × 10⁹ × (bits_per_weight / 8) × overhead / 1024³`,
              ``,
              isMoE
                ? `[MoE] ALL ${model.numExperts} expert weights are loaded into VRAM.`
                : ``,
              `Example: ${model.params}B × ${(quant.bitsPerWeight / 8).toFixed(4)} B × ${quant.overheadFactor} ÷ 1024³`,
              `       = ${vram.weightsGb.toFixed(3)} GB`,
            ]
              .filter(Boolean)
              .join("\n")}
            explanation={
              isMoE
                ? `For MoE models, ALL expert weights must reside in VRAM simultaneously, even though only ${model.numExpertsActive} of ${model.numExperts} are active per token. The overhead factor accounts for quantization tables, routing weights, and framework buffers.`
                : `Each model parameter is stored at a precision determined by quantization. The overhead factor accounts for quantization lookup tables, framework buffers, and alignment padding.`
            }
          />
          <FormulaBlock
            title="KV Cache VRAM"
            formula={[
              `kv_GB = 2 × kv_heads × head_dim × seq_len × layers × users × bytes_per_kv / 1024³`,
              ``,
              `head_dim = hidden_dim / num_heads = ${model.hiddenDim} / ${model.numHeads} = ${headDim}`,
              ``,
              isMoE ? `[MoE] KV cache depends on attention only, NOT on expert count.` : ``,
              `kv_GB = 2 × ${model.numKvHeads} × ${headDim} × ${contextLen.toLocaleString()} × ${model.layers} × ${concurrentUsers} × ${kvCache.bitsPerElement / 8}`,
              `     = ${vram.kvCacheGb.toFixed(4)} GB`,
            ]
              .filter(Boolean)
              .join("\n")}
            explanation={`The KV cache stores Key and Value tensors for every transformer layer. With GQA (${model.numKvHeads} KV heads vs ${model.numHeads} attention heads), the cache is ${(model.numHeads / model.numKvHeads).toFixed(0)}× smaller than MHA. KV cache scales linearly with context length and concurrent users. For MoE models, the attention architecture is independent of expert routing.`}
          />
          <FormulaBlock
            title={isMoE ? "Time to First Token (MoE)" : "Time to First Token"}
            formula={[
              isMoE
                ? `[MoE] FLOPs use ACTIVE params (${activeParams}B), not total (${model.params}B)`
                : ``,
              `ttft = 2 × ${isMoE ? "active_params" : "params"} × prompt_tokens / (tflops × 10¹² × gpus × eff)`,
              ``,
              `Prefill FLOPs = 2 × ${activeParams}B × ${promptTokens} = ${((2 * activeParams * promptTokens) / 1e3).toFixed(1)}G`,
              `Eff. TFLOPS = ${gpu.tflops16} × ${numGpus} × ${numGpus > 1 ? "0.80" : "1.0"} × ${quant.bitsPerWeight >= 8 ? "1.0" : "0.85"} = ${(gpu.tflops16 * numGpus * (numGpus > 1 ? 0.8 : 1) * (quant.bitsPerWeight >= 8 ? 1 : 0.85)).toFixed(1)} TF`,
              `TTFT = ${((2 * activeParams * 1e9 * promptTokens) / (gpu.tflops16 * numGpus * (numGpus > 1 ? 0.8 : 1) * (quant.bitsPerWeight >= 8 ? 1 : 0.85) * 1e12)).toFixed(4)} s = ${ttftDisplay}`,
            ]
              .filter(Boolean)
              .join("\n")}
            explanation={
              isMoE
                ? `CRITICAL for MoE: TTFT uses ACTIVE params (${activeParams}B), not total params (${model.params}B). Only ${model.numExpertsActive} of ${model.numExperts} experts compute per token during prefill. This is why MoE models like ${model.name} achieve fast TTFT despite large total parameter counts.`
                : `Prefill is compute-bound: all prompt tokens processed in parallel. TTFT scales with model size and prompt length. More GPUs reduce TTFT via tensor parallelism (~80% efficiency on NVLink).`
            }
          />
          <FormulaBlock
            title={isMoE ? "Tokens Per Second (MoE)" : "Tokens Per Second"}
            formula={[
              isMoE
                ? `[MoE] Bandwidth uses ACTIVE params (${activeParams}B) — only active expert weights are streamed`
                : ``,
              `tps = eff_bandwidth / (${isMoE ? "active_params" : "params"} × bytes_per_weight / gpus) / users`,
              ``,
              `eff_BW = ${effectiveBw.toFixed(0)} GB/s`,
              `bytes/token = ${activeParams}B × ${(quant.bitsPerWeight / 8).toFixed(4)} B/w / ${numGpus} GPU = ${((activeParams * 1e9 * (quant.bitsPerWeight / 8)) / numGpus / 1e9).toFixed(3)} GB`,
              `tps (raw) = ${(effectiveBw / ((activeParams * 1e9 * (quant.bitsPerWeight / 8)) / numGpus / 1e9)).toFixed(1)} tok/s`,
              `tps/user  = ${tps.toFixed(1)} tok/s`,
            ]
              .filter(Boolean)
              .join("\n")}
            explanation={
              isMoE
                ? `CRITICAL for MoE: Decode throughput uses ACTIVE params (${activeParams}B). During decoding, only the ${model.numExpertsActive} active experts are streamed from HBM per token. Total params (${model.params}B) are in VRAM but not all are read each step, giving MoE models a major throughput advantage over equivalent dense models.`
                : `Token generation is memory-bandwidth bound: model weights stream from VRAM per token. Quantization directly improves throughput by reducing bytes streamed. Concurrent users share bandwidth but batching adds a slight utilization benefit.`
            }
          />
        </div>
      </div>

      {/* ── Sensitivity ───────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Key Sensitivities
        </p>
        <div className="flex flex-col gap-2">
          {[
            {
              label: "Context ×2",
              impact: `KV cache → ${(vram.kvCacheGb * 2).toFixed(2)} GB (+${vram.kvCacheGb.toFixed(2)} GB)`,
              severity: vram.kvCacheGb > vram.weightsGb * 0.3 ? "high" : "low",
            },
            {
              label: "Users ×2",
              impact: `KV+Act → ${((vram.kvCacheGb + vram.activationsGb) * 2).toFixed(2)} GB · TPS/user ÷2 · Total TPS same`,
              severity: "medium",
            },
            {
              label: "Q4 vs BF16",
              impact: `Weights: ${fmtGb(vram.weightsGb * (1 - 4.5 / 16))} saved · ~2.5× faster decode`,
              severity: "low",
            },
            ...(isMoE
              ? [
                  {
                    label: "MoE vs Dense",
                    impact: `${(model.params / activeParams).toFixed(1)}× larger VRAM vs dense ${activeParams}B, but same compute speed`,
                    severity: "medium" as const,
                  },
                ]
              : []),
          ].map(({ label, impact, severity }) => (
            <div key={label} className="flex items-start gap-2 text-xs">
              <Badge
                variant="outline"
                className={`flex-shrink-0 text-[10px] font-mono ${
                  severity === "high"
                    ? "border-red-500/30 text-red-400 bg-red-500/5"
                    : severity === "medium"
                    ? "border-amber-500/30 text-amber-400 bg-amber-500/5"
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                }`}
              >
                {label}
              </Badge>
              <span className="text-muted-foreground leading-relaxed">{impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
