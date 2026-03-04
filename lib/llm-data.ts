// ─── GPU Data ───────────────────────────────────────────────────────────────
export type GpuTier = "consumer" | "prosumer" | "datacenter";

export interface GpuSpec {
  id: string;
  name: string;
  provider: string;
  vramGb: number;
  memoryBandwidthGBs: number; // GB/s
  tflops16: number;           // FP16 / BF16 TFLOPS
  nvlinkBandwidthGBs: number; // inter-GPU bandwidth (NVLink/PCIe) GB/s
  tier: GpuTier;
}

export const GPU_LIST: GpuSpec[] = [
  // ── NVIDIA Consumer ──────────────────────────────────────────────────────
  { id: "rtx3060",    name: "RTX 3060",          provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 360,  tflops16: 12.7,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx3080",    name: "RTX 3080 10 GB",    provider: "NVIDIA", vramGb: 10,  memoryBandwidthGBs: 760,  tflops16: 29.8,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx3090",    name: "RTX 3090",           provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 936,  tflops16: 35.6,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx4070ti",  name: "RTX 4070 Ti",        provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 504,  tflops16: 40.1,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx4080",    name: "RTX 4080",           provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 717,  tflops16: 48.7,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx4090",    name: "RTX 4090",           provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 1008, tflops16: 82.6,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rtx5090",    name: "RTX 5090",           provider: "NVIDIA", vramGb: 32,  memoryBandwidthGBs: 1792, tflops16: 209.5, nvlinkBandwidthGBs: 16,  tier: "consumer" },
  // ── NVIDIA Pro / Workstation ──────────────────────────────────────────────
  { id: "a6000",      name: "RTX A6000",          provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 768,  tflops16: 38.7,  nvlinkBandwidthGBs: 112, tier: "prosumer" },
  { id: "a100_40",    name: "A100 SXM 40 GB",     provider: "NVIDIA", vramGb: 40,  memoryBandwidthGBs: 1555, tflops16: 312,   nvlinkBandwidthGBs: 600, tier: "datacenter" },
  { id: "a100_80",    name: "A100 SXM 80 GB",     provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 2039, tflops16: 312,   nvlinkBandwidthGBs: 600, tier: "datacenter" },
  { id: "h100_sxm",   name: "H100 SXM5 80 GB",   provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 3350, tflops16: 989,   nvlinkBandwidthGBs: 900, tier: "datacenter" },
  { id: "h100_pcie",  name: "H100 PCIe 80 GB",   provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 2000, tflops16: 756,   nvlinkBandwidthGBs: 400, tier: "datacenter" },
  { id: "h200",       name: "H200 SXM 141 GB",   provider: "NVIDIA", vramGb: 141, memoryBandwidthGBs: 4800, tflops16: 1979,  nvlinkBandwidthGBs: 900, tier: "datacenter" },
  { id: "b200",       name: "B200 SXM 192 GB",   provider: "NVIDIA", vramGb: 192, memoryBandwidthGBs: 8000, tflops16: 4500,  nvlinkBandwidthGBs: 1800,tier: "datacenter" },
  { id: "l40s",       name: "L40S 48 GB",        provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 864,  tflops16: 362.1, nvlinkBandwidthGBs: 96,  tier: "datacenter" },
  { id: "l4",         name: "L4 24 GB",          provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 300,  tflops16: 121.2, nvlinkBandwidthGBs: 64,  tier: "datacenter" },
  // ── AMD ──────────────────────────────────────────────────────────────────
  { id: "rx7900xtx",  name: "RX 7900 XTX",       provider: "AMD",    vramGb: 24,  memoryBandwidthGBs: 960,  tflops16: 61.4,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "rx9070xt",   name: "RX 9070 XT",        provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 640,  tflops16: 71.7,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "mi210",      name: "Instinct MI210",     provider: "AMD",    vramGb: 64,  memoryBandwidthGBs: 1638, tflops16: 181,   nvlinkBandwidthGBs: 400, tier: "datacenter" },
  { id: "mi250x",     name: "Instinct MI250X",    provider: "AMD",    vramGb: 128, memoryBandwidthGBs: 3276, tflops16: 383,   nvlinkBandwidthGBs: 800, tier: "datacenter" },
  { id: "mi300x",     name: "Instinct MI300X",    provider: "AMD",    vramGb: 192, memoryBandwidthGBs: 5300, tflops16: 1307,  nvlinkBandwidthGBs: 896, tier: "datacenter" },
  { id: "mi325x",     name: "Instinct MI325X",    provider: "AMD",    vramGb: 288, memoryBandwidthGBs: 6000, tflops16: 1300,  nvlinkBandwidthGBs: 896, tier: "datacenter" },
  // ── Intel ─────────────────────────────────────────────────────────────────
  { id: "arc770",     name: "Arc A770 16 GB",     provider: "Intel",  vramGb: 16,  memoryBandwidthGBs: 560,  tflops16: 34.9,  nvlinkBandwidthGBs: 16,  tier: "consumer" },
  { id: "gaudi2",     name: "Gaudi 2",            provider: "Intel",  vramGb: 96,  memoryBandwidthGBs: 2450, tflops16: 432,   nvlinkBandwidthGBs: 600, tier: "datacenter" },
  { id: "gaudi3",     name: "Gaudi 3",            provider: "Intel",  vramGb: 128, memoryBandwidthGBs: 3700, tflops16: 1835,  nvlinkBandwidthGBs: 800, tier: "datacenter" },
  // ── Apple ─────────────────────────────────────────────────────────────────
  { id: "m3_max",     name: "M3 Max (128 GB)",    provider: "Apple",  vramGb: 128, memoryBandwidthGBs: 400,  tflops16: 14.2,  nvlinkBandwidthGBs: 400, tier: "consumer" },
  { id: "m4_max",     name: "M4 Max (128 GB)",    provider: "Apple",  vramGb: 128, memoryBandwidthGBs: 546,  tflops16: 21.2,  nvlinkBandwidthGBs: 546, tier: "consumer" },
  { id: "m4_ultra",   name: "M4 Ultra (192 GB)",  provider: "Apple",  vramGb: 192, memoryBandwidthGBs: 820,  tflops16: 39.6,  nvlinkBandwidthGBs: 820, tier: "consumer" },
];

