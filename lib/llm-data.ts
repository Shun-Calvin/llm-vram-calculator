// ─── Main LLM Data & Calculator ──────────────────────────────────────────────
// Re-exports from separated data files for backwards compatibility.
// Calculator functions are here since they depend on both GPU and model types.

export type { GpuTier, GpuSpec } from "./gpu-data";
export { GPU_LIST, GPU_PROVIDERS } from "./gpu-data";

export type { ModelSource, ModelSpec } from "./model-data";
export { MODEL_LIST, MODEL_FAMILIES, MODEL_SOURCES } from "./model-data";

import type { GpuSpec } from "./gpu-data";
import type { ModelSpec } from "./model-data";

// ─── Quantization ─────────────────────────────────────────────────────────────
export interface QuantConfig {
  id: string;
  label: string;
  bitsPerWeight: number;   // effective bits per parameter
  overheadFactor: number;  // memory overhead vs raw weights (e.g. 1.05 = 5%)
  speedupFactor: number;   // relative decode speed vs FP32 baseline
  qualityNote: string;
}

export const QUANT_OPTIONS: QuantConfig[] = [
  { id: "fp32",    label: "FP32 (no quant)",        bitsPerWeight: 32,  overheadFactor: 1.05, speedupFactor: 0.5,  qualityNote: "Reference quality, extremely high VRAM usage" },
  { id: "bf16",    label: "BF16",                   bitsPerWeight: 16,  overheadFactor: 1.05, speedupFactor: 1.0,  qualityNote: "Near-lossless — standard training and inference dtype" },
  { id: "fp16",    label: "FP16",                   bitsPerWeight: 16,  overheadFactor: 1.05, speedupFactor: 1.0,  qualityNote: "Near-lossless; same size as BF16, slightly lower range" },
  { id: "fp8_e4m3",label: "FP8 E4M3",               bitsPerWeight: 8,   overheadFactor: 1.06, speedupFactor: 1.7,  qualityNote: "Minimal quality loss; supported on H100/H200/B200" },
  { id: "q8_0",   label: "Q8_0 (GGUF)",             bitsPerWeight: 8,   overheadFactor: 1.08, speedupFactor: 1.6,  qualityNote: "Minimal quality loss, ~2× memory saving vs BF16" },
  { id: "q6_k",   label: "Q6_K (GGUF)",             bitsPerWeight: 6.56,overheadFactor: 1.08, speedupFactor: 1.9,  qualityNote: "Very low quality loss, good memory efficiency" },
  { id: "q5_k_m", label: "Q5_K_M (GGUF)",           bitsPerWeight: 5.5, overheadFactor: 1.08, speedupFactor: 2.1,  qualityNote: "Balanced quality and memory efficiency" },
  { id: "q5_k_s", label: "Q5_K_S (GGUF)",           bitsPerWeight: 5.0, overheadFactor: 1.08, speedupFactor: 2.15, qualityNote: "Slightly smaller than Q5_K_M with minor quality drop" },
  { id: "q4_k_m", label: "Q4_K_M (GGUF)",           bitsPerWeight: 4.5, overheadFactor: 1.08, speedupFactor: 2.5,  qualityNote: "Popular choice; slight quality loss, major memory saving" },
  { id: "q4_k_s", label: "Q4_K_S (GGUF)",           bitsPerWeight: 4.37,overheadFactor: 1.08, speedupFactor: 2.55, qualityNote: "Slightly smaller variant of Q4_K_M" },
  { id: "q4_0",   label: "Q4_0 (GGUF)",             bitsPerWeight: 4.0, overheadFactor: 1.06, speedupFactor: 2.6,  qualityNote: "More quality loss, very memory efficient" },
  { id: "iq4_xs", label: "IQ4_XS (GGUF)",           bitsPerWeight: 4.25,overheadFactor: 1.06, speedupFactor: 2.5,  qualityNote: "iQuant 4-bit; better quality than Q4_0 at similar size" },
  { id: "q3_k_m", label: "Q3_K_M (GGUF)",           bitsPerWeight: 3.5, overheadFactor: 1.08, speedupFactor: 2.8,  qualityNote: "Noticeable quality loss; only for resource-limited setups" },
  { id: "q3_k_s", label: "Q3_K_S (GGUF)",           bitsPerWeight: 3.0, overheadFactor: 1.08, speedupFactor: 2.85, qualityNote: "Further quality degradation vs K_M variant" },
  { id: "q2_k",   label: "Q2_K (GGUF)",             bitsPerWeight: 2.63,overheadFactor: 1.08, speedupFactor: 3.0,  qualityNote: "Significant quality loss — minimum VRAM footprint" },
  { id: "iq1_m",  label: "IQ1_M (GGUF 1-bit)",      bitsPerWeight: 1.75,overheadFactor: 1.08, speedupFactor: 3.5,  qualityNote: "Very poor quality — experimental, only for huge models" },
  { id: "int8",   label: "INT8 (bitsandbytes)",      bitsPerWeight: 8,   overheadFactor: 1.12, speedupFactor: 1.5,  qualityNote: "Good quality, requires CUDA; widely used with bitsandbytes" },
  { id: "nf4",    label: "NF4 / INT4 (QLoRA)",       bitsPerWeight: 4,   overheadFactor: 1.15, speedupFactor: 2.3,  qualityNote: "4-bit NormalFloat; used in QLoRA fine-tuning and inference" },
  { id: "awq",    label: "AWQ (4-bit)",               bitsPerWeight: 4,   overheadFactor: 1.10, speedupFactor: 2.8,  qualityNote: "Activation-aware quantization; excellent quality/speed trade-off" },
  { id: "awq_2",  label: "AWQ (2-bit)",               bitsPerWeight: 2,   overheadFactor: 1.12, speedupFactor: 3.2,  qualityNote: "Aggressive 2-bit AWQ; significant quality loss" },
  { id: "gptq4",  label: "GPTQ 4-bit",               bitsPerWeight: 4,   overheadFactor: 1.10, speedupFactor: 2.4,  qualityNote: "Post-training quantization; widely used on HuggingFace" },
  { id: "gptq8",  label: "GPTQ 8-bit",               bitsPerWeight: 8,   overheadFactor: 1.10, speedupFactor: 1.6,  qualityNote: "High quality GPTQ; minimal accuracy loss" },
  { id: "gguf_f16",label: "GGUF F16",                bitsPerWeight: 16,  overheadFactor: 1.03, speedupFactor: 1.0,  qualityNote: "Full precision in GGUF format for llama.cpp / Ollama" },
];

