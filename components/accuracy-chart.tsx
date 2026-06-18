"use client";

import { useMemo, useState } from "react";
import {
  calcWeightsVram,
  QUANT_OPTIONS,
  type QuantConfig,
} from "@/lib/llm-data";
import type { ModelSpec } from "@/lib/model-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Info, Scale } from "lucide-react";
import type { CalcConfig } from "@/components/config-panel";

interface AccuracyChartProps {
  config: CalcConfig;
}

// Quantization accuracy data per model family
// Format: [quant_id, bf16_baseline_score, quant_score_delta]
// Score deltas represent approximate MMLU-Pro point drops vs BF16
const ACCURACY_DATA: Record<string, Array<{ quantId: string; delta: number; note?: string }>> = {
  // Gemma 4: QAT-optimized — dramatically reduced quantization loss
  "gemma4": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -0.5, note: "Near-lossless" },
    { quantId: "gptq8", delta: -1.0 },
    { quantId: "q8_0", delta: -1.5, note: "Minimal loss" },
    { quantId: "int8", delta: -1.5 },
    { quantId: "q6_k", delta: -2.0 },
    { quantId: "q5_k_m", delta: -3.0 },
    { quantId: "q5_k_s", delta: -3.5 },
    { quantId: "q4_k_m", delta: -2.0, note: "QAT-optimized — ~2 pt vs ~5 pt PTQ" },
    { quantId: "q4_k_s", delta: -3.0, note: "QAT-optimized" },
    { quantId: "awq", delta: -3.5 },
    { quantId: "gptq4", delta: -4.0 },
    { quantId: "nf4", delta: -4.5 },
    { quantId: "iq4_xs", delta: -4.5 },
    { quantId: "q4_0", delta: -5.5, note: "PTQ only — QAT uses Q4_K_M" },
    { quantId: "q3_k_m", delta: -7.0 },
    { quantId: "q3_k_s", delta: -9.0 },
    { quantId: "q2_k", delta: -13.0 },
    { quantId: "iq1_m", delta: -17.0 },
  ],
  // GLM-5: Large MoE — robust to quantization
  "glm5": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -1.0 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0, note: "Minimal loss" },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.5 },
    { quantId: "q5_k_m", delta: -5.0 },
    { quantId: "q5_k_s", delta: -6.0 },
    { quantId: "q4_k_m", delta: -7.0, note: "MoE 744B — larger models tolerate quantization better" },
    { quantId: "q4_k_s", delta: -8.0 },
    { quantId: "awq", delta: -8.0 },
    { quantId: "gptq4", delta: -9.0 },
    { quantId: "nf4", delta: -9.5 },
    { quantId: "iq4_xs", delta: -9.5 },
    { quantId: "q4_0", delta: -11.0 },
    { quantId: "q3_k_m", delta: -14.0 },
    { quantId: "q3_k_s", delta: -17.0 },
    { quantId: "q2_k", delta: -22.0 },
    { quantId: "iq1_m", delta: -28.0 },
  ],
  // GLM-5.1: Same architecture as GLM-5 (754B MoE, 40B active) — slightly improved training
  "glm5.1": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -1.0 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0, note: "Minimal loss" },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.5 },
    { quantId: "q5_k_m", delta: -5.0 },
    { quantId: "q5_k_s", delta: -6.0 },
    { quantId: "q4_k_m", delta: -7.0, note: "MoE 754B — larger models tolerate quantization better" },
    { quantId: "q4_k_s", delta: -8.0 },
    { quantId: "awq", delta: -8.0 },
    { quantId: "gptq4", delta: -9.0 },
    { quantId: "nf4", delta: -9.5 },
    { quantId: "iq4_xs", delta: -9.5 },
    { quantId: "q4_0", delta: -11.0 },
    { quantId: "q3_k_m", delta: -14.0 },
    { quantId: "q3_k_s", delta: -17.0 },
    { quantId: "q2_k", delta: -22.0 },
    { quantId: "iq1_m", delta: -28.0 },
  ],
  // GLM-5.2: Same architecture as GLM-5.1 (753B MoE, 40B active) — 1M context, MTP
  "glm5.2": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -1.0 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0, note: "Minimal loss" },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.5 },
    { quantId: "q5_k_m", delta: -5.0 },
    { quantId: "q5_k_s", delta: -6.0 },
    { quantId: "q4_k_m", delta: -7.0, note: "753B MoE — same family as GLM-5/5.1" },
    { quantId: "q4_k_s", delta: -8.0 },
    { quantId: "awq", delta: -8.0 },
    { quantId: "gptq4", delta: -9.0 },
    { quantId: "nf4", delta: -9.5 },
    { quantId: "iq4_xs", delta: -9.5 },
    { quantId: "q4_0", delta: -11.0 },
    { quantId: "q3_k_m", delta: -14.0 },
    { quantId: "q3_k_s", delta: -17.0 },
    { quantId: "q2_k", delta: -22.0 },
    { quantId: "iq1_m", delta: -28.0 },
  ],
  // Qwen3.6: Dense 27B — moderate quantization tolerance
  "qwen3.6": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -0.8 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.5, note: "Minimal loss" },
    { quantId: "int8", delta: -2.5 },
    { quantId: "q6_k", delta: -4.0 },
    { quantId: "q5_k_m", delta: -5.5 },
    { quantId: "q5_k_s", delta: -6.5 },
    { quantId: "q4_k_m", delta: -7.5, note: "Flagship dense — strong at Q4" },
    { quantId: "q4_k_s", delta: -8.5 },
    { quantId: "awq", delta: -7.0 },
    { quantId: "gptq4", delta: -8.0 },
    { quantId: "nf4", delta: -9.0 },
    { quantId: "iq4_xs", delta: -9.0 },
    { quantId: "q4_0", delta: -10.5 },
    { quantId: "q3_k_m", delta: -13.0 },
    { quantId: "q3_k_s", delta: -16.0 },
    { quantId: "q2_k", delta: -20.0 },
    { quantId: "iq1_m", delta: -25.0 },
  ],
  // Qwen3.6 MoE variants
  "qwen3.6-moe": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -1.0 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.5 },
    { quantId: "int8", delta: -2.5 },
    { quantId: "q6_k", delta: -4.0 },
    { quantId: "q5_k_m", delta: -5.5 },
    { quantId: "q5_k_s", delta: -6.5 },
    { quantId: "q4_k_m", delta: -7.5, note: "35B-A3B MoE — 3B active params" },
    { quantId: "q4_k_s", delta: -8.5 },
    { quantId: "awq", delta: -8.0 },
    { quantId: "gptq4", delta: -9.0 },
    { quantId: "nf4", delta: -9.5 },
    { quantId: "iq4_xs", delta: -9.5 },
    { quantId: "q4_0", delta: -11.0 },
    { quantId: "q3_k_m", delta: -14.0 },
    { quantId: "q3_k_s", delta: -17.0 },
    { quantId: "q2_k", delta: -22.0 },
    { quantId: "iq1_m", delta: -28.0 },
  ],
  // DiffusionGemma: Same backbone as Gemma 4 26B-A4B
  "diffusiongemma": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -0.5 },
    { quantId: "gptq8", delta: -1.0 },
    { quantId: "q8_0", delta: -1.5, note: "Minimal loss" },
    { quantId: "int8", delta: -1.5 },
    { quantId: "q6_k", delta: -2.5 },
    { quantId: "q5_k_m", delta: -3.5 },
    { quantId: "q5_k_s", delta: -4.0 },
    { quantId: "q4_k_m", delta: -2.5, note: "QAT-optimized — ~2.5 pt vs ~5.5 pt PTQ" },
    { quantId: "q4_k_s", delta: -3.5, note: "QAT-optimized" },
    { quantId: "awq", delta: -4.0 },
    { quantId: "gptq4", delta: -4.5 },
    { quantId: "nf4", delta: -5.0 },
    { quantId: "iq4_xs", delta: -5.0 },
    { quantId: "q4_0", delta: -6.0, note: "PTQ only" },
    { quantId: "q3_k_m", delta: -8.0 },
    { quantId: "q3_k_s", delta: -10.0 },
    { quantId: "q2_k", delta: -14.0 },
    { quantId: "iq1_m", delta: -18.0 },
  ],
  // Default (catch-all for other model families)
  "default": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -0.8 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0 },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.0 },
    { quantId: "q5_k_m", delta: -4.0 },
    { quantId: "q5_k_s", delta: -5.0 },
    { quantId: "q4_k_m", delta: -5.5, note: "Popular sweet spot" },
    { quantId: "q4_k_s", delta: -6.0 },
    { quantId: "awq", delta: -5.0 },
    { quantId: "gptq4", delta: -6.0 },
    { quantId: "nf4", delta: -6.5 },
    { quantId: "iq4_xs", delta: -6.5 },
    { quantId: "q4_0", delta: -7.0 },
    { quantId: "q3_k_m", delta: -9.0 },
    { quantId: "q3_k_s", delta: -11.0 },
    { quantId: "q2_k", delta: -14.0 },
    { quantId: "iq1_m", delta: -18.0 },
  ],
  // Qwen3-Coder: MoE coding model — similar to Qwen3 30B A3B but code-optimized
  "qwen3-coder": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -0.8 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0, note: "Minimal loss" },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.0 },
    { quantId: "q5_k_m", delta: -4.0 },
    { quantId: "q5_k_s", delta: -5.0 },
    { quantId: "q4_k_m", delta: -5.5, note: "Popular sweet spot for coding tasks" },
    { quantId: "q4_k_s", delta: -6.0 },
    { quantId: "awq", delta: -5.0 },
    { quantId: "gptq4", delta: -6.0 },
    { quantId: "nf4", delta: -6.5 },
    { quantId: "iq4_xs", delta: -6.5 },
    { quantId: "q4_0", delta: -7.0 },
    { quantId: "q3_k_m", delta: -9.0 },
    { quantId: "q3_k_s", delta: -11.0 },
    { quantId: "q2_k", delta: -14.0 },
    { quantId: "iq1_m", delta: -18.0 },
  ],
  // Qwen3-Coder 480B: Massive MoE coding model — very tolerant to quantization
  "qwen3-coder-480b": [
    { quantId: "bf16", delta: 0, note: "Baseline" },
    { quantId: "fp8_e4m3", delta: -1.0 },
    { quantId: "gptq8", delta: -1.5 },
    { quantId: "q8_0", delta: -2.0, note: "Minimal loss" },
    { quantId: "int8", delta: -2.0 },
    { quantId: "q6_k", delta: -3.0 },
    { quantId: "q5_k_m", delta: -4.5 },
    { quantId: "q5_k_s", delta: -5.5 },
    { quantId: "q4_k_m", delta: -6.0, note: "480B MoE — very tolerant at Q4" },
    { quantId: "q4_k_s", delta: -7.0 },
    { quantId: "awq", delta: -6.5 },
    { quantId: "gptq4", delta: -7.5 },
    { quantId: "nf4", delta: -8.0 },
    { quantId: "iq4_xs", delta: -8.0 },
    { quantId: "q4_0", delta: -9.0 },
    { quantId: "q3_k_m", delta: -12.0 },
    { quantId: "q3_k_s", delta: -15.0 },
    { quantId: "q2_k", delta: -18.0 },
    { quantId: "iq1_m", delta: -24.0 },
  ],
};