export const GPU_PROVIDERS = [...new Set(GPU_LIST.map((g) => g.provider))];

// ─── Quantization ────────────────────────────────────────────────────────────
export interface QuantConfig {
  id: string;
  label: string;
  bitsPerWeight: number;      // effective bits per parameter
  overheadFactor: number;     // memory overhead vs raw weights (e.g. 1.05 = 5% overhead)
  speedupFactor: number;      // relative decode speed vs FP32 baseline (higher = faster)
  qualityNote: string;
}

export const QUANT_OPTIONS: QuantConfig[] = [
  { id: "fp32",   label: "FP32 (no quant)",  bitsPerWeight: 32, overheadFactor: 1.05, speedupFactor: 0.5,  qualityNote: "Reference quality, very high VRAM" },
  { id: "bf16",   label: "BF16",             bitsPerWeight: 16, overheadFactor: 1.05, speedupFactor: 1.0,  qualityNote: "Near-lossless, standard training/inference dtype" },
  { id: "fp16",   label: "FP16",             bitsPerWeight: 16, overheadFactor: 1.05, speedupFactor: 1.0,  qualityNote: "Near-lossless, slightly higher range limit" },
  { id: "q8_0",   label: "Q8_0 (GGUF)",      bitsPerWeight: 8,  overheadFactor: 1.08, speedupFactor: 1.6,  qualityNote: "Minimal quality loss, ~2x memory saving vs FP16" },
  { id: "q6_k",   label: "Q6_K (GGUF)",      bitsPerWeight: 6,  overheadFactor: 1.08, speedupFactor: 1.9,  qualityNote: "Very low quality loss, good memory efficiency" },
  { id: "q5_k_m", label: "Q5_K_M (GGUF)",    bitsPerWeight: 5.5,overheadFactor: 1.08, speedupFactor: 2.1,  qualityNote: "Balanced quality and memory efficiency" },
  { id: "q4_k_m", label: "Q4_K_M (GGUF)",    bitsPerWeight: 4.5,overheadFactor: 1.08, speedupFactor: 2.5,  qualityNote: "Popular choice; slight quality loss, major memory saving" },
  { id: "q4_0",   label: "Q4_0 (GGUF)",      bitsPerWeight: 4,  overheadFactor: 1.06, speedupFactor: 2.6,  qualityNote: "More quality loss, very memory efficient" },
  { id: "q3_k_m", label: "Q3_K_M (GGUF)",    bitsPerWeight: 3.5,overheadFactor: 1.08, speedupFactor: 2.8,  qualityNote: "Noticeable quality loss; only for resource-limited setups" },
  { id: "q2_k",   label: "Q2_K (GGUF)",      bitsPerWeight: 2.6,overheadFactor: 1.08, speedupFactor: 3.0,  qualityNote: "Significant quality loss, minimum VRAM" },
  { id: "int8",   label: "INT8 (bitsandbytes)",bitsPerWeight: 8, overheadFactor: 1.12, speedupFactor: 1.5,  qualityNote: "Good quality, requires CUDA; popular with bitsandbytes" },
  { id: "nf4",    label: "NF4 / INT4 (QLoRA)", bitsPerWeight: 4, overheadFactor: 1.15, speedupFactor: 2.3,  qualityNote: "4-bit NormalFloat; used in QLoRA, some quality loss" },
  { id: "awq",    label: "AWQ (4-bit)",        bitsPerWeight: 4, overheadFactor: 1.10, speedupFactor: 2.8,  qualityNote: "Activation-aware quantization; good quality/speed trade-off" },
  { id: "gptq4",  label: "GPTQ 4-bit",         bitsPerWeight: 4, overheadFactor: 1.10, speedupFactor: 2.4,  qualityNote: "Post-training quantization; widely used on HuggingFace" },
];

