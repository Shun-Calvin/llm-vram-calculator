"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, RotateCcw, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InferenceSimulatorProps {
  ttftMs: number;
  tokensPerSecond: number;
  concurrentUsers: number;
  modelName: string;
  promptTokens: number;
  className?: string;
}

type SimPhase = "idle" | "prefill" | "generating" | "done";

const SAMPLE_OUTPUTS: string[] = [
  "Large language models require significant GPU memory for deployment. The memory requirements scale with both the number of parameters and the precision used during inference. For a 7B parameter model in BF16, you need approximately 14 GB of VRAM just for the weights, before accounting for KV cache, activations, and framework overhead. Quantization reduces this by storing weights at lower precision. For example, Q4_K_M uses 4.5 bits per weight, cutting memory by about 3.5x compared to FP16. This allows models that would normally require multiple GPUs to run on a single consumer GPU. The key trade-off is between model quality and memory usage. Lower precision quantization introduces more noise into the weights, which can degrade output quality for complex tasks like reasoning and mathematics. For simple tasks like text completion or summarization, aggressive quantization often works well with minimal quality loss.",
  "Mixture-of-Experts architectures offer a compelling trade-off: by activating only a subset of experts per token, MoE models can achieve the quality of much larger dense models while keeping compute and memory bandwidth costs proportional to the active parameter count. In an MoE model with 256 total experts and 8 active per token, only about 3 percent of the total parameters are computed for each forward pass, yet all expert weights must remain in GPU memory. This is why a model like DeepSeek V3 with 685 billion total parameters can achieve inference speeds comparable to a 37 billion parameter dense model. The KV cache for MoE models is also independent of expert count since it depends only on the attention layers, not the feed-forward expert layers. Expert offloading can further reduce VRAM usage by keeping only frequently used experts on the GPU while offloading others to CPU memory.",
  "When deploying LLMs in production, the token generation rate is fundamentally memory-bandwidth bound. Each decode step requires streaming the full model weights from HBM to compute units regardless of how powerful GPU tensor cores are. This means that memory bandwidth is usually the primary bottleneck for inference throughput. For a model with active parameters A and quantization of B bytes per parameter, each generated token requires reading A times B bytes from memory. With a memory bandwidth of 1000 GB per second, a 70B parameter model at 4-bit quantization can generate approximately 1000 divided by 70 times 0.5 tokens per second, or around 28 tokens per second. Using tensor parallelism across multiple GPUs increases effective bandwidth proportionally but adds communication overhead.",
  "Context window size has a quadratic relationship with attention compute but only a linear relationship with KV cache memory. A 128K context window requires 32 times more KV cache memory than a 4K window, making quantized KV cache essential for long-context deployments. The KV cache stores key and value tensors for every token in the sequence across all attention layers. With Grouped Query Attention using 8 KV heads instead of 32 query heads, the KV cache is 4 times smaller than standard multi-head attention. For a 70B model with 80 layers processing 128K context, the KV cache alone can exceed 50 GB of VRAM per user. Paged attention algorithms used in vLLM and similar frameworks reduce memory fragmentation by dynamically allocating KV cache blocks, saving approximately 20 to 40 percent of KV cache memory.",
  "With tensor parallelism across 8 GPUs, inference throughput scales near-linearly for memory-bandwidth-bound workloads, while TTFT benefits from the combined TFLOPS though inter-GPU communication overhead becomes the bottleneck at higher GPU counts. Each GPU holds a shard of the model weights and computes its portion of each transformer layer. For the forward pass, GPUs must communicate via NVLink or Infinity Fabric to synchronize attention outputs and feed-forward network results. The communication overhead scales with model dimension and sequence length, and can dominate at very large GPU counts. For optimal efficiency, models should be large enough to justify the communication cost. A rule of thumb is that each GPU should hold at least 5 to 10 billion parameters worth of sharded weights.",
  "Speculative decoding is a technique to accelerate text generation by using a small draft model to predict multiple tokens ahead, which are then verified in parallel by the main model. This works because the draft model runs much faster due to its smaller size, while the verification pass by the main model can process multiple tokens simultaneously. The typical speedup is 1.5 to 3 times depending on the draft model size, the acceptance rate of drafted tokens, and the number of draft tokens per step. Multi-Token Prediction or MTP takes this further by building the speculative heads directly into the main model, eliminating the need for a separate draft model. DeepSeek V3 and R1 series support MTP natively, achieving approximately 1.8 times throughput improvement with only a tiny VRAM overhead for the additional prediction heads.",
];

