# LLM VRAM Calculator

A comprehensive GPU memory and performance estimator for Large Language Models. Calculate VRAM requirements, Time-to-First-Token (TTFT), and tokens/second throughput for 100+ LLMs across 70+ GPUs.

![LLM VRAM Calculator](./public/og-image.png)

**Live Demo:** [https://llm-vram-calculator.vercel.app](https://llm-vram-calculator.vercel.app)

## Features

- **100+ LLM Models** - Support for Llama 3.x, Qwen3.5, DeepSeek, Mixtral MoE, Gemma, Phi, and more
- **70+ GPUs** - NVIDIA (RTX 30/40/50 series, H100, B200), AMD (RX 7000/9000, MI300), Intel, Apple Silicon, Google TPU
- **Accurate MoE Calculations** - Correct formulas for Mixture-of-Experts models (DeepSeek-V3, Qwen3.5 MoE, Mixtral)
- **Performance Metrics** - VRAM breakdown, TTFT, tokens/second, concurrent user support
- **GPU Comparison** - Side-by-side performance comparison
- **Inference Simulation** - Visual simulation of token generation
- **Formula Reference** - Detailed explanations of all calculations

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build
pnpm build

# Start production server
pnpm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Shun-Calvin/llm-vram-calculator)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Usage

### Calculator Tab

1. **Select GPU** - Choose from consumer, prosumer, datacenter, or Apple Silicon GPUs
2. **Select Model** - Browse models by family (Llama, Qwen, DeepSeek, etc.) or source (HuggingFace, Ollama)
3. **Configure Quantization** - From FP32 down to INT2/AWQ/GPTQ
4. **Set Context Length** - 512 to 128K tokens
5. **Set Concurrency** - 1 to 1024 concurrent users
6. **View Results** - VRAM breakdown, TTFT, tokens/second, and detailed formulas

### Compare Tab

Compare up to 3 GPUs side-by-side for the same model configuration to make informed hardware decisions.

## Calculation Formulas

### Model Weights VRAM

```
weights_GB = total_params × 10⁹ × (bits_per_weight / 8) × overhead / 1024³
```

**For MoE models:** ALL expert weights are loaded into VRAM, even though only a fraction are active per token.

### KV Cache VRAM

```
kv_GB = 2 × kv_heads × head_dim × seq_len × layers × users × bytes_per_kv / 1024³
where head_dim = hidden_dim / num_heads
```

**For MoE models:** KV cache depends on attention layers only, NOT on expert count.

### Time to First Token (TTFT)

```
ttft = 2 × active_params × prompt_tokens / (tflops × 10¹² × gpus × efficiency)
```

**For MoE models:** Uses ACTIVE params (not total), as only active experts compute during prefill.

### Tokens Per Second

```
tps = eff_bandwidth / (active_params × bytes_per_weight / gpus) / users
```

**For MoE models:** Only active expert weights are streamed from HBM per decode step.

## Supported Models

### Dense Models
- **Meta:** Llama 3.1/3.2/3.3 (8B, 70B, 405B)
- **Alibaba:** Qwen2.5, Qwen3, Qwen3.5 (0.5B-27B)
- **DeepSeek:** R1 Distill (1.5B-70B)
- **Google:** Gemma 1/2/3 (2B-27B)
- **Microsoft:** Phi-3/Phi-4 (3.8B-14B)
- **Mistral:** Mistral 7B, Nemo, Large 2
- **Cohere:** Command R/R+
- **IBM:** Granite 3.3 (2B, 8B)

### MoE Models
- **DeepSeek:** V2 (236B A21B), V3 (685B A37B), R1 (671B A37B)
- **Qwen3.5:** 35B-A3B, 122B-A10B, 397B-A17B
- **Mixtral:** 8×7B, 8×22B
- **Llama 4:** Scout (109B A17B), Maverick (400B A52B)
- **Phi-4:** MoE 16×3.8B

## Supported GPUs

### Consumer
- **NVIDIA:** RTX 3060-3090 Ti, RTX 4060-4090, RTX 5070-5090
- **AMD:** RX 6800-6900 XT, RX 7800-7900 XT/XTX, RX 9060-9070 XT
- **Intel:** Arc A770, B580, B770
- **Apple:** M2/M3/M4 Max/Ultra