// ─── KV Cache Precision ───────────────────────────────────────────────────────
export interface KvCacheConfig {
  id: string;
  label: string;
  bitsPerElement: number;
  qualityNote: string;
}

export const KV_CACHE_OPTIONS: KvCacheConfig[] = [
  { id: "fp32",  label: "FP32",       bitsPerElement: 32, qualityNote: "Maximum precision, rarely needed" },
  { id: "fp16",  label: "FP16/BF16",  bitsPerElement: 16, qualityNote: "Standard; no measurable quality loss" },
  { id: "fp8",   label: "FP8",        bitsPerElement: 8,  qualityNote: "Minimal quality impact; ~2x KV memory saving" },
  { id: "int8",  label: "INT8",       bitsPerElement: 8,  qualityNote: "Slight quality loss; good memory/accuracy trade-off" },
  { id: "int4",  label: "INT4",       bitsPerElement: 4,  qualityNote: "Noticeable quality impact; maximum compression" },
];

// ─── LLM Model Database ───────────────────────────────────────────────────────
export type ModelSource = "huggingface" | "ollama" | "both";

export interface ModelSpec {
  id: string;
  name: string;
  params: number;          // billions of parameters
  layers: number;
  hiddenDim: number;
  numHeads: number;
  numKvHeads: number;      // GQA/MQA — may differ from numHeads
  intermediateSize: number;// FFN intermediate size
  maxContextTokens: number;
  source: ModelSource;
  family: string;
  vocabSize: number;
  tiedEmbeddings: boolean; // whether lm_head weights are tied to embedding
}