function pickSampleOutput(seed: number): string {
  const count = 5;
  const idx = seed % SAMPLE_OUTPUTS.length;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    parts.push(SAMPLE_OUTPUTS[(idx + i) % SAMPLE_OUTPUTS.length]);
  }
  return parts.join(" ");
}

export function InferenceSimulator({
  ttftMs,
  tokensPerSecond,
  concurrentUsers,
  modelName,
  promptTokens,
  className,
}: InferenceSimulatorProps) {
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [prefillProgress, setPrefillProgress] = useState(0); // 0-100
  const [displayedText, setDisplayedText] = useState("");
  const [generatedTokens, setGeneratedTokens] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [ttftActual, setTtftActual] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const prefillRafRef = useRef<number | null>(null);
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sampleText = useRef(pickSampleOutput(Math.floor(Math.random() * SAMPLE_OUTPUTS.length)));

  const cleanup = useCallback(() => {
    if (prefillRafRef.current) cancelAnimationFrame(prefillRafRef.current);
    if (genIntervalRef.current) clearInterval(genIntervalRef.current);
    prefillRafRef.current = null;
    genIntervalRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setPhase("idle");
    setPrefillProgress(0);
    setDisplayedText("");
    setGeneratedTokens(0);
    setElapsedMs(0);
    setTtftActual(null);
    sampleText.current = pickSampleOutput(Math.floor(Math.random() * SAMPLE_OUTPUTS.length));
  }, [cleanup]);

  // Cap simulation TTFT: we animate prefill at real-time for small values,
  // but cap to 4s max for very slow GPUs.
  const simTtftMs = Math.min(ttftMs, 4000);
  // Cap tok/s display at reasonable animation speed (max 250 chars/s visual)
  const simTps = Math.min(tokensPerSecond, 250);

  const start = useCallback(() => {
    reset();
    // small delay to let state flush
    setTimeout(() => {
      setPhase("prefill");
      startTimeRef.current = performance.now();

      // Animate prefill progress
      const animatePrefill = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const progress = Math.min((elapsed / simTtftMs) * 100, 100);
        setPrefillProgress(progress);
        setElapsedMs(elapsed);

        if (progress < 100) {
          prefillRafRef.current = requestAnimationFrame(animatePrefill);
        } else {
          // Prefill done
          const ttftTime = performance.now() - startTimeRef.current;
          setTtftActual(ttftTime);
          setPhase("generating");

          // Start token generation - split text into words for natural display
          const words = sampleText.current.split(/\s+/).filter(w => w.length > 0);
          let wordIdx = 0;
          const msPerToken = 1000 / simTps;

          genIntervalRef.current = setInterval(() => {
            if (wordIdx >= words.length) {
              cleanup();
              setPhase("done");
              return;
            }
            const word = words[wordIdx];
            // Display the word (add space before if not first word)
            setDisplayedText((prev) => prev ? prev + " " + word : word);
            // Estimate tokens: ~1.3 tokens per word on average (BPE tokenization)
            const tokensForWord = Math.max(1, Math.ceil(word.length / 4));
            setGeneratedTokens((n) => n + tokensForWord);
            setElapsedMs(performance.now() - startTimeRef.current);
            wordIdx++;
          }, msPerToken);
        }
      };

      prefillRafRef.current = requestAnimationFrame(animatePrefill);
    }, 50);
  }, [reset, simTtftMs, simTps, cleanup]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  const totalElapsedS = elapsedMs / 1000;
  const liveGenRate =
    generatedTokens > 0 && ttftActual !== null
      ? generatedTokens / ((elapsedMs - ttftActual) / 1000)
      : null;

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              phase === "idle" ? "bg-muted-foreground" :
              phase === "prefill" ? "bg-amber-400 animate-pulse" :
              phase === "generating" ? "bg-emerald-400 animate-pulse" :
              "bg-emerald-400"
            )}
          />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Inference Simulation
          </p>
          <span className="text-[10px] text-muted-foreground/60 font-normal hidden sm:block">
            — {modelName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {phase !== "idle" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={reset}
              title="Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
          {(phase === "idle" || phase === "done") ? (
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={start}
            >
              <Play className="w-3 h-3" />
              {phase === "done" ? "Replay" : "Play"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={reset}
            >
              <Square className="w-3 h-3" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Sim stats bar */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {[
          {
            label: "TTFT (est.)",
            value: ttftMs < 1000 ? `${ttftMs.toFixed(0)} ms` : `${(ttftMs / 1000).toFixed(2)} s`,
            icon: Clock,
            active: phase === "prefill",
          },
          {
            label: "Tok/s (est.)",
            value: `${tokensPerSecond.toFixed(1)}`,
            icon: Zap,
            active: phase === "generating",
          },
          {
            label: "Elapsed",
            value: totalElapsedS > 0 ? `${totalElapsedS.toFixed(2)} s` : "—",
            icon: null,
            active: phase !== "idle" && phase !== "done",
          },
          {
            label: concurrentUsers > 1 ? `${concurrentUsers} users` : "Generated",
            value: generatedTokens > 0 ? `${generatedTokens} tok` : "—",
            icon: null,
            active: phase === "generating",
          },
        ].map(({ label, value, icon: Icon, active }) => (
          <div
            key={label}
            className={cn(
              "px-3 py-2 flex flex-col gap-0.5 transition-colors",
              active ? "bg-primary/5" : ""
            )}
          >
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </span>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                active ? "text-primary" : "text-foreground"
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Main simulation area */}
      <div className="p-4 min-h-[140px] flex flex-col gap-3">
        {phase === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
            <Play className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Press Play to simulate inference
            </p>
            <p className="text-xs text-muted-foreground/60">
              Prefill: {simTtftMs < 1000 ? `${simTtftMs.toFixed(0)} ms` : `${(simTtftMs / 1000).toFixed(2)} s`} animation
              {" · "}
              Decode: ~{simTps.toFixed(0)} tok/s
              {simTtftMs < ttftMs ? " (capped for display)" : ""}
            </p>
          </div>
        )}

        {(phase === "prefill" || (phase !== "idle" && displayedText === "" && phase !== "done")) && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Prefilling {promptTokens.toLocaleString()} prompt tokens...
              </span>
              <span className="font-mono text-muted-foreground">
                {prefillProgress.toFixed(1)}%
              </span>
            </div>
            {/* Prefill progress bar */}
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-none"
                style={{ width: `${prefillProgress}%` }}
              />
            </div>
            {/* Token blocks animation */}
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(Math.floor(prefillProgress / 100 * promptTokens), 60) }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-sm bg-amber-500/30 transition-all"
                  style={{ width: `${4 + Math.random() * 12}px` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Compute-bound prefill pass — processing all prompt tokens in parallel
              {ttftMs > 1000 && " (simulated at 4s max; real TTFT shown above)"}
            </p>
          </div>
        )}

        {(phase === "generating" || phase === "done") && (
          <div className="flex flex-col gap-3">
            {ttftActual !== null && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
                  TTFT: {ttftActual < 1000 ? `${ttftActual.toFixed(0)} ms` : `${(ttftActual / 1000).toFixed(2)} s`} simulated
                </span>
                {liveGenRate !== null && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                    {liveGenRate.toFixed(1)} tok/s live
                  </span>
                )}
              </div>
            )}
            <div
              className={cn(
                "rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground leading-relaxed font-mono min-h-[80px]",
                phase === "generating" && "border-emerald-500/20 bg-emerald-500/5"
              )}
            >
              {displayedText}
              {phase === "generating" && (
                <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
              )}
              {phase === "done" && !displayedText && (
                <span className="text-muted-foreground italic">Output complete.</span>
              )}
            </div>
            {phase === "done" && (
              <p className="text-[10px] text-muted-foreground">
                Simulation complete — {generatedTokens} tokens generated in{" "}
                {((elapsedMs - (ttftActual ?? 0)) / 1000).toFixed(2)} s decode time
                {concurrentUsers > 1 && ` (${concurrentUsers} concurrent users share bandwidth)`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
