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
  "The memory requirements for large language models scale with both the number of parameters and the precision used during inference. For a 7B parameter model in BF16, you need approximately 14 GB of VRAM just for the weights, before accounting for KV cache, activations, and framework overhead.",
  "Mixture-of-Experts architectures offer a compelling trade-off: by activating only a subset of experts per token, MoE models can achieve the quality of much larger dense models while keeping compute and memory bandwidth costs proportional to the active parameter count.",
  "When deploying LLMs in production, the token generation rate is fundamentally memory-bandwidth bound. Each decode step requires streaming the full model weights from HBM to compute units — regardless of how powerful your GPU's tensor cores are.",
  "Context window size has a quadratic relationship with attention compute but only a linear relationship with KV cache memory. A 128K context window requires 32× more KV cache memory than a 4K window, making quantized KV cache essential for long-context deployments.",
  "With tensor parallelism across 8 GPUs, inference throughput scales near-linearly for memory-bandwidth-bound workloads, while TTFT benefits from the combined TFLOPS — though inter-GPU communication overhead becomes the bottleneck at higher GPU counts.",
];

function pickSampleOutput(seed: number): string {
  return SAMPLE_OUTPUTS[seed % SAMPLE_OUTPUTS.length];
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
  // Cap tok/s display at reasonable animation speed (max 40 chars/s visual)
  const simTps = Math.min(tokensPerSecond, 120);

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

          // Start token generation
          const words = sampleText.current.split(" ");
          let wordIdx = 0;
          const msPerToken = 1000 / simTps;

          genIntervalRef.current = setInterval(() => {
            if (wordIdx >= words.length) {
              cleanup();
              setPhase("done");
              return;
            }
            setDisplayedText((prev) =>
              prev ? prev + " " + words[wordIdx] : words[wordIdx]
            );
            setGeneratedTokens((n) => n + 1);
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