export const MODEL_LIST: ModelSpec[] = [
  // ── Meta LLaMA family ────────────────────────────────────────────────────
  { id: "llama3_8b",    name: "Llama 3.1 8B",         params: 8.03,  layers: 32, hiddenDim: 4096, numHeads: 32, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 131072, source: "both",         family: "Llama",  vocabSize: 128256, tiedEmbeddings: false },
  { id: "llama3_70b",   name: "Llama 3.1 70B",        params: 70.6,  layers: 80, hiddenDim: 8192, numHeads: 64, numKvHeads: 8,  intermediateSize: 28672, maxContextTokens: 131072, source: "both",         family: "Llama",  vocabSize: 128256, tiedEmbeddings: false },
  { id: "llama3_405b",  name: "Llama 3.1 405B",       params: 405,   layers: 126,hiddenDim: 16384,numHeads: 128,numKvHeads: 8,  intermediateSize: 53248, maxContextTokens: 131072, source: "huggingface",  family: "Llama",  vocabSize: 128256, tiedEmbeddings: false },
  { id: "llama32_1b",   name: "Llama 3.2 1B",         params: 1.24,  layers: 16, hiddenDim: 2048, numHeads: 32, numKvHeads: 8,  intermediateSize: 8192,  maxContextTokens: 131072, source: "both",         family: "Llama",  vocabSize: 128256, tiedEmbeddings: true  },
  { id: "llama32_3b",   name: "Llama 3.2 3B",         params: 3.21,  layers: 28, hiddenDim: 3072, numHeads: 24, numKvHeads: 8,  intermediateSize: 8192,  maxContextTokens: 131072, source: "both",         family: "Llama",  vocabSize: 128256, tiedEmbeddings: true  },
  // ── Mistral / Mixtral ────────────────────────────────────────────────────
  { id: "mistral_7b",   name: "Mistral 7B v0.3",      params: 7.25,  layers: 32, hiddenDim: 4096, numHeads: 32, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 32768,  source: "both",         family: "Mistral",vocabSize: 32768,  tiedEmbeddings: false },
  { id: "mixtral_8x7b", name: "Mixtral 8x7B",         params: 46.7,  layers: 32, hiddenDim: 4096, numHeads: 32, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 32768,  source: "both",         family: "Mixtral",vocabSize: 32000,  tiedEmbeddings: false },
  { id: "mixtral_8x22b",name: "Mixtral 8x22B",        params: 141,   layers: 56, hiddenDim: 6144, numHeads: 48, numKvHeads: 8,  intermediateSize: 16384, maxContextTokens: 65536,  source: "huggingface",  family: "Mixtral",vocabSize: 32768,  tiedEmbeddings: false },
  { id: "mistral_nemo", name: "Mistral Nemo 12B",     params: 12.2,  layers: 40, hiddenDim: 5120, numHeads: 32, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 131072, source: "both",         family: "Mistral",vocabSize: 131072, tiedEmbeddings: false },
  // ── Qwen ─────────────────────────────────────────────────────────────────
  { id: "qwen25_7b",    name: "Qwen2.5 7B",           params: 7.62,  layers: 28, hiddenDim: 3584, numHeads: 28, numKvHeads: 4,  intermediateSize: 18944, maxContextTokens: 131072, source: "both",         family: "Qwen",   vocabSize: 152064, tiedEmbeddings: false },
  { id: "qwen25_14b",   name: "Qwen2.5 14B",          params: 14.8,  layers: 48, hiddenDim: 5120, numHeads: 40, numKvHeads: 8,  intermediateSize: 13824, maxContextTokens: 131072, source: "both",         family: "Qwen",   vocabSize: 152064, tiedEmbeddings: false },
  { id: "qwen25_32b",   name: "Qwen2.5 32B",          params: 32.8,  layers: 64, hiddenDim: 5120, numHeads: 40, numKvHeads: 8,  intermediateSize: 27648, maxContextTokens: 131072, source: "both",         family: "Qwen",   vocabSize: 152064, tiedEmbeddings: false },
  { id: "qwen25_72b",   name: "Qwen2.5 72B",          params: 72.7,  layers: 80, hiddenDim: 8192, numHeads: 64, numKvHeads: 8,  intermediateSize: 29568, maxContextTokens: 131072, source: "both",         family: "Qwen",   vocabSize: 152064, tiedEmbeddings: false },
  { id: "qwq_32b",      name: "QwQ 32B (reasoning)",  params: 32.8,  layers: 64, hiddenDim: 5120, numHeads: 40, numKvHeads: 8,  intermediateSize: 27648, maxContextTokens: 131072, source: "both",         family: "Qwen",   vocabSize: 152064, tiedEmbeddings: false },
  // ── Google Gemma ─────────────────────────────────────────────────────────
  { id: "gemma2_2b",    name: "Gemma 2 2B",           params: 2.61,  layers: 26, hiddenDim: 2304, numHeads: 8,  numKvHeads: 4,  intermediateSize: 9216,  maxContextTokens: 8192,   source: "both",         family: "Gemma",  vocabSize: 256000, tiedEmbeddings: true  },
  { id: "gemma2_9b",    name: "Gemma 2 9B",           params: 9.24,  layers: 42, hiddenDim: 3584, numHeads: 16, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 8192,   source: "both",         family: "Gemma",  vocabSize: 256000, tiedEmbeddings: true  },
  { id: "gemma2_27b",   name: "Gemma 2 27B",          params: 27.2,  layers: 62, hiddenDim: 4608, numHeads: 32, numKvHeads: 16, intermediateSize: 36864, maxContextTokens: 8192,   source: "both",         family: "Gemma",  vocabSize: 256000, tiedEmbeddings: true  },
  { id: "gemma3_12b",   name: "Gemma 3 12B",          params: 12.0,  layers: 40, hiddenDim: 3840, numHeads: 16, numKvHeads: 8,  intermediateSize: 30720, maxContextTokens: 131072, source: "both",         family: "Gemma",  vocabSize: 262144, tiedEmbeddings: true  },
  { id: "gemma3_27b",   name: "Gemma 3 27B",          params: 27.0,  layers: 62, hiddenDim: 5376, numHeads: 32, numKvHeads: 16, intermediateSize: 43008, maxContextTokens: 131072, source: "both",         family: "Gemma",  vocabSize: 262144, tiedEmbeddings: true  },
  // ── Microsoft Phi ─────────────────────────────────────────────────────────
  { id: "phi3_mini",    name: "Phi-3 Mini 3.8B",      params: 3.82,  layers: 32, hiddenDim: 3072, numHeads: 32, numKvHeads: 32, intermediateSize: 8192,  maxContextTokens: 131072, source: "both",         family: "Phi",    vocabSize: 32064,  tiedEmbeddings: false },
  { id: "phi3_medium",  name: "Phi-3 Medium 14B",     params: 14.0,  layers: 40, hiddenDim: 5120, numHeads: 40, numKvHeads: 10, intermediateSize: 17920, maxContextTokens: 131072, source: "both",         family: "Phi",    vocabSize: 32064,  tiedEmbeddings: false },
  { id: "phi4",         name: "Phi-4 14B",            params: 14.0,  layers: 40, hiddenDim: 5120, numHeads: 40, numKvHeads: 10, intermediateSize: 17920, maxContextTokens: 16384,  source: "both",         family: "Phi",    vocabSize: 100352, tiedEmbeddings: false },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  { id: "deepseek_r1_7b", name: "DeepSeek-R1 Distill 7B",params: 7.62,layers: 28,hiddenDim: 3584,numHeads: 28,numKvHeads: 4, intermediateSize: 18944, maxContextTokens: 131072, source: "both",         family: "DeepSeek",vocabSize: 152064, tiedEmbeddings: false },
  { id: "deepseek_r1_14b",name: "DeepSeek-R1 Distill 14B",params:14.8,layers:48, hiddenDim: 5120,numHeads: 40,numKvHeads: 8, intermediateSize: 13824, maxContextTokens: 131072, source: "both",         family: "DeepSeek",vocabSize: 152064, tiedEmbeddings: false },
  { id: "deepseek_r1_32b",name: "DeepSeek-R1 Distill 32B",params:32.8,layers:64, hiddenDim: 5120,numHeads: 40,numKvHeads: 8, intermediateSize: 27648, maxContextTokens: 131072, source: "both",         family: "DeepSeek",vocabSize: 152064, tiedEmbeddings: false },
  { id: "deepseek_r1_70b",name: "DeepSeek-R1 Distill 70B",params:70.6,layers:80, hiddenDim: 8192,numHeads: 64,numKvHeads: 8, intermediateSize: 28672, maxContextTokens: 131072, source: "both",         family: "DeepSeek",vocabSize: 128256, tiedEmbeddings: false },
  // ── Command R / Cohere ────────────────────────────────────────────────────
  { id: "command_r",    name: "Command R 35B",        params: 35.0,  layers: 40, hiddenDim: 8192, numHeads: 64, numKvHeads: 8,  intermediateSize: 22528, maxContextTokens: 131072, source: "huggingface",  family: "Cohere", vocabSize: 256000, tiedEmbeddings: false },
  // ── Falcon ────────────────────────────────────────────────────────────────
  { id: "falcon_7b",    name: "Falcon 7B",            params: 7.0,   layers: 32, hiddenDim: 4544, numHeads: 71, numKvHeads: 1,  intermediateSize: 18176, maxContextTokens: 2048,   source: "huggingface",  family: "Falcon", vocabSize: 65024,  tiedEmbeddings: false },
  // ── Ollama-specific ───────────────────────────────────────────────────────
  { id: "codellama_13b",name: "CodeLlama 13B",        params: 13.0,  layers: 40, hiddenDim: 5120, numHeads: 40, numKvHeads: 40, intermediateSize: 13824, maxContextTokens: 16384,  source: "ollama",       family: "Llama",  vocabSize: 32016,  tiedEmbeddings: false },
  { id: "codellama_34b",name: "CodeLlama 34B",        params: 34.0,  layers: 48, hiddenDim: 8192, numHeads: 64, numKvHeads: 8,  intermediateSize: 22016, maxContextTokens: 16384,  source: "ollama",       family: "Llama",  vocabSize: 32016,  tiedEmbeddings: false },
  { id: "vicuna_13b",   name: "Vicuna 13B",           params: 13.0,  layers: 40, hiddenDim: 5120, numHeads: 40, numKvHeads: 40, intermediateSize: 13824, maxContextTokens: 4096,   source: "ollama",       family: "Llama",  vocabSize: 32000,  tiedEmbeddings: false },
  { id: "solar_10_7b",  name: "SOLAR 10.7B",          params: 10.7,  layers: 48, hiddenDim: 4096, numHeads: 32, numKvHeads: 8,  intermediateSize: 14336, maxContextTokens: 4096,   source: "ollama",       family: "SOLAR",  vocabSize: 32000,  tiedEmbeddings: false },
];

