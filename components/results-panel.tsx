"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, AlertTriangle, CheckCircle2, XCircle, Zap, Clock, Activity, HardDrive } from "lucide-react";
import {
  calcTotalVram,
  calcTTFT,
  calcTokensPerSecond,
  gpusRequired,
  effectiveBandwidthGBs,
  type GpuSpec,
  type ModelSpec,
  type QuantConfig,
  type KvCacheConfig,
} from "@/lib/llm-data";
import type { CalcConfig } from "@/components/config-panel";

interface ResultsPanelProps {
  config: CalcConfig;
}

function fmt(n: number, digits = 2) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(digits);
}

function fmtGb(n: number) {
  return `${n.toFixed(1)} GB`;
}

type FitStatus = "fits" | "tight" | "overflow";

function getFitStatus(totalVram: number, gpu: GpuSpec, numGpus: number): FitStatus {
  const available = gpu.vramGb * numGpus;
  const ratio = totalVram / available;
  if (ratio <= 0.85) return "fits";
  if (ratio <= 1.0) return "tight";
  return "overflow";
}

const FIT_CONFIG: Record<FitStatus, { label: string; color: string; icon: React.ElementType; bg: string; bar: string }> = {
  fits:     { label: "Fits comfortably",   color: "text-emerald-400",  icon: CheckCircle2,   bg: "bg-emerald-500/10 border-emerald-500/25", bar: "bg-emerald-500" },
  tight:    { label: "Tight fit (>85%)",   color: "text-amber-400",    icon: AlertTriangle,  bg: "bg-amber-500/10 border-amber-500/25",    bar: "bg-amber-500"   },
  overflow: { label: "Insufficient VRAM",  color: "text-red-400",      icon: XCircle,        bg: "bg-red-500/10 border-red-500/25",        bar: "bg-red-500"     },
};

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-mono font-bold ${accent ? "text-primary" : "text-foreground"}`}>
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {sub && <p className="text-[10px] text-muted-foreground leading-relaxed">{sub}</p>}
    </div>
  );
}

function FormulaBlock({ title, formula, explanation }: { title: string; formula: string; explanation: string }) {
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
  const { gpu, numGpus, model, quant, kvCache, contextLen, concurrentUsers, promptTokens } = config;

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

  const ttftDisplay =
    ttft < 1000
      ? `${ttft.toFixed(0)} ms`
      : `${(ttft / 1000).toFixed(2)} s`;

  return (
    <div className="flex flex-col gap-6 p-5 overflow-y-auto h-full">
      {/* ── Fit Status ──────────────────────────────────────── */}
      <div className={`rounded-lg border p-4 flex items-start gap-3 ${fitCfg.bg}`}>
        <FitIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${fitCfg.color}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${fitCfg.color}`}>{fitCfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtGb(vram.totalGb)} required / {fmtGb(totalAvailableVram)} available ({numGpus}× {gpu.name})
          </p>
          {fitStatus === "overflow" && (
            <p className="text-xs text-muted-foreground mt-1">
              Minimum GPUs needed: <span className="font-mono font-bold text-foreground">{minGpus}×</span>
            </p>
          )}
        </div>
      </div>

      {/* ── VRAM Usage Bar ───────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>VRAM Utilization</span>
          <span className="font-mono font-semibold text-foreground">
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${fitCfg.bar}`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        {/* Stacked bar breakdown */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary transition-all duration-500"
            style={{ width: `${(vram.weightsGb / vram.totalGb) * 100}%` }}
            title={`Weights: ${fmtGb(vram.weightsGb)}`}
          />
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${(vram.kvCacheGb / vram.totalGb) * 100}%` }}
            title={`KV Cache: ${fmtGb(vram.kvCacheGb)}`}
          />
          <div
            className="bg-purple-400 transition-all duration-500"
            style={{ width: `${(vram.activationsGb / vram.totalGb) * 100}%` }}
            title={`Activations: ${fmtGb(vram.activationsGb)}`}
          />
        </div>
        <div className="flex gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary inline-block" /> Weights {fmtGb(vram.weightsGb)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> KV Cache {fmtGb(vram.kvCacheGb)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-purple-400 inline-block" /> Activations {fmtGb(vram.activationsGb)}
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
        />
        <MetricCard
          icon={Clock}
          label="Time to First Token"
          value={ttft < 1000 ? ttft.toFixed(0) : (ttft / 1000).toFixed(2)}
          unit={ttft < 1000 ? "ms" : "s"}
          sub={`${promptTokens} prompt tokens · ${numGpus}× GPU`}
        />
        <MetricCard
          icon={Zap}
          label="Tokens / Second"
          value={tps.toFixed(1)}
          unit="tok/s"
          sub={`Per user · ${effectiveBw.toFixed(0)} GB/s eff. BW`}
        />
      </div>

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
              sub: `${model.params}B params × ${quant.bitsPerWeight} bpw × ${quant.overheadFactor}× overhead`,
              color: "bg-primary",
            },
            {
              label: "KV Cache",
              value: vram.kvCacheGb,
              sub: `2 × ${model.numKvHeads} KV heads × ${Math.round(model.hiddenDim / model.numHeads)} head dim × ${contextLen.toLocaleString()} ctx × ${model.layers} layers × ${concurrentUsers} users × ${kvCache.bitsPerElement / 8}B`,
              color: "bg-amber-500",
            },
            {
              label: "Activations",
              value: vram.activationsGb,
              sub: `${concurrentUsers} users × ${contextLen.toLocaleString()} ctx × ${model.hiddenDim} hidden × 2B (BF16)`,
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

      {/* ── Multi-GPU efficiency note ─────────────────────────── */}
      {numGpus > 1 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Tensor Parallelism ({numGpus}× GPUs):</span>{" "}
            Weights are sharded across {numGpus} GPUs, each holding{" "}
            {fmtGb(vram.weightsGb / numGpus)} of weights. Effective memory bandwidth is{" "}
            {effectiveBw.toFixed(0)} GB/s
            {gpu.nvlinkBandwidthGBs >= 400 ? " (NVLink, 85% efficiency)" : " (PCIe, 65% efficiency)"}. 
            TTFT uses {numGpus}× {gpu.tflops16} TF = {(gpu.tflops16 * numGpus * 0.8).toFixed(0)} TF effective.
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
            formula={`weights_GB = params × 10⁹ × (bits_per_weight / 8) × overhead\n          / (1024³)\n\nExample: ${model.params}B × ${quant.bitsPerWeight / 8} B/param × ${quant.overheadFactor} ÷ 1.074×10⁹\n       = ${vram.weightsGb.toFixed(2)} GB`}
            explanation="Each model parameter is stored at a precision determined by quantization. The overhead factor accounts for quantization lookup tables, framework buffers, and padding."
          />
          <FormulaBlock
            title="KV Cache VRAM"
            formula={`kv_GB = 2 × kv_heads × head_dim × seq_len × layers\n       × concurrent_users × bytes_per_kv / (1024³)\n\nhead_dim = hidden_dim / num_heads = ${model.hiddenDim} / ${model.numHeads} = ${Math.round(model.hiddenDim / model.numHeads)}\nkv_GB = 2 × ${model.numKvHeads} × ${Math.round(model.hiddenDim / model.numHeads)} × ${contextLen} × ${model.layers} × ${concurrentUsers}\n       × ${kvCache.bitsPerElement / 8} / (1024³)\n     = ${vram.kvCacheGb.toFixed(3)} GB`}
            explanation="The KV cache stores Key and Value tensors for every transformer layer. GQA/MQA models (fewer KV heads than attention heads) reduce this significantly. KV cache scales linearly with context length and concurrent users."
          />
          <FormulaBlock
            title="Time to First Token (TTFT)"
            formula={`ttft = 2 × params × prompt_tokens / (tflops × 10¹² × gpus × eff)\n\nPrefill FLOPs = 2 × ${model.params}B × ${promptTokens} = ${(2 * model.params * promptTokens / 1e3).toFixed(1)}G\nEffective TFLOPS = ${gpu.tflops16} × ${numGpus} × ${numGpus > 1 ? "0.80" : "1.0"} = ${(gpu.tflops16 * numGpus * (numGpus > 1 ? 0.8 : 1)).toFixed(1)} TF\nTTFT = ${(2 * model.params * 1e9 * promptTokens / (gpu.tflops16 * numGpus * (numGpus > 1 ? 0.8 : 1) * 1e12)).toFixed(4)} s = ${ttftDisplay}`}
            explanation="Prefill is compute-bound: it processes all prompt tokens in parallel. TTFT scales with model size and prompt length. More GPUs reduce TTFT via tensor parallelism, with ~80% efficiency on NVLink systems."
          />
          <FormulaBlock
            title="Tokens Per Second (Decode)"
            formula={`tps = effective_bandwidth / (params × bytes_per_weight / gpus)\n    / concurrent_users\n\neff_BW = ${effectiveBw.toFixed(0)} GB/s\nbytes/token = ${model.params}B × ${quant.bitsPerWeight / 8} B / ${numGpus} = ${((model.params * 1e9 * (quant.bitsPerWeight / 8)) / numGpus / 1e9).toFixed(2)} GB\ntps (raw) = ${(effectiveBw / ((model.params * 1e9 * (quant.bitsPerWeight / 8)) / numGpus / 1e9)).toFixed(1)} tok/s\ntps/user = ${tps.toFixed(1)} tok/s`}
            explanation="Token generation is memory-bandwidth bound: the model weights must be streamed from VRAM for each generated token. Quantization directly improves throughput by reducing bytes streamed. Concurrent users share the bandwidth."
          />
        </div>
      </div>

      {/* ── Sensitivity insight ───────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Key Sensitivities
        </p>
        <div className="flex flex-col gap-2">
          {[
            {
              label: "Context ×2",
              impact: `KV cache ${(vram.kvCacheGb * 2).toFixed(1)} GB (+${vram.kvCacheGb.toFixed(1)} GB)`,
              severity: vram.kvCacheGb > vram.weightsGb * 0.3 ? "high" : "low",
            },
            {
              label: "Users ×2",
              impact: `KV+Act ${((vram.kvCacheGb + vram.activationsGb) * 2).toFixed(1)} GB, TPS ÷2`,
              severity: "medium",
            },
            {
              label: "Q4 vs BF16",
              impact: `~${(vram.weightsGb * (1 - 4.5 / 16)).toFixed(1)} GB VRAM saved, ~2.5× faster decode`,
              severity: "low",
            },
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
