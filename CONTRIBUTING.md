# Contributing to LLM VRAM Calculator

Thank you for your interest in contributing! This guide will help you add new GPUs, models, or features to the calculator.

## Quick Start

```bash
# Fork and clone
git clone https://github.com/your-username/llm-vram-calculator.git
cd llm-vram-calculator

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Adding New GPUs

### Step 1: Gather Specifications

Collect accurate specs from:
- **Manufacturer datasheets** (NVIDIA, AMD, Intel)
- **TechPowerUp GPU Database** (https://www.techpowerup.com/gpu-specs/)
- **AnandTech reviews** for detailed benchmarks

Required specs:
- VRAM capacity (GB)
- Memory bandwidth (GB/s)
- FP16/BF16 TFLOPS
- Inter-GPU bandwidth (NVLink/Infinity Fabric/PCIe)

### Step 2: Edit `lib/gpu-data.ts`

Add your GPU to the appropriate category:

```typescript
{
  id: "rtx5060ti",           // Unique lowercase ID
  name: "RTX 5060 Ti",       // Display name
  provider: "NVIDIA",        // Manufacturer
  vramGb: 16,                // VRAM in GB
  memoryBandwidthGBs: 448,   // Memory bandwidth GB/s
  tflops16: 55.0,            // FP16/BF16 TFLOPS
  nvlinkBandwidthGBs: 16,    // NVLink/PCIe bandwidth GB/s
  tier: "consumer",          // consumer | prosumer | datacenter
  releaseYear: 2025,
  notes: "Optional notes",
}
```

### Step 3: Verify and Test

1. Check that the GPU appears in the dropdown
2. Test calculations with a known model (e.g., Llama 3.1 8B)
3. Compare with similar GPUs for sanity

### Step 4: Commit

```bash
git add lib/gpu-data.ts
git commit -m "feat: add RTX 5060 Ti 16GB"
git push origin feature/add-rtx5060ti
```

## Adding New Models

### Step 1: Gather Specifications

Find official model specs from:
- **HuggingFace model card** (config.json)
- **Official technical reports** (arXiv)
- **Ollama library** (https://ollama.com/library)

Required specs:
- Parameter count (billions)
- For MoE: total params, active params, num experts, active experts
- Layers, hidden dimension, attention heads, KV heads
- Intermediate size (FFN)
- Max context length
- Vocabulary size

### Step 2: Edit `lib/model-data.ts`

Add your model to the appropriate family section:

```typescript
// Dense model example
{
  id: "qwen35_9b",
  name: "Qwen3.5 9B",
  params: 9.0,                    // Total billions of parameters
  layers: 32,
  hiddenDim: 4096,
  numHeads: 16,
  numKvHeads: 4,                  // GQA: KV heads
  intermediateSize: 12288,        // FFN intermediate
  maxContextTokens: 262144,
  source: "both",                 // huggingface | ollama | both
  family: "Qwen",
  vocabSize: 248320,
  tiedEmbeddings: false,
  releaseYear: 2026,
  notes: "Dense; hybrid linear+full attention",
}