export const MODEL_FAMILIES = [...new Set(MODEL_LIST.map((m) => m.family))];
export const MODEL_SOURCES: { id: ModelSource; label: string }[] = [
  { id: "huggingface", label: "Hugging Face" },
  { id: "ollama",      label: "Ollama" },
  { id: "both",        label: "Both" },
];

// ─── Calculator Core ──────────────────────────────────────────────────────────

/**
 * Compute bytes per weight element for a given quantization.
 */
export function bytesPerParam(quant: QuantConfig): number {
  return quant.bitsPerWeight / 8;
}

/**
 * Estimate model weights VRAM in GB.
 *
 * Formula:
 *   weights_GB = params_B * 1e9 * bytes_per_weight / (1024^3)
 *
 * We also apply an `overheadFactor` to account for framework tensors,
 * quantization overhead tables, etc.
 */
export function calcWeightsVram(model: ModelSpec, quant: QuantConfig): number {
  const bpw = bytesPerParam(quant);
  const rawBytes = model.params * 1e9 * bpw;
  return (rawBytes * quant.overheadFactor) / 1024 ** 3;
}

/**
 * Estimate KV cache VRAM in GB.
 *
 * For Transformer with GQA:
 *   kv_elements = 2 (K+V) * numKvHeads * (hiddenDim / numHeads) * seqLen * layers * concurrentUsers
 *
 * Per element: kv_precision_bits / 8 bytes
 *
 * Formula:
 *   kv_GB = 2 * numKvHeads * headDim * seqLen * layers * concurrentUsers * bytes_per_kv / (1024^3)
 */
