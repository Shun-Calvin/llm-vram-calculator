"use client";

import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Info, Cpu, Database, Settings2, Users, LayoutGrid } from "lucide-react";

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

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
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

export default function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const [gpuProvider, setGpuProvider] = useState(config.gpu.provider);
  const [modelFamily, setModelFamily] = useState("all");
  const [modelSource, setModelSource] = useState<"all" | ModelSource>("all");

  const update = (partial: Partial<CalcConfig>) =>
    onChange({ ...config, ...partial });

  const filteredGpus = useMemo(
    () => GPU_LIST.filter((g) => g.provider === gpuProvider),
    [gpuProvider]
  );

  const filteredModels = useMemo(() => {
    return MODEL_LIST.filter((m) => {
      const familyOk = modelFamily === "all" || m.family === modelFamily;
      const sourceOk =
        modelSource === "all" ||
        m.source === modelSource ||
        m.source === "both";
      return familyOk && sourceOk;
    });
  }, [modelFamily, modelSource]);

  // ensure selected GPU stays valid when provider changes
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
        modelSource === "all" ||
        m.source === modelSource ||
        m.source === "both";
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

  const formatContext = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return `${v}`;
  };

  return (
    <div className="flex flex-col gap-6 p-5 h-full overflow-y-auto">
      {/* ── GPU Configuration ─────────────────────────────── */}
      <section>
        <SectionHeader icon={Cpu} title="GPU Configuration" />
        <div className="flex flex-col gap-3">
          {/* Provider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Provider</Label>
            </div>
            <Select value={gpuProvider} onValueChange={handleProviderChange}>
              <SelectTrigger className="h-8 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GPU_PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GPU model */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">GPU Model</Label>
              <InfoTooltip text="Select the GPU you plan to run inference on. Specs (VRAM, memory bandwidth, TFLOPS) directly affect all estimates." />
            </div>
            <Select
              value={config.gpu.id}
              onValueChange={(id) => {
                const gpu = GPU_LIST.find((g) => g.id === id)!;
                update({ gpu });
              }}
            >
              <SelectTrigger className="h-8 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredGpus.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="flex items-center gap-2">
                      {g.name}
                      <span className="text-muted-foreground text-xs">
                        {g.vramGb} GB
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GPU specs mini-card */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "VRAM", value: `${config.gpu.vramGb} GB` },
              {
                label: "Mem BW",
                value: `${config.gpu.memoryBandwidthGBs} GB/s`,
              },
              { label: "FP16 TF", value: `${config.gpu.tflops16} TF` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-md bg-muted/50 border border-border p-2"
              >
                <p className="text-[10px] text-muted-foreground leading-none mb-1">
                  {label}
                </p>
                <p className="text-xs font-mono font-semibold text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Number of GPUs */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Number of GPUs
                </Label>
                <InfoTooltip text="Tensor parallelism distributes the model across multiple GPUs. More GPUs increase total VRAM and can improve throughput, but add inter-GPU communication overhead." />
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-primary border-primary/30 bg-primary/10"
              >
                {config.numGpus}×
              </Badge>
            </div>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[config.numGpus]}
              onValueChange={([v]) => update({ numGpus: v })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              {[1, 2, 4, 8].map((n) => (
                <span key={n}>{n}×</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Model Configuration ───────────────────────────── */}
      <section>
        <SectionHeader icon={LayoutGrid} title="Model" />
        <div className="flex flex-col gap-3">
          {/* Filters row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Source</Label>
              <Select
                value={modelSource}
                onValueChange={(v) => handleSourceChange(v as "all" | ModelSource)}
              >
                <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="huggingface">Hugging Face</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Family</Label>
              <Select value={modelFamily} onValueChange={handleFamilyChange}>
                <SelectTrigger className="h-8 text-xs bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Families</SelectItem>
                  {MODEL_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Model select */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select
              value={config.model.id}
              onValueChange={(id) => {
                const model = MODEL_LIST.find((m) => m.id === id)!;
                update({ model });
              }}
            >
              <SelectTrigger className="h-8 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {filteredModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2 w-full">
                      <span className="flex-1">{m.name}</span>
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded border font-medium ${SOURCE_COLORS[m.source]}`}
                      >
                        {SOURCE_LABELS[m.source]}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model specs mini-card */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "Params", value: `${config.model.params}B` },
              { label: "Layers", value: `${config.model.layers}` },
              { label: "KV Heads", value: `${config.model.numKvHeads}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-md bg-muted/50 border border-border p-2"
              >
                <p className="text-[10px] text-muted-foreground leading-none mb-1">
                  {label}
                </p>
                <p className="text-xs font-mono font-semibold text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Quantization & KV ─────────────────────────────── */}
      <section>
        <SectionHeader icon={Database} title="Precision" />
        <div className="flex flex-col gap-3">
          {/* Quantization */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Weight Quantization
              </Label>
              <InfoTooltip text="Quantization reduces bits per weight. Lower bits = less VRAM and faster decode (memory-bound), but potential quality loss. BF16 is the reference quality baseline." />
            </div>
            <Select
              value={config.quant.id}
              onValueChange={(id) => {
                const quant = QUANT_OPTIONS.find((q) => q.id === id)!;
                update({ quant });
              }}
            >
              <SelectTrigger className="h-8 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {QUANT_OPTIONS.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    <span className="flex items-center gap-2">
                      {q.label}
                      <span className="text-[10px] text-muted-foreground">
                        {q.bitsPerWeight} bpw
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {config.quant.qualityNote}
            </p>
          </div>

          {/* KV Cache precision */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">
                KV Cache Precision
              </Label>
              <InfoTooltip text="Key-Value cache stores past attention states. Lower precision = less VRAM per token per layer, allowing longer contexts or more concurrent users." />
            </div>
            <Select
              value={config.kvCache.id}
              onValueChange={(id) => {
                const kvCache = KV_CACHE_OPTIONS.find((k) => k.id === id)!;
                update({ kvCache });
              }}
            >
              <SelectTrigger className="h-8 text-sm bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KV_CACHE_OPTIONS.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    <span className="flex items-center gap-2">
                      {k.label}
                      <span className="text-[10px] text-muted-foreground">
                        {k.bitsPerElement} bit
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {config.kvCache.qualityNote}
            </p>
          </div>
        </div>
      </section>

      <Separator className="bg-border" />

      {/* ── Context & Concurrency ─────────────────────────── */}
      <section>
        <SectionHeader icon={Settings2} title="Context & Workload" />
        <div className="flex flex-col gap-4">
          {/* Context length */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Context Window
                </Label>
                <InfoTooltip text="Total tokens (prompt + generation) to hold in KV cache. Larger contexts consume significantly more VRAM — scales linearly with context length." />
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-primary border-primary/30 bg-primary/10"
              >
                {formatContext(config.contextLen)} tok
              </Badge>
            </div>
            <Slider
              min={512}
              max={Math.min(config.model.maxContextTokens, 131072)}
              step={512}
              value={[config.contextLen]}
              onValueChange={([v]) => update({ contextLen: v })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>512</span>
              <span>
                Max: {formatContext(Math.min(config.model.maxContextTokens, 131072))}
              </span>
            </div>
          </div>

          {/* Prompt tokens */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Prompt Length (TTFT)
                </Label>
                <InfoTooltip text="Number of input tokens used to estimate Time-to-First-Token. The prefill pass is compute-bound and scales with prompt length." />
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-primary border-primary/30 bg-primary/10"
              >
                {config.promptTokens} tok
              </Badge>
            </div>
            <Slider
              min={128}
              max={Math.min(config.contextLen, 32768)}
              step={128}
              value={[config.promptTokens]}
              onValueChange={([v]) => update({ promptTokens: v })}
              className="w-full"
            />
          </div>

          {/* Concurrent users */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Concurrent Users
                </Label>
                <InfoTooltip text="Number of simultaneous inference requests. Each user multiplies KV cache VRAM and reduces per-user token throughput. More users can improve hardware utilization." />
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs text-primary border-primary/30 bg-primary/10"
              >
                {config.concurrentUsers}
              </Badge>
            </div>
            <Slider
              min={1}
              max={64}
              step={1}
              value={[config.concurrentUsers]}
              onValueChange={([v]) => update({ concurrentUsers: v })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 (single)</span>
              <span>64 (batch)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
