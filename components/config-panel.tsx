"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchableSelect, type SearchableOption } from "@/components/searchable-select";
import { SliderWithInput } from "@/components/slider-with-input";
import {
  GPU_LIST,
  GPU_PROVIDERS,
  MODEL_LIST,
  MODEL_FAMILIES,
  QUANT_OPTIONS,
  KV_CACHE_OPTIONS,
  type GpuSpec,
  type ModelSpec,
  type QuantConfig,
  type KvCacheConfig,
  type ModelSource,
} from "@/lib/llm-data";
import { Info, Cpu, Database, Settings2, LayoutGrid, Layers } from "lucide-react";

export interface CalcConfig {
  gpu: GpuSpec;
  numGpus: number;
  model: ModelSpec;
  quant: QuantConfig;
  kvCache: KvCacheConfig;
  contextLen: number;
  concurrentUsers: number;
  promptTokens: number;
}

interface ConfigPanelProps {
  config: CalcConfig;
  onChange: (config: CalcConfig) => void;
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help flex-shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

const SOURCE_LABELS: Record<ModelSource, string> = {
  huggingface: "HF",
  ollama: "Ollama",
  both: "HF + Ollama",
};

const SOURCE_COLORS: Record<ModelSource, string> = {
  huggingface: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  ollama: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  both: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function SourceBadge({ source }: { source: ModelSource }) {
  return (
    <span className={`text-[9px] px-1 py-0.5 rounded border font-medium ${SOURCE_COLORS[source]}`}>
      {SOURCE_LABELS[source]}
    </span>
  );
}

function formatContext(v: number): string {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return `${v}`;
}

function formatUsers(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`;
}

const NUM_GPUS_OPTIONS = [1, 2, 4, 8, 16, 32, 64];

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [gpuProvider, setGpuProvider] = useState(config.gpu.provider);
  const [modelFamily, setModelFamily] = useState("all");
  const [modelSource, setModelSource] = useState<"all" | ModelSource>("all");

  const update = (partial: Partial<CalcConfig>) => onChange({ ...config, ...partial });

  // ── GPU options ───────────────────────────────────────────────────────────
  const providerOptions: SearchableOption[] = useMemo(
    () => GPU_PROVIDERS.map((p) => ({ value: p, label: p })),
    []
  );

  const filteredGpus = useMemo(
    () => GPU_LIST.filter((g) => g.provider === gpuProvider),
    [gpuProvider]
  );

  const gpuOptions: SearchableOption[] = useMemo(
    () =>
      filteredGpus.map((g) => ({
        value: g.id,
        label: g.name,
        sublabel: `${g.vramGb} GB VRAM · ${g.memoryBandwidthGBs} GB/s · ${g.tflops16} TF`,
      })),
    [filteredGpus]
  );

  const numGpusOptions: SearchableOption[] = NUM_GPUS_OPTIONS.map((n) => ({
    value: String(n),
    label: `${n}× GPU${n > 1 ? "s" : ""}`,
    sublabel: `${(config.gpu.vramGb * n).toFixed(0)} GB total VRAM`,
  }));

  // ── Model options ─────────────────────────────────────────────────────────
  const filteredModels = useMemo(() => {
    return MODEL_LIST.filter((m) => {
      const familyOk = modelFamily === "all" || m.family === modelFamily;
      const sourceOk =
        modelSource === "all" || m.source === modelSource || m.source === "both";
      return familyOk && sourceOk;
    });
  }, [modelFamily, modelSource]);

  const modelFamilyOptions: SearchableOption[] = useMemo(
    () => [
      { value: "all", label: "All Families" },
      ...MODEL_FAMILIES.map((f) => ({ value: f, label: f })),
    ],
    []
  );

  const modelSourceOptions: SearchableOption[] = [
    { value: "all", label: "All Sources" },
    { value: "huggingface", label: "Hugging Face" },
    { value: "ollama", label: "Ollama" },
  ];

  const modelOptions: SearchableOption[] = useMemo(
    () =>
      filteredModels.map((m) => {
        const isMoE = Boolean(m.numExperts);
        return {
          value: m.id,
          label: m.name,
          sublabel: isMoE
            ? `${m.params}B total · ${m.activeParams}B active · ${m.numExpertsActive}/${m.numExperts} experts`
            : `${m.params}B params · ${m.layers} layers · ${m.numKvHeads} KV heads`,
          badge: <SourceBadge source={m.source} />,
        };
      }),
    [filteredModels]
  );

  const quantOptions: SearchableOption[] = QUANT_OPTIONS.map((q) => ({
    value: q.id,
    label: q.label,
    sublabel: `${q.bitsPerWeight} bpw — ${q.qualityNote}`,
  }));

  const kvCacheOptions: SearchableOption[] = KV_CACHE_OPTIONS.map((k) => ({
    value: k.id,
    label: k.label,
    sublabel: `${k.bitsPerElement} bit — ${k.qualityNote}`,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProviderChange = (p: string) => {
    setGpuProvider(p);
    const gpus = GPU_LIST.filter((g) => g.provider === p);
    if (gpus.length > 0 && !gpus.find((g) => g.id === config.gpu.id)) {
      update({ gpu: gpus[0] });
    }
  };

  const handleFamilyChange = (f: string) => {
    setModelFamily(f);
    const models = MODEL_LIST.filter((m) => {
      const familyOk = f === "all" || m.family === f;
      const sourceOk =
        modelSource === "all" || m.source === modelSource || m.source === "both";
      return familyOk && sourceOk;
    });
    if (models.length > 0 && !models.find((m) => m.id === config.model.id)) {
      update({ model: models[0] });
    }
  };

  const handleSourceChange = (s: "all" | ModelSource) => {
    setModelSource(s);
    const models = MODEL_LIST.filter((m) => {
      const familyOk = modelFamily === "all" || m.family === modelFamily;
      const sourceOk = s === "all" || m.source === s || m.source === "both";
      return familyOk && sourceOk;
    });
    if (models.length > 0 && !models.find((m) => m.id === config.model.id)) {
      update({ model: models[0] });
    }
  };

  const isMoE = Boolean(config.model.numExperts);
  const maxCtx = Math.min(config.model.maxContextTokens, 2097152); // 2M cap for UI

  return (
    <div className="flex flex-col gap-6 p-5 h-full overflow-y-auto">
      {/* ── GPU Configuration ─────────────────────────────── */}
      <section>
        <SectionHeader icon={Cpu} title="GPU Configuration" />
        <div className="flex flex-col gap-3">

          {/* Provider */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <SearchableSelect
              options={providerOptions}
              value={gpuProvider}
              onValueChange={handleProviderChange}
              searchPlaceholder="Search provider..."
            />
          </div>

          {/* GPU Model */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">GPU Model</Label>
              <InfoTooltip text="Select GPU to run inference on. VRAM, memory bandwidth, and TFLOPS directly affect all estimates." />
            </div>
            <SearchableSelect
              options={gpuOptions}
              value={config.gpu.id}
              onValueChange={(id) => {
                const gpu = GPU_LIST.find((g) => g.id === id)!;
                update({ gpu });
              }}
              searchPlaceholder="Type to search GPUs..."
              maxHeight={300}
            />
          </div>

          {/* GPU specs */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "VRAM", value: `${config.gpu.vramGb} GB` },
              { label: "Mem BW", value: `${config.gpu.memoryBandwidthGBs} GB/s` },
              { label: "FP16 TF", value: `${config.gpu.tflops16} TF` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md bg-muted/50 border border-border p-2">
                <p className="text-[10px] text-muted-foreground leading-none mb-1">{label}</p>
                <p className="text-xs font-mono font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Number of GPUs */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Number of GPUs</Label>
              <InfoTooltip text="Tensor parallelism splits the model across GPUs. More GPUs increase total VRAM and improve throughput at the cost of inter-GPU communication overhead." />
            </div>
            <SearchableSelect
              options={numGpusOptions}
              value={String(config.numGpus)}
              onValueChange={(v) => update({ numGpus: Number(v) })}
              searchPlaceholder="Select GPU count..."
            />
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Model Configuration ───────────────────────────── */}
      <section>
        <SectionHeader icon={LayoutGrid} title="Model" />
        <div className="flex flex-col gap-3">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Source</Label>
              <SearchableSelect
                options={modelSourceOptions}
                value={modelSource}
                onValueChange={(v) => handleSourceChange(v as "all" | ModelSource)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Family</Label>
              <SearchableSelect
                options={modelFamilyOptions}
                value={modelFamily}
                onValueChange={handleFamilyChange}
                searchPlaceholder="Search family..."
              />
            </div>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Model{" "}
              <span className="text-muted-foreground/60 font-normal">
                ({filteredModels.length} available)
              </span>
            </Label>
            <SearchableSelect
              options={modelOptions}
              value={config.model.id}
              onValueChange={(id) => {
                const model = MODEL_LIST.find((m) => m.id === id)!;
                update({ model, contextLen: Math.min(config.contextLen, model.maxContextTokens) });
              }}
              searchPlaceholder="Type model name..."
              maxHeight={360}
            />
          </div>

          {/* Model specs */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              {
                label: isMoE ? "Total Params" : "Params",
                value: `${config.model.params}B`,
              },
              {
                label: isMoE ? "Active Params" : "Layers",
                value: isMoE
                  ? `${config.model.activeParams}B`
                  : `${config.model.layers}`,
              },
              {
                label: "KV Heads",
                value: `${config.model.numKvHeads}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md bg-muted/50 border border-border p-2">
                <p className="text-[10px] text-muted-foreground leading-none mb-1">{label}</p>
                <p className="text-xs font-mono font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* MoE badge */}
          {isMoE && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 flex items-start gap-2">
              <Layers className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-primary font-semibold">Mixture-of-Experts:</span>{" "}
                {config.model.numExpertsActive} of {config.model.numExperts} experts active per token.
                VRAM = total params ({config.model.params}B). TTFT and tok/s use active params ({config.model.activeParams}B).
                {config.model.notes && ` ${config.model.notes}.`}
              </p>
            </div>
          )}
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Quantization & KV ─────────────────────────────── */}
      <section>
        <SectionHeader icon={Database} title="Precision" />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Weight Quantization</Label>
              <InfoTooltip text="Quantization reduces bits per weight. Lower bits = less VRAM and faster decode (memory-bound), but potential quality loss. BF16 is the reference quality baseline." />
            </div>
            <SearchableSelect
              options={quantOptions}
              value={config.quant.id}
              onValueChange={(id) => {
                const quant = QUANT_OPTIONS.find((q) => q.id === id)!;
                update({ quant });
              }}
              searchPlaceholder="Search quantization..."
              maxHeight={300}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">KV Cache Precision</Label>
              <InfoTooltip text="Key-Value cache precision. Lower = less VRAM per token per layer, allowing longer contexts or more concurrent users at the cost of slight quality degradation." />
            </div>
            <SearchableSelect
              options={kvCacheOptions}
              value={config.kvCache.id}
              onValueChange={(id) => {
                const kvCache = KV_CACHE_OPTIONS.find((k) => k.id === id)!;
                update({ kvCache });
              }}
              searchPlaceholder="Search KV precision..."
            />
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Context & Concurrency ─────────────────────────── */}
      <section>
        <SectionHeader icon={Settings2} title="Context & Workload" />
        <div className="flex flex-col gap-5">

          {/* Context length */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Context Window</Label>
              <InfoTooltip text="Total tokens (prompt + generation) held in KV cache. Larger contexts consume significantly more VRAM — linear scaling. Click the value badge to type a custom size." />
            </div>
            <SliderWithInput
              min={512}
              max={maxCtx}
              step={512}
              value={config.contextLen}
              onValueChange={(v) => update({ contextLen: v })}
              format={formatContext}
              unit="tok"
              markers={[512, Math.floor(maxCtx * 0.25), Math.floor(maxCtx * 0.5), maxCtx]}
            />
            <p className="text-[10px] text-muted-foreground">
              Max for {config.model.name}: {formatContext(config.model.maxContextTokens)}
            </p>
          </div>

          {/* Prompt tokens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Prompt Length (TTFT)</Label>
              <InfoTooltip text="Input tokens used to estimate Time-to-First-Token. Prefill is compute-bound and scales with prompt length. Click the badge to type a custom value." />
            </div>
            <SliderWithInput
              min={1}
              max={Math.min(config.contextLen, 65536)}
              step={1}
              value={config.promptTokens}
              onValueChange={(v) => update({ promptTokens: v })}
              format={formatContext}
              unit="tok"
              markers={[1, 512, 2048, 8192]}
            />
          </div>

          {/* Concurrent users */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Concurrent Users</Label>
              <InfoTooltip text="Number of simultaneous inference requests (batch size). Each user multiplies KV cache VRAM linearly. More users reduce per-user throughput but improve GPU utilization. Click badge to type up to 1024." />
            </div>
            <SliderWithInput
              min={1}
              max={4096}
              step={1}
              value={config.concurrentUsers}
              onValueChange={(v) => update({ concurrentUsers: v })}
              format={formatUsers}
              unit=" users"
              markers={[1, 32, 256, 1024, 4096]}
            />
            {config.concurrentUsers > 64 && (
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
                <p className="text-[10px] text-amber-400 leading-relaxed">
                  High concurrency: ensure total KV cache VRAM fits on your hardware. Each additional user adds {" "}
                  <span className="font-mono font-semibold">
                    {((2 * config.model.numKvHeads * (config.model.hiddenDim / config.model.numHeads) * config.contextLen * config.model.layers * (config.kvCache.bitsPerElement / 8)) / 1024 ** 3).toFixed(2)} GB
                  </span>{" "}
                  of KV cache.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