export function calcKvCacheVram(
  model: ModelSpec,
  contextLen: number,
  kvCache: KvCacheConfig,
  concurrentUsers: number
): number {
  const headDim = model.hiddenDim / model.numHeads;
  const bpv = kvCache.bitsPerElement / 8;
  const elements =
    2 * model.numKvHeads * headDim * contextLen * model.layers * concurrentUsers;
  return (elements * bpv) / 1024 ** 3;
}

/**
 * Activation memory estimate in GB.
 *
 * Approximate per-layer peak activation memory during decoding:
 *   act_bytes ≈ concurrentUsers * seqLen * hiddenDim * 2 (bf16)
 *
 * For inference (no backprop), this is usually small. We use a simplified model:
 *   act_GB ≈ concurrentUsers * seqLen * hiddenDim * 2 / (1024^3)
 */
export function calcActivationVram(
  model: ModelSpec,
  contextLen: number,
  concurrentUsers: number
): number {
  // 2 bytes per element (BF16 activations)
  const bytes = concurrentUsers * contextLen * model.hiddenDim * 2;
  return bytes / 1024 ** 3;
}

export interface VramBreakdown {
  weightsGb: number;
  kvCacheGb: number;
  activationsGb: number;
  totalGb: number;
}

export function calcTotalVram(
  model: ModelSpec,
  quant: QuantConfig,
  kvCache: KvCacheConfig,
  contextLen: number,
  concurrentUsers: number
): VramBreakdown {
  const weightsGb = calcWeightsVram(model, quant);
  const kvCacheGb = calcKvCacheVram(model, contextLen, kvCache, concurrentUsers);
  const activationsGb = calcActivationVram(model, contextLen, concurrentUsers);
  const totalGb = weightsGb + kvCacheGb + activationsGb;
  return { weightsGb, kvCacheGb, activationsGb, totalGb };
}

