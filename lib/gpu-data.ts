// ─── GPU Data ────────────────────────────────────────────────────────────────
// Separated source for easy maintenance and updates.
// All bandwidth figures are in GB/s, TFLOPS are BF16/FP16, NVLink in GB/s.

export type GpuTier = "consumer" | "prosumer" | "datacenter";

export interface GpuSpec {
  id: string;
  name: string;
  provider: string;
  vramGb: number;
  memoryBandwidthGBs: number; // GB/s
  tflops16: number;           // FP16 / BF16 TFLOPS
  nvlinkBandwidthGBs: number; // inter-GPU bandwidth (NVLink/Infinity Fabric/PCIe) GB/s
  tier: GpuTier;
  releaseYear?: number;
  notes?: string;
}

export const GPU_LIST: GpuSpec[] = [
  // ── NVIDIA Consumer / Gaming ──────────────────────────────────────────────
  { id: "rtx3060",       name: "RTX 3060 12 GB",       provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 360,  tflops16: 12.7,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2021 },
  { id: "rtx3060ti",     name: "RTX 3060 Ti",          provider: "NVIDIA", vramGb: 8,   memoryBandwidthGBs: 448,  tflops16: 16.2,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rtx3070",       name: "RTX 3070",             provider: "NVIDIA", vramGb: 8,   memoryBandwidthGBs: 448,  tflops16: 20.3,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rtx3080_10gb",  name: "RTX 3080 10 GB",       provider: "NVIDIA", vramGb: 10,  memoryBandwidthGBs: 760,  tflops16: 29.8,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rtx3080_12gb",  name: "RTX 3080 12 GB",       provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 912,  tflops16: 30.6,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2021 },
  { id: "rtx3090",       name: "RTX 3090",             provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 936,  tflops16: 35.6,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rtx3090ti",     name: "RTX 3090 Ti",          provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 1008, tflops16: 40.0,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "rtx4060",       name: "RTX 4060",             provider: "NVIDIA", vramGb: 8,   memoryBandwidthGBs: 272,  tflops16: 15.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rtx4060ti_8gb", name: "RTX 4060 Ti 8 GB",    provider: "NVIDIA", vramGb: 8,   memoryBandwidthGBs: 288,  tflops16: 22.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rtx4060ti_16g", name: "RTX 4060 Ti 16 GB",   provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 288,  tflops16: 22.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rtx4070",       name: "RTX 4070",             provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 504,  tflops16: 29.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rtx4070s",      name: "RTX 4070 Super",       provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 504,  tflops16: 35.5,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2024 },
  { id: "rtx4070ti",     name: "RTX 4070 Ti",          provider: "NVIDIA", vramGb: 12,  memoryBandwidthGBs: 504,  tflops16: 40.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rtx4070tis",    name: "RTX 4070 Ti Super",    provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 672,  tflops16: 44.1,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2024 },
  { id: "rtx4080",       name: "RTX 4080",             provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 717,  tflops16: 48.7,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "rtx4080s",      name: "RTX 4080 Super",       provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 736,  tflops16: 52.2,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2024 },
  { id: "rtx4090",       name: "RTX 4090",             provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 1008, tflops16: 82.6,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "rtx5070ti",     name: "RTX 5070 Ti",          provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 896,  tflops16: 137.5, nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  { id: "rtx5080",       name: "RTX 5080",             provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 960,  tflops16: 164.7, nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  { id: "rtx5090",       name: "RTX 5090",             provider: "NVIDIA", vramGb: 32,  memoryBandwidthGBs: 1792, tflops16: 209.5, nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  // ── NVIDIA Pro / Workstation ──────────────────────────────────────────────
  { id: "rtx4000sff",    name: "RTX 4000 SFF Ada",                  provider: "NVIDIA", vramGb: 20,  memoryBandwidthGBs: 272,  tflops16: 26.7,  nvlinkBandwidthGBs: 64,   tier: "prosumer",   releaseYear: 2023 },
  { id: "rtx4500",       name: "RTX 4500 Ada",                      provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 432,  tflops16: 45.0,  nvlinkBandwidthGBs: 112,  tier: "prosumer",   releaseYear: 2023 },
  { id: "rtx5000ada",    name: "RTX 5000 Ada",                      provider: "NVIDIA", vramGb: 32,  memoryBandwidthGBs: 576,  tflops16: 65.3,  nvlinkBandwidthGBs: 112,  tier: "prosumer",   releaseYear: 2023 },
  { id: "rtx6000ada",    name: "RTX 6000 Ada",                      provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 960,  tflops16: 91.6,  nvlinkBandwidthGBs: 112,  tier: "prosumer",   releaseYear: 2022 },
  { id: "rtx_pro_6000b", name: "RTX Pro 6000 Blackwell",            provider: "NVIDIA", vramGb: 96,  memoryBandwidthGBs: 1792, tflops16: 314.9, nvlinkBandwidthGBs: 112,  tier: "prosumer",   releaseYear: 2025, notes: "Blackwell workstation, 96 GB GDDR7" },
  { id: "rtx_pro_6000d", name: "RTX Pro 6000D Blackwell Server",    provider: "NVIDIA", vramGb: 84,  memoryBandwidthGBs: 1536, tflops16: 283.0, nvlinkBandwidthGBs: 160,  tier: "prosumer",   releaseYear: 2025, notes: "Blackwell Server Edition, 84 GB HBM3, dual-slot" },
  { id: "a6000",         name: "RTX A6000 (Ampere)",                provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 768,  tflops16: 38.7,  nvlinkBandwidthGBs: 112,  tier: "prosumer",   releaseYear: 2020 },
  // ── NVIDIA Datacenter ─────────────────────────────────────────────────────
  { id: "a10",           name: "A10 24 GB",            provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 600,  tflops16: 125,   nvlinkBandwidthGBs: 64,   tier: "datacenter", releaseYear: 2021 },
  { id: "a30",           name: "A30 24 GB",            provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 933,  tflops16: 165,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2021 },
  { id: "a100_40",       name: "A100 SXM 40 GB",       provider: "NVIDIA", vramGb: 40,  memoryBandwidthGBs: 1555, tflops16: 312,   nvlinkBandwidthGBs: 600,  tier: "datacenter", releaseYear: 2020 },
  { id: "a100_80",       name: "A100 SXM 80 GB",       provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 2039, tflops16: 312,   nvlinkBandwidthGBs: 600,  tier: "datacenter", releaseYear: 2020 },
  { id: "a100_pcie",     name: "A100 PCIe 80 GB",      provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 1935, tflops16: 312,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2020 },
  { id: "h100_sxm",      name: "H100 SXM5 80 GB",      provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 3350, tflops16: 989,   nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2022 },
  { id: "h100_pcie",     name: "H100 PCIe 80 GB",      provider: "NVIDIA", vramGb: 80,  memoryBandwidthGBs: 2000, tflops16: 756,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2022 },
  { id: "h100_nvl",      name: "H100 NVL 94 GB",       provider: "NVIDIA", vramGb: 94,  memoryBandwidthGBs: 3900, tflops16: 989,   nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2023 },
  { id: "h200",          name: "H200 SXM 141 GB",      provider: "NVIDIA", vramGb: 141, memoryBandwidthGBs: 4800, tflops16: 1979,  nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2024 },
  { id: "h200_nvl",      name: "H200 NVL 141 GB",      provider: "NVIDIA", vramGb: 141, memoryBandwidthGBs: 4800, tflops16: 1979,  nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2024 },
  { id: "b100",          name: "B100 SXM 192 GB",      provider: "NVIDIA", vramGb: 192, memoryBandwidthGBs: 8000, tflops16: 3500,  nvlinkBandwidthGBs: 1800, tier: "datacenter", releaseYear: 2025, notes: "Blackwell" },
  { id: "b200",          name: "B200 SXM 192 GB",      provider: "NVIDIA", vramGb: 192, memoryBandwidthGBs: 8000, tflops16: 4500,  nvlinkBandwidthGBs: 1800, tier: "datacenter", releaseYear: 2025, notes: "Blackwell" },
  { id: "gb200",         name: "GB200 NVL 384 GB",     provider: "NVIDIA", vramGb: 384, memoryBandwidthGBs: 16000,tflops16: 9000,  nvlinkBandwidthGBs: 3600, tier: "datacenter", releaseYear: 2025, notes: "Blackwell NVL pair" },
  { id: "l4",            name: "L4 24 GB",                          provider: "NVIDIA", vramGb: 24,  memoryBandwidthGBs: 300,  tflops16: 121.2, nvlinkBandwidthGBs: 64,   tier: "datacenter", releaseYear: 2023 },
  { id: "l20",           name: "L20 48 GB",                         provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 864,  tflops16: 239.3, nvlinkBandwidthGBs: 96,   tier: "datacenter", releaseYear: 2024, notes: "Ada Lovelace, designed for inference" },
  { id: "l40",           name: "L40 48 GB",                         provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 864,  tflops16: 181,   nvlinkBandwidthGBs: 96,   tier: "datacenter", releaseYear: 2022 },
  { id: "l40s",          name: "L40S 48 GB",                        provider: "NVIDIA", vramGb: 48,  memoryBandwidthGBs: 864,  tflops16: 362.1, nvlinkBandwidthGBs: 96,   tier: "datacenter", releaseYear: 2023 },
  { id: "h20",           name: "H20 96 GB",                         provider: "NVIDIA", vramGb: 96,  memoryBandwidthGBs: 4000, tflops16: 296,   nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2024, notes: "Hopper, export-compliant, high HBM3e BW" },
  { id: "p100",          name: "P100 16 GB",                        provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 720,  tflops16: 18.7,  nvlinkBandwidthGBs: 160,  tier: "datacenter", releaseYear: 2016 },
  { id: "v100_16",       name: "V100 16 GB",                        provider: "NVIDIA", vramGb: 16,  memoryBandwidthGBs: 900,  tflops16: 125,   nvlinkBandwidthGBs: 300,  tier: "datacenter", releaseYear: 2017 },
  { id: "v100_32",       name: "V100 SXM2 32 GB",                   provider: "NVIDIA", vramGb: 32,  memoryBandwidthGBs: 900,  tflops16: 125,   nvlinkBandwidthGBs: 300,  tier: "datacenter", releaseYear: 2018 },
  // ── AMD Consumer ──────────────────────────────────────────────────────────
  { id: "rx6800xt",      name: "RX 6800 XT",           provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 512,  tflops16: 20.7,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rx6900xt",      name: "RX 6900 XT",           provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 512,  tflops16: 23.0,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2020 },
  { id: "rx7800xt",      name: "RX 7800 XT",           provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 624,  tflops16: 37.3,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rx7900gre",     name: "RX 7900 GRE",          provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 576,  tflops16: 46.4,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2023 },
  { id: "rx7900xt",      name: "RX 7900 XT",           provider: "AMD",    vramGb: 20,  memoryBandwidthGBs: 800,  tflops16: 51.6,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "rx7900xtx",     name: "RX 7900 XTX",          provider: "AMD",    vramGb: 24,  memoryBandwidthGBs: 960,  tflops16: 61.4,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "rx9060xt",      name: "RX 9060 XT",           provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 512,  tflops16: 55.0,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  { id: "rx9070",        name: "RX 9070",              provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 576,  tflops16: 58.0,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  { id: "rx9070xt",      name: "RX 9070 XT",           provider: "AMD",    vramGb: 16,  memoryBandwidthGBs: 640,  tflops16: 71.7,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  // ── AMD Datacenter ────────────────────────────────────────────────────────
  { id: "mi100",         name: "Instinct MI100",        provider: "AMD",    vramGb: 32,  memoryBandwidthGBs: 1229, tflops16: 184,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2020 },
  { id: "mi210",         name: "Instinct MI210",        provider: "AMD",    vramGb: 64,  memoryBandwidthGBs: 1638, tflops16: 181,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2021 },
  { id: "mi250",         name: "Instinct MI250",        provider: "AMD",    vramGb: 128, memoryBandwidthGBs: 3276, tflops16: 362,   nvlinkBandwidthGBs: 800,  tier: "datacenter", releaseYear: 2021 },
  { id: "mi250x",        name: "Instinct MI250X",       provider: "AMD",    vramGb: 128, memoryBandwidthGBs: 3276, tflops16: 383,   nvlinkBandwidthGBs: 800,  tier: "datacenter", releaseYear: 2021 },
  { id: "mi300a",        name: "Instinct MI300A",       provider: "AMD",    vramGb: 128, memoryBandwidthGBs: 5300, tflops16: 1307,  nvlinkBandwidthGBs: 896,  tier: "datacenter", releaseYear: 2023, notes: "APU with CPU+GPU" },
  { id: "mi300x",        name: "Instinct MI300X",       provider: "AMD",    vramGb: 192, memoryBandwidthGBs: 5300, tflops16: 1307,  nvlinkBandwidthGBs: 896,  tier: "datacenter", releaseYear: 2023 },
  { id: "mi325x",        name: "Instinct MI325X",       provider: "AMD",    vramGb: 288, memoryBandwidthGBs: 6000, tflops16: 1300,  nvlinkBandwidthGBs: 896,  tier: "datacenter", releaseYear: 2024 },
  { id: "mi350x",        name: "Instinct MI350X",       provider: "AMD",    vramGb: 288, memoryBandwidthGBs: 8000, tflops16: 2300,  nvlinkBandwidthGBs: 1600, tier: "datacenter", releaseYear: 2025 },
  // ── Intel ─────────────────────────────────────────────────────────────────
  { id: "arc770",        name: "Arc A770 16 GB",        provider: "Intel",  vramGb: 16,  memoryBandwidthGBs: 560,  tflops16: 34.9,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2022 },
  { id: "arc_b580",      name: "Arc B580",              provider: "Intel",  vramGb: 12,  memoryBandwidthGBs: 456,  tflops16: 23.5,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2024 },
  { id: "arc_b770",      name: "Arc B770",              provider: "Intel",  vramGb: 16,  memoryBandwidthGBs: 608,  tflops16: 36.0,  nvlinkBandwidthGBs: 16,   tier: "consumer",   releaseYear: 2025 },
  { id: "gaudi2",        name: "Gaudi 2",               provider: "Intel",  vramGb: 96,  memoryBandwidthGBs: 2450, tflops16: 432,   nvlinkBandwidthGBs: 600,  tier: "datacenter", releaseYear: 2022 },
  { id: "gaudi3",        name: "Gaudi 3",               provider: "Intel",  vramGb: 128, memoryBandwidthGBs: 3700, tflops16: 1835,  nvlinkBandwidthGBs: 800,  tier: "datacenter", releaseYear: 2024 },
  // ── Apple Silicon ─────────────────────────────────────────────────────────
  { id: "m2_max",        name: "M2 Max (96 GB)",        provider: "Apple",  vramGb: 96,  memoryBandwidthGBs: 400,  tflops16: 13.6,  nvlinkBandwidthGBs: 400,  tier: "consumer",   releaseYear: 2023 },
  { id: "m2_ultra",      name: "M2 Ultra (192 GB)",     provider: "Apple",  vramGb: 192, memoryBandwidthGBs: 800,  tflops16: 27.2,  nvlinkBandwidthGBs: 800,  tier: "consumer",   releaseYear: 2023 },
  { id: "m3_max",        name: "M3 Max (128 GB)",       provider: "Apple",  vramGb: 128, memoryBandwidthGBs: 400,  tflops16: 14.2,  nvlinkBandwidthGBs: 400,  tier: "consumer",   releaseYear: 2023 },
  { id: "m4_max",        name: "M4 Max (128 GB)",       provider: "Apple",  vramGb: 128, memoryBandwidthGBs: 546,  tflops16: 21.2,  nvlinkBandwidthGBs: 546,  tier: "consumer",   releaseYear: 2024 },
  { id: "m4_ultra",      name: "M4 Ultra (192 GB)",     provider: "Apple",  vramGb: 192, memoryBandwidthGBs: 820,  tflops16: 39.6,  nvlinkBandwidthGBs: 820,  tier: "consumer",   releaseYear: 2025 },
  // ── Qualcomm ──────────────────────────────────────────────────────────────
  { id: "cloud_ai100",   name: "Cloud AI 100 Ultra",    provider: "Qualcomm", vramGb: 154, memoryBandwidthGBs: 3686, tflops16: 2000, nvlinkBandwidthGBs: 600,  tier: "datacenter", releaseYear: 2023 },
  // ── Google TPU ────────────────────────────────────────────────────────────
  { id: "tpu_v4",        name: "TPU v4",                provider: "Google", vramGb: 32,  memoryBandwidthGBs: 1200, tflops16: 275,   nvlinkBandwidthGBs: 600,  tier: "datacenter", releaseYear: 2021, notes: "HBM per chip" },
  { id: "tpu_v5e",       name: "TPU v5e",               provider: "Google", vramGb: 16,  memoryBandwidthGBs: 819,  tflops16: 197,   nvlinkBandwidthGBs: 400,  tier: "datacenter", releaseYear: 2023, notes: "HBM per chip" },
  { id: "tpu_v5p",       name: "TPU v5p",               provider: "Google", vramGb: 95,  memoryBandwidthGBs: 2765, tflops16: 459,   nvlinkBandwidthGBs: 900,  tier: "datacenter", releaseYear: 2023, notes: "HBM per chip" },
  { id: "tpu_v6e",       name: "TPU v6e (Trillium)",    provider: "Google", vramGb: 32,  memoryBandwidthGBs: 1638, tflops16: 918,   nvlinkBandwidthGBs: 800,  tier: "datacenter", releaseYear: 2024, notes: "HBM per chip" },
];

export const GPU_PROVIDERS = [...new Set(GPU_LIST.map((g) => g.provider))].sort();