// Weight VRAM for a given quant
function getWeightVram(model: ModelSpec, quant: QuantConfig): number {
  return calcWeightsVram(model, quant);
}

// Severity coloring
function getSeverityColor(delta: number): string {
  if (delta <= -1) return "text-emerald-400";
  if (delta <= -3) return "text-amber-400";
  if (delta <= -6) return "text-orange-400";
  return "text-red-400";
}

function getSeverityBg(delta: number): string {
  if (delta <= -1) return "bg-emerald-500/10 border-emerald-500/25";
  if (delta <= -3) return "bg-amber-500/10 border-amber-500/25";
  if (delta <= -6) return "bg-orange-500/10 border-orange-500/25";
  return "bg-red-500/10 border-red-500/25";
}

export default function AccuracyChart({ config }: AccuracyChartProps) {
  const { model, quant } = config;
  const [showDetails, setShowDetails] = useState(false);

  // Determine which accuracy dataset to use
  const familyKey = useMemo(() => {
    const name = model.name.toLowerCase();
    if (name.includes("gemma 4") || name.includes("gemma-4")) return "gemma4";
    if (name.includes("diffusiongemma") || name.includes("diffusion-gemma")) return "diffusiongemma";
    if (name.includes("glm-5.2") || name.includes("glm5.2")) return "glm5.2";
    if (name.includes("glm-5.1") || name.includes("glm5.1")) return "glm5.1";
    if (name.includes("glm-5") || name.includes("glm 5") || name.includes("glm-5 ")) return "glm5";
    if (name.includes("qwen3-coder-480") || name.includes("qwen3-coder 480")) return "qwen3-coder-480b";
    if (name.includes("qwen3-coder") || name.includes("qwen3 coder")) return "qwen3-coder";
    if (name.includes("qwen3.6") || name.includes("qwen-3.6")) {
      return model.numExperts ? "qwen3.6-moe" : "qwen3.6";
    }
    return "default";
  }, [model]);

  const accuracyData = useMemo(() => {
    return ACCURACY_DATA[familyKey] || ACCURACY_DATA["default"];
  }, [familyKey]);

  // Build chart data: only include quant levels that exist in QUANT_OPTIONS
  const chartData = useMemo(() => {
    const quantIds = new Set(QUANT_OPTIONS.map((q) => q.id));
    return accuracyData
      .filter((d) => quantIds.has(d.quantId))
      .map((d) => {
        const q = QUANT_OPTIONS.find((qq) => qq.id === d.quantId)!;
        const weightVram = getWeightVram(model, q);
        return {
          quant: q,
          delta: d.delta,
          note: d.note,
          weightVram,
        };
      })
      .sort((a, b) => a.delta - b.delta); // ascending by delta (worst first)
  }, [accuracyData, model]);

  const maxDelta = Math.abs(Math.min(...chartData.map((d) => d.delta)));
  const baselineVram = getWeightVram(model, QUANT_OPTIONS.find((q) => q.id === "bf16")!);

  // Current quant position
  const currentData = chartData.find((d) => d.quant.id === quant.id);
  const isQatOptimized = familyKey === "gemma4" || familyKey === "diffusiongemma";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Quantization Accuracy Impact
          </p>
        </div>
        {isQatOptimized && (
          <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
            QAT-optimized family
          </Badge>
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">Estimated MMLU-Pro point drop</span> vs BF16 baseline.
            {isQatOptimized ? (
              <span>
                {" "}
                <strong className="text-cyan-400">{model.name}</strong> was trained with Quantization-Aware Training (QAT),
                preserving ~70% more accuracy at Q4 compared to standard post-training quantization (PTQ).
                Typical PTQ Q4_K_M loses ~5-6 pts; QAT version loses only ~2 pts.
              </span>
            ) : (
              <span>
                Larger models ({model.params}B) tolerate quantization better than smaller ones.
                {model.numExperts && (
                  <>
                    {" "}
                    MoE variant: {model.activeParams}B active params.
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {/* Horizontal bars */}
        <div className="space-y-1.5">
          {chartData.map((d) => {
            const barWidth = maxDelta > 0 ? Math.abs(d.delta) / maxDelta * 100 : 0;
            const isSelected = d.quant.id === quant.id;
            const isBaseline = d.delta === 0;

            return (
              <div
                key={d.quant.id}
                className={`flex items-center gap-2 transition-opacity ${isSelected ? "opacity-100" : "opacity-60 hover:opacity-80"}`}
              >
                {/* Quant label */}
                <div className="w-20 flex-shrink-0 text-right">
                  <span className={`text-[10px] font-mono font-semibold ${isBaseline ? "text-foreground" : "text-muted-foreground"}`}>
                    {d.quant.label.split("(")[0].trim()}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-5 relative bg-muted/30 rounded-sm overflow-hidden">
                  {isBaseline ? (
                    <div className="absolute inset-y-0 left-0 bg-emerald-500/20 border border-emerald-500/30 rounded-sm" />
                  ) : (
                    <div
                      className={`absolute inset-y-0 left-0 rounded-sm transition-all ${getSeverityBg(d.delta).split(" ")[0]}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  )}

                  {/* VRAM label inside bar */}
                  {barWidth > 8 && (
                    <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-mono text-muted-foreground/70">
                      {d.weightVram.toFixed(1)} GB
                    </span>
                  )}
                </div>

                {/* Delta */}
                <div className="w-24 flex-shrink-0">
                  <span className={`text-[10px] font-mono font-bold ${getSeverityColor(d.delta)}`}>
                    {isBaseline ? "baseline" : `${d.delta} pts`}
                  </span>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* VRAM legend */}
        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground/60">
          <span>Left = lower accuracy</span>
          <span>Bar width ∝ accuracy loss</span>
          <span>
            Weights: <span className="font-mono text-foreground">{baselineVram.toFixed(1)} GB</span> (BF16)
          </span>
        </div>
      </div>

      {/* Toggle details */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {showDetails ? "Hide" : "Show"} detailed accuracy notes
          <span className={`transition-transform ${showDetails ? "rotate-180" : ""}`}>▾</span>
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1.5">
            {chartData.filter((d) => d.note).map((d) => (
              <div key={d.quant.id} className="flex items-start gap-2 text-[10px]">
                <span className="font-mono text-muted-foreground w-20 flex-shrink-0">
                  {d.quant.label.split("(")[0].trim()}
                </span>
                <span className="text-muted-foreground/70 leading-relaxed">{d.note}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current selection highlight */}
      {currentData && (
        <div className={`mx-4 mb-3 rounded-md border p-2.5 flex items-start gap-2 ${getSeverityBg(currentData.delta)}`}>
          <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${getSeverityColor(currentData.delta)}`} />
          <div className="text-[10px] leading-relaxed">
            <span className="font-semibold text-foreground">Currently selected:</span>{" "}
            {quant.label} — estimated{" "}
            <span className={`font-mono font-bold ${getSeverityColor(currentData.delta)}`}>
              {currentData.delta === 0 ? "no accuracy loss" : `${Math.abs(currentData.delta)}-point drop`}
            </span>{" "}
            on MMLU-Pro vs BF16 baseline.
            {currentData.weightVram < baselineVram * 0.5 && (
              <span className="text-emerald-400 ml-1">
                · Saves {(baselineVram - currentData.weightVram).toFixed(1)} GB VRAM on weights
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
