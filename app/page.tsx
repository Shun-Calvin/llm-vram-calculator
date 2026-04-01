"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ConfigPanel, { type CalcConfig } from "@/components/config-panel";
import ResultsPanel from "@/components/results-panel";
import ComparePanel from "@/components/compare-panel";
import { ShareConfigButton } from "@/components/share-config-button";
import { GPU_LIST, MODEL_LIST, QUANT_OPTIONS, KV_CACHE_OPTIONS } from "@/lib/llm-data";
import { decodeConfigFromUrl, validateConfig } from "@/lib/url-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, GitCompare, ChevronRight, Cpu, Share2 } from "lucide-react";

const DEFAULT_CONFIG: CalcConfig = {
  gpu: GPU_LIST.find((g) => g.id === "rtx4090")!,
  numGpus: 1,
  model: MODEL_LIST.find((m) => m.id === "llama3_8b")!,
  quant: QUANT_OPTIONS.find((q) => q.id === "q4_k_m")!,
  kvCache: KV_CACHE_OPTIONS.find((k) => k.id === "fp16")!,
  contextLen: 4096,
  concurrentUsers: 1,
  promptTokens: 512,
};

export default function Page() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CalcConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState("calculator");
  const [hasLoadedUrlConfig, setHasLoadedUrlConfig] = useState(false);

  // Load config from URL on mount
  useEffect(() => {
    if (hasLoadedUrlConfig) return;
    
    const search = searchParams.toString();
    if (search) {
      const loadedConfig = decodeConfigFromUrl(`?${search}`);
      if (loadedConfig && validateConfig(loadedConfig)) {
        setConfig(loadedConfig);
        setHasLoadedUrlConfig(true);
      }
    }
  }, [searchParams, hasLoadedUrlConfig]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground tracking-tight">
                LLM VRAM Calculator
              </span>
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/10 font-mono hidden sm:flex"
              >
                v4.0
              </Badge>
            </div>
            <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight className="w-3.5 h-3.5" />
              {config.model.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground hidden sm:flex">
            <span className="px-2 py-1 rounded bg-muted font-mono text-[10px]">
              {config.gpu.name}
            </span>
            <span className="px-2 py-1 rounded bg-muted font-mono text-[10px]">
              {config.numGpus}× GPU
            </span>
            <span className="px-2 py-1 rounded bg-muted font-mono text-[10px]">
              {config.quant.label}
            </span>
            <ShareConfigButton config={config} />
          </div>
        </div>
      </header>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">
                GPU Memory & Performance Estimator
              </h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                Estimate VRAM, TTFT, and tok/s for 100+ LLMs (HF + Ollama) across 70+ GPUs including H20, L20, RTX Pro 6000D Blackwell. Correct MoE formulas, up to 4096 concurrent users. Press Play to simulate inference.
              </p>
            </div>
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="calculator" className="gap-1.5 text-xs">
                <Calculator className="w-3.5 h-3.5" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5 text-xs">
                <GitCompare className="w-3.5 h-3.5" />
                Compare GPUs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calculator" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-[80vh]">
              {/* Config sidebar */}
              <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Configuration
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConfigPanel config={config} onChange={setConfig} />
                </div>
              </div>

              {/* Results main area */}
              <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Estimates
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setConfig(DEFAULT_CONFIG)}
                  >
                    Reset to defaults
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ResultsPanel config={config} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <ComparePanel baseConfig={config} />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border py-4 px-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          Estimates are physics-based approximations. Real-world performance varies by framework, driver version, and system memory bandwidth. Validated against vLLM, llama.cpp, and Ollama benchmarks.
        </p>
      </footer>
    </div>
  );
}