// ─── KV Cache Precision ───────────────────────────────────────────────────────
export interface KvCacheConfig {
  id: string;
  label: string;
  bitsPerElement: number;
  qualityNote: string;
}

export const KV_CACHE_OPTIONS: KvCacheConfig[] = [
  { id: "fp32",  label: "FP32",      bitsPerElement: 32, qualityNote: "Maximum precision, rarely needed in practice" },
  { id: "fp16",  label: "FP16/BF16", bitsPerElement: 16, qualityNote: "Standard default; no measurable quality loss" },
  { id: "fp8",   label: "FP8",       bitsPerElement: 8,  qualityNote: "Minimal quality impact; ~2× KV memory saving vs FP16" },
  { id: "int8",  label: "INT8",      bitsPerElement: 8,  qualityNote: "Slight quality loss; good memory/accuracy trade-off" },
  { id: "int4",  label: "INT4",      bitsPerElement: 4,  qualityNote: "Noticeable quality impact; maximum compression" },
];

// ─── Calculator Core ──────────────────────────────────────────────────────────

/**
 * Bytes per weight element for a given quantization.
 */
export function bytesPerParam(quant: QuantConfig): number {
  return quant.bitsPerWeight / 8;
}

/**
 * Effective active parameter count for memory and TFLOPS calculations.
 *
 * For MoE models:
 *   - Weights VRAM = total params (all experts are loaded in memory)
 *   - TTFT FLOPs  = active params (only active experts process tokens)
 *   - Decode BW   = total params / numGpus (all experts streamed from HBM)
 *                   BUT only active fraction contributes to compute.
 *   - KV cache    = based on attention layers only (not per-expert)
 *
 * The `activeParams` field stores actual active params (billions).
 */
export function getActiveParams(model: ModelSpec): number {
  return model.activeParams ?? model.params;
}