### Datacenter
- **NVIDIA:** A10/A100, H100/H200, B100/B200/GB200, L4/L20/L40S, H20 (China)
- **AMD:** MI100/MI210/MI250/X, MI300A/X, MI325X/MI350X
- **Intel:** Gaudi 2/3
- **Google:** TPU v4/v5e/v5p/v6e
- **Qualcomm:** Cloud AI 100 Ultra

## Project Structure

```
llm-vram-calculator/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── config-panel.tsx     # Configuration sidebar
│   ├── results-panel.tsx    # Results display
│   ├── compare-panel.tsx    # GPU comparison
│   └── inference-simulator.tsx
├── lib/                     # Core logic
│   ├── llm-data.ts          # Calculator functions
│   ├── gpu-data.ts          # GPU specifications
│   ├── model-data.ts        # Model specifications
│   └── utils.ts             # Utilities
├── hooks/                   # Custom hooks
├── public/                  # Static assets
└── styles/                  # Additional styles
```

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5.7.3
- **UI:** React 19.2.4 + shadcn/ui
- **Styling:** Tailwind CSS 4.2.0
- **Components:** Radix UI primitives
- **Analytics:** Vercel Analytics

## Configuration Examples

### High-Concurrency Deployment

**Scenario:** Deploy Qwen2.5 7B (Q4_K_M) for 100 concurrent users

- **GPU:** 2× RTX 4090 (48GB total)
- **VRAM Required:** 5.2 GB weights + 12.8 GB KV cache + 3.1 GB activations = 21.1 GB
- **Result:** Fits comfortably with 56% VRAM utilization
- **Throughput:** ~45 tok/s per user

### MoE Model Deployment

**Scenario:** Deploy DeepSeek-V3 (685B A37B, Q4_K_M) for single user

- **GPU:** 8× H100 SXM5 (640GB total)
- **VRAM Required:** 386 GB weights + 2.1 GB KV cache + 0.8 GB activations = 388.9 GB
- **TTFT:** ~850 ms (512 tokens prompt)
- **Throughput:** ~22 tok/s

Note: MoE models require VRAM for ALL parameters but compute only with active experts, making them VRAM-hungry but fast.

## API (Future)

A REST API is planned for programmatic access:

```bash
GET /api/calculate?model=llama3_8b&gpu=rtx4090&quant=q4_k_m&ctx=4096&users=1

Response:
{
  "vramGb": 6.42,
  "ttftMs": 45.3,
  "tokensPerSecond": 127.5,
  "breakdown": {
    "weights": 4.51,
    "kvCache": 1.23,
    "activations": 0.68
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding New GPUs

1. Edit [`lib/gpu-data.ts`](./lib/gpu-data.ts)
2. Add GPU spec to `GPU_LIST` array
3. Include verified specs (VRAM, bandwidth, TFLOPS)

### Adding New Models

1. Edit [`lib/model-data.ts`](./lib/model-data.ts)
2. Add model spec to `MODEL_LIST` array
3. For MoE models, include `numExperts` and `numExpertsActive`
4. Source dimensions from official config.json or technical reports

### Development Workflow

```bash
# Fork and clone
git clone https://github.com/your-username/llm-vram-calculator.git
cd llm-vram-calculator

# Create branch
git checkout -b feature/add-new-gpu

# Make changes, then test
pnpm dev

# Commit and push
git commit -m "feat: add RTX 5060 Ti"
git push origin feature/add-new-gpu
```

## Limitations

- Estimates are physics-based approximations
- Real-world performance varies by framework (vLLM, llama.cpp, TensorRT-LLM)
- Does not account for CPU offloading or model sharding across nodes
- Vision-language models: vision encoder VRAM not included (typically +200-500 MB)
- Multi-node distributed inference not covered

## Acknowledgments

- Model architectures verified from official HuggingFace config.json files
- GPU specs from manufacturer datasheets and TechPowerUp GPU Database
- MoE formulas validated against DeepSeek and Mixtral technical reports
- Inspired by community tools: llama.cpp, vLLM, Ollama

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contact

- **Issues:** [GitHub Issues](https://github.com/Shun-Calvin/llm-vram-calculator/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Shun-Calvin/llm-vram-calculator/discussions)

---

Built with ❤️ for the LLM community.