/**
 * Estimate effective memory bandwidth available across N GPUs.
 * For multi-GPU, assumes tensor parallelism over NVLink (bottlenecked by inter-GPU bandwidth).
 *
 * Effective BW = min(gpu.memoryBandwidthGBs, gpu.nvlinkBandwidthGBs) * numGpus
 * (simplified: single-GPU = memBW; multi-GPU = min of local + inter link)
 */
export function effectiveBandwidthGBs(gpu: GpuSpec, numGpus: number): number {
  if (numGpus === 1) return gpu.memoryBandwidthGBs;
  // Tensor parallel overhead: ~85% efficiency for NVLink, 65% for PCIe
  const isNvLink = gpu.nvlinkBandwidthGBs >= 400;
  const efficiency = isNvLink ? 0.85 : 0.65;
  return gpu.memoryBandwidthGBs * numGpus * efficiency;
}

/**
 * Estimate Time-to-First-Token (TTFT) in milliseconds.
 *
 * TTFT is dominated by the prefill pass (processing the full prompt).
 * It is compute-bound:
 *   TTFT_s = 2 * params * promptTokens / (tflops * 1e12 * numGpus * parallel_efficiency)
 *
 * Factor 2: each FLOP is a multiply-add.
 * parallel_efficiency: ~0.80 for tensor parallel multi-GPU.
 *
 * We convert to milliseconds.
 */
export function calcTTFT(
  model: ModelSpec,
  quant: QuantConfig,
  gpu: GpuSpec,
  numGpus: number,
  promptTokens: number
): number {
  const parallelEff = numGpus === 1 ? 1.0 : 0.8;
  const effectiveTflops = gpu.tflops16 * numGpus * parallelEff;
  // Scale down TFLOPS for lower precision / quantization
  // FP16 baseline. Lower quant may not get full benefit on all hardware.
  const quantTflopsScale = quant.bitsPerWeight >= 8 ? 1.0 : 0.8;
  const flops = 2 * model.params * 1e9 * promptTokens;
  const timeS = flops / (effectiveTflops * 1e12 * quantTflopsScale);
  return timeS * 1000; // ms
}

/**
 * Estimate decode throughput in tokens/second.
 *
 * Decode is memory-bandwidth bound (1 token generated at a time).
 *
 * tokens_per_sec = effectiveBW_bytes_per_s / bytes_loaded_per_token
 *
 * bytes_loaded_per_token = model_param_bytes (all weights re-read per token)
 *   = params * 1e9 * bytes_per_weight / numGpus
 *
 * Divided by numGpus because weights are sharded in tensor parallelism.
 *
 * concurrentUsers reduce effective per-user tokens/s proportionally.
 */
export function calcTokensPerSecond(
  model: ModelSpec,
  quant: QuantConfig,
  gpu: GpuSpec,
  numGpus: number,
  concurrentUsers: number
): number {
  const bpw = bytesPerParam(quant);
  const modelBytes = model.params * 1e9 * bpw;
  const bytesPerTokenPerGpu = modelBytes / numGpus;
  const bwBytesPerS = effectiveBandwidthGBs(gpu, numGpus) * 1e9;
  const rawTps = bwBytesPerS / bytesPerTokenPerGpu;
  // Divide by concurrent users (batch improves hardware util but each user waits)
  return rawTps / concurrentUsers;
}

/**
 * How many GPUs of a given type are needed to fit the model.
 */
export function gpusRequired(totalVramGb: number, gpu: GpuSpec): number {
  return Math.ceil(totalVramGb / (gpu.vramGb * 0.92)); // 92% usable VRAM
}