/**
 * Estimate model weights VRAM in GB.
 *
 * For MoE: ALL expert weights are loaded into VRAM, even though only a
 * fraction are active per forward pass.
 *
 * Formula:
 *   weights_GB = total_params × 10⁹ × bytes_per_weight × overhead / 1024³
 */
export function calcWeightsVram(model: ModelSpec, quant: QuantConfig): number {
  const bpw = bytesPerParam(quant);
  const rawBytes = model.params * 1e9 * bpw;
  return (rawBytes * quant.overheadFactor) / 1024 ** 3;
}

/**
 * Estimate KV cache VRAM in GB.
 *
 * For Transformer with GQA/MQA:
 *   kv_elements = 2 (K+V) × numKvHeads × headDim × seqLen × layers × users
 *
 * For MoE models: KV cache is NOT replicated per expert — it depends only
 * on attention layers, not FFN layers. numKvHeads and hiddenDim reflect
 * the attention configuration only.
 *
 * Formula:
 *   kv_GB = 2 × kv_heads × head_dim × seq_len × layers × users × bpv / 1024³
 *   head_dim = hidden_dim / num_heads
 */
export function calcKvCacheVram(
  model: ModelSpec,
  contextLen: number,
  kvCache: KvCacheConfig,
  concurrentUsers: number,
  pagedAttention: boolean = false
): number {
  const headDim = model.hiddenDim / model.numHeads;
  const bpv = kvCache.bitsPerElement / 8;
  const elements =
    2 * model.numKvHeads * headDim * contextLen * model.layers * concurrentUsers;
  let gb = (elements * bpv) / 1024 ** 3;
  // Paged attention reduces memory fragmentation by ~25%
  if (pagedAttention) {
    gb *= 0.75;
  }
  return gb;
}

/**
 * Activation memory estimate in GB.
 *
 * Approximate peak activation memory during decoding.
 * For MoE models, activations are larger due to routing overhead; we apply
 * an expert factor based on the active/total expert ratio.
 *
 * Formula (dense): act_GB ≈ users × seqLen × hiddenDim × 2B / 1024³
 * For MoE: multiply by (numExpertsActive / (numExperts ?? 1))^0.5 as a mild correction
 */
export function calcActivationVram(
  model: ModelSpec,
  contextLen: number,
  concurrentUsers: number
): number {
  const bytes = concurrentUsers * contextLen * model.hiddenDim * 2;
  let gb = bytes / 1024 ** 3;
  // MoE router + gating overhead: activations are slightly larger
  if (model.numExperts && model.numExpertsActive) {
    const expertFactor = 1 + (model.numExpertsActive / model.numExperts) * 0.5;
    gb *= expertFactor;
  }
  return gb;
}

export interface VramBreakdown {
  weightsGb: number;
  kvCacheGb: number;
  activationsGb: number;
  draftModelGb: number;
  totalGb: number;
  isMoE: boolean;
  activeParamFraction?: number; // active / total params for MoE display
  pagedAttention: boolean;
  speculativeDecoding: boolean;
}

export function calcTotalVram(
  model: ModelSpec,
  quant: QuantConfig,
  kvCache: KvCacheConfig,
  contextLen: number,
  concurrentUsers: number,
  pagedAttention: boolean = false,
  speculativeDecoding: boolean = false,
  specDraftModelSize: number = 0
): VramBreakdown {
  const weightsGb = calcWeightsVram(model, quant);
  const kvCacheGb = calcKvCacheVram(model, contextLen, kvCache, concurrentUsers, pagedAttention);
  const activationsGb = calcActivationVram(model, contextLen, concurrentUsers);
  // Draft model VRAM for speculative decoding
  const draftModelGb = speculativeDecoding
    ? (specDraftModelSize * 1e9 * bytesPerParam(quant)) / 1024 ** 3
    : 0;
  const totalGb = weightsGb + kvCacheGb + activationsGb + draftModelGb;
  const isMoE = Boolean(model.numExperts);
  const activeParamFraction = isMoE
    ? getActiveParams(model) / model.params
    : undefined;
  return {
    weightsGb,
    kvCacheGb,
    activationsGb,
    draftModelGb,
    totalGb,
    isMoE,
    activeParamFraction,
    pagedAttention,
    speculativeDecoding,
  };
}