// MoE model example
{
  id: "qwen35_35b_a3b",
  name: "Qwen3.5 35B-A3B (MoE)",
  params: 35.0,                    // TOTAL params (all experts)
  activeParams: 3.0,               // Active params per token
  layers: 40,
  hiddenDim: 2048,
  numHeads: 16,
  numKvHeads: 2,
  intermediateSize: 512,           // Per expert intermediate
  maxContextTokens: 262144,
  numExperts: 256,                 // Total experts
  numExpertsActive: 8,             // Active experts per token
  source: "both",
  family: "Qwen",
  vocabSize: 248320,
  tiedEmbeddings: false,
  releaseYear: 2026,
  notes: "256 experts, 8 routed active + 1 shared",
}
```

### Step 3: Verify MoE Calculations (if applicable)

For MoE models, ensure:
- `params` = total parameters (ALL experts loaded to VRAM)
- `activeParams` = active parameters per token (for TTFT and throughput)
- `numExperts` and `numExpertsActive` are correct
- Notes explain the architecture (e.g., "8 of 256 experts active")

### Step 4: Test

1. Select your model in the calculator
2. Verify VRAM calculation with a known quantization
3. Check MoE badge displays correctly (if applicable)
4. Verify formula reference shows correct numbers

### Step 5: Commit

```bash
git add lib/model-data.ts
git commit -m "feat: add Qwen3.5 9B and 35B-A3B MoE"
git push origin feature/add-qwen35
```

## Adding New Quantization Methods

### Step 1: Understand the Parameters

```typescript
{
  id: "q4_k_m",
  label: "Q4_K_M (GGUF)",
  bitsPerWeight: 4.5,           // Effective bits per weight
  overheadFactor: 1.08,         // Memory overhead (8%)
  speedupFactor: 2.5,           // Speed vs FP32 baseline
  qualityNote: "Popular choice; slight quality loss",
}
```

### Step 2: Edit `lib/llm-data.ts`

Add to `QUANT_OPTIONS` array with accurate benchmarks.

## Adding Features

### General Guidelines

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Keep changes focused**: One feature per PR
3. **Write tests**: Add to `lib/__tests__/` for core logic
4. **Update docs**: Update README.md if adding user-facing features
5. **Test thoroughly**: Run `pnpm dev` and test manually

### Example: Adding URL Config Sharing

1. Created `lib/url-config.ts` with encode/decode functions
2. Added `ShareConfigButton` component
3. Integrated into main page with `useSearchParams` hook
4. Added tests for encoding/decoding edge cases

## Code Style

- **TypeScript**: Strict mode, explicit types
- **Formatting**: Prettier (auto-formatted on save)
- **Components**: Functional components with hooks
- **Naming**: CamelCase for variables, PascalCase for components/types
- **Comments**: JSDoc for public functions, inline for complex logic

## Testing

### Unit Tests

```bash
# Run tests (requires vitest setup)
pnpm test
```

Test files are in `lib/__tests__/`. Add tests for:
- New calculation functions
- Edge cases (very large models, high concurrency)
- URL encoding/decoding
- Validation logic

### Manual Testing Checklist

- [ ] GPU selector works and filters correctly
- [ ] Model selector works with search
- [ ] MoE models display correct info
- [ ] VRAM calculation matches expected values
- [ ] TTFT and throughput seem reasonable
- [ ] Multi-GPU scaling works
- [ ] High concurrency scenarios don't break
- [ ] URL sharing generates valid links
- [ ] Mobile responsive (test on phone/tablet)

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** from `main`
3. **Make your changes** following the guidelines above
4. **Test thoroughly** (unit tests + manual)
5. **Commit** with clear messages:
   - `feat: add RTX 5060 Ti`
   - `fix: correct MoE active params calculation`
   - `docs: update README with API section`
6. **Push** to your fork
7. **Open a PR** against `Shun-Calvin/llm-vram-calculator:main`
8. **Describe your changes** in the PR description
9. **Respond to feedback** and make requested changes

## Documentation

### Updating README.md

Update README.md when:
- Adding major features
- Changing calculation formulas
- Adding deployment options
- Changing tech stack

### Updating CHANGELOG.md

Add entries to `CHANGELOG.md` under `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- Your new feature here

### Changed
- Any breaking changes

### Fixed
- Bug fixes
```

## Questions?

- **General questions:** Open a [Discussion](https://github.com/Shun-Calvin/llm-vram-calculator/discussions)
- **Bug reports:** Open an [Issue](https://github.com/Shun-Calvin/llm-vram-calculator/issues)
- **Feature requests:** Open an [Issue](https://github.com/Shun-Calvin/llm-vram-calculator/issues) with "Feature Request" label

## Thank You!

Every contribution helps make the LLM VRAM Calculator more accurate and useful for the community. Whether it's adding a single GPU model or implementing a major feature, your work is appreciated! 🙏

---

**License:** By contributing, you agree that your contributions will be licensed under the MIT License.