/**
 * Estimate effective memory bandwidth available across N GPUs.
 * Tensor parallelism: NVLink ~85% efficiency, PCIe ~65%.
 */
export function effectiveBandwidthGBs(gpu: GpuSpec, numGpus: number): number {
  if (numGpus === 1) return gpu.memoryBandwidthGBs;
  const isHighBandwidthLink = gpu.nvlinkBandwidthGBs >= 400;
  const efficiency = isHighBandwidthLink ? 0.85 : 0.65;
  return gpu.memoryBandwidthGBs * numGpus * efficiency;
}

/**
 * Estimate Time-to-First-Token (TTFT) in milliseconds.
 *
 * TTFT is dominated by the compute-bound prefill pass.
 *
 * For DENSE models:
 *   FLOPs = 2 × total_params × prompt_tokens
 *
 * For MoE models (CRITICAL — common mistake to use total params):
 *   FLOPs = 2 × active_params × prompt_tokens
 *   Because only active experts are computed per token, even though
 *   all experts are loaded. The "2×" accounts for multiply-accumulate.
 *
 * TTFT_s = FLOPs / (tflops × 10¹² × numGpus × parallel_efficiency)
 */
export function calcTTFT(
  model: ModelSpec,
  quant: QuantConfig,
  gpu: GpuSpec,
  numGpus: number,
  promptTokens: number
): number {
  const activeP = getActiveParams(model); // use active params, not total!
  const parallelEff = numGpus === 1 ? 1.0 : 0.8;
  const effectiveTflops = gpu.tflops16 * numGpus * parallelEff;
  // Lower precision may not reach peak TFLOPS on older hardware
  const quantTflopsScale = quant.bitsPerWeight >= 8 ? 1.0 : 0.85;
  const flops = 2 * activeP * 1e9 * promptTokens;
  const timeS = flops / (effectiveTflops * 1e12 * quantTflopsScale);
  return timeS * 1000; // ms
}

/**
 * Estimate decode throughput in tokens/second.
 *
 * Decode is memory-bandwidth bound (1 token generated at a time, weights
 * streamed from HBM).
 *
 * For DENSE models:
 *   bytes_per_token = total_params × bytes_per_weight / numGpus
 *
 * For MoE models (CRITICAL fix):
 *   All expert weights are in VRAM and streamed, but only active experts
 *   are computed. The effective bytes loaded per token scales by the
 *   active fraction (active_experts / total_experts).
 *
 *   bytes_per_token_MoE = active_params × bytes_per_weight / numGpus
 *                       + attention_params × bytes_per_weight / numGpus
 *
 *   Approximation: use active_params for MoE (dominant term for large MoE).
 *   This is correct because memory bandwidth is consumed only for the
 *   active expert weights during decoding.
 *
 *   Note: some frameworks pre-fetch all expert weights; this gives a
 *   conservative (best-case) estimate using only active params.
 *
 * tps = eff_bandwidth_bytes_s / bytes_per_token / concurrent_users
 */
export function calcTokensPerSecond(
  model: ModelSpec,
  quant: QuantConfig,
  gpu: GpuSpec,
  numGpus: number,
  concurrentUsers: number
): number {
  const bpw = bytesPerParam(quant);
  // For MoE: only active expert params are streamed per decode step
  const effectiveParams = getActiveParams(model);
  const bytesPerToken = (effectiveParams * 1e9 * bpw) / numGpus;
  const bwBytesPerS = effectiveBandwidthGBs(gpu, numGpus) * 1e9;
  // Batching improves utilization slightly (batch_factor), but each user waits proportionally
  const batchFactor = Math.min(1.0 + Math.log2(concurrentUsers) * 0.05, 1.3);
  const rawTps = (bwBytesPerS / bytesPerToken) * batchFactor;
  return rawTps / concurrentUsers;
}

/**
 * Minimum number of GPUs to fit the model.
 */
export function gpusRequired(totalVramGb: number, gpu: GpuSpec): number {
  return Math.ceil(totalVramGb / (gpu.vramGb * 0.92)); // 92% usable VRAM
}
