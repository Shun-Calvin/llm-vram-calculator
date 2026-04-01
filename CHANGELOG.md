# Changelog

All notable changes to the LLM VRAM Calculator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Export configuration as PDF report
- Custom model builder (user-defined parameters)
- REST API for programmatic access
- Cost calculator for cloud GPU deployments
- PWA support for offline usage
- Benchmarks database integration (real-world vLLM/llama.cpp measurements)

### Added
- Comprehensive README.md with usage examples and formula documentation
- Unit test suite for core calculation functions (Vitest)
- URL-based configuration sharing via Base64URL encoding
- Share dialog with configuration summary and copy-to-clipboard
- Auto-load configuration from URL query parameters on page load
- MIT License file
- `.env.example` for deployment configuration

### Changed
- Improved MoE calculation documentation with explicit formulas
- Enhanced configuration panel organization

## [4.0.0] - 2026-04-02

### Added
- **Qwen3.5 Series Support**
  - Dense models: 0.8B, 2B, 4B, 9B, 27B
  - MoE models: 35B-A3B, 122B-A10B, 397B-A17B
  - All dimensions verified from official config.json files
  - Hybrid attention architecture (linear + full attention)
  - 248,320 vocab size, 262K native context

- **GLM Series Support**
  - GLM-4 9B/32B with GQA
  - GLM-4-Plus 9B
  - GLM-Z1 reasoning models (9B, 32B, 32B MoE)
  - LongWriter support for 2M context

- **Qwen2.5-Coder Series**
  - 0.5B, 1.5B, 3B, 7B, 14B, 32B variants
  - Code-specialized architecture
  - FIM (Fill-In-the-Middle) support
  - 128K context via YaRN

- **Latest GPUs**
  - RTX 5070 Ti, 5080, 5090 (2025)
  - RTX Pro 6000 Blackwell (96GB GDDR7)
  - RTX Pro 6000D Blackwell Server (84GB HBM3)
  - AMD RX 9060 XT, 9070, 9070 XT
  - MI350X (2025)

- **Inference Simulator**
  - Visual token generation simulation
  - Real-time TTFT and throughput display
  - Concurrent user load visualization

### Changed
- **Corrected MoE Formulas**
  - Weights VRAM: Now correctly uses TOTAL params (all experts loaded)
  - TTFT: Uses ACTIVE params (only active experts compute)
  - Decode throughput: Uses ACTIVE params (memory bandwidth for active experts only)
  - Added explicit MoE callout boxes in results panel

- **Expanded Concurrent User Support**
  - Increased max from 256 to 4,096 users
  - Added high-concurrency warning badges
  - Per-user KV cache calculation display

- **Enhanced Formula Reference Section**
  - Step-by-step calculation breakdowns
  - Model-specific examples with actual numbers
  - MoE-specific explanations for each formula

### Technical Improvements
- Separated GPU and model data into independent files (`gpu-data.ts`, `model-data.ts`)
- Type-to-search comboboxes for all dropdowns (improved UX for 70+ GPUs, 100+ models)
- Fixed hydration warnings with proper client-side rendering
- Responsive design improvements for mobile/tablet

## [3.2.0] - 2025-12-15

### Added
- **DeepSeek-R1 Series**
  - DeepSeek-R1 671B (MoE, 37B active)
  - R1 Distill variants: 1.5B, 7B, 14B, 32B, 70B
  - MLA (Multi-Head Latent Attention) architecture support

- **Llama 4 Series**
  - Llama 4 Scout (109B MoE, 17B active, 16 experts)
  - Llama 4 Maverick (400B MoE, 52B active, 128 experts)
  - 10M context length support for Scout

### Changed
- Updated model data structure to better support MoE architectures
- Improved active parameter fraction display for MoE models

## [3.1.0] - 2025-11-20

### Added
- **Apple Silicon M4 Series**
  - M4 Max (128 GB unified memory)
  - M4 Ultra (192 GB unified memory)
  - Updated memory bandwidth figures

- **Google TPU v6e (Trillium)**
  - 32 GB HBM per chip
  - 918 TFLOPS FP16
  - 1638 GB/s memory bandwidth

### Changed
- Refined multi-GPU efficiency calculations
- Added NVLink bandwidth tier detection for better accuracy

## [3.0.0] - 2025-10-08

### Added
- **GPU Comparison Tab**
  - Side-by-side comparison of up to 3 GPUs
  - VRAM, TTFT, throughput comparison charts
  - Cost-effectiveness metrics (planned)

- **Sensitivity Analysis**
  - "What-if" scenarios for context length, users, quantization
  - Impact badges showing VRAM and throughput changes

- **Enhanced Results Panel**
  - Stacked VRAM breakdown bar (weights/KV/activations)
  - Color-coded fit status (comfortable/tight/overflow)
  - Minimum GPU count recommendation

### Changed
- Major UI/UX overhaul with tabs-based navigation
- Improved performance with useMemo for all calculations
- Better mobile responsiveness

## [2.5.0] - 2025-08-22

### Added
- **Qwen3 Series**
  - 0.6B, 1.7B, 4B, 8B, 14B, 32B dense models
  - 30B-A3B and 235B-A22B MoE variants
  - QwQ 32B reasoning model

- **Gemma 3 Series**
  - 1B, 4B, 12B, 27B models
  - Gemma 3n efficient variants (E2B, E4B)

### Changed
- Updated quantization options to include IQ4_XS and NF4
- Improved KV cache calculation accuracy for GQA models

## [2.0.0] - 2025-06-10

### Added
- **Mixture-of-Experts (MoE) Support**
  - Correct VRAM calculations for MoE architectures
  - Support for DeepSeek-V2/V3, Mixtral 8x7B/8x22B
  - Active vs total parameter distinction
  - Expert count and routing overhead display

- **Performance Metrics**
  - Time-to-First-Token (TTFT) estimation
  - Tokens/second throughput calculation
  - Effective memory bandwidth with multi-GPU scaling

- **Advanced Configuration**
  - KV cache precision selection (FP32/FP16/FP8/INT8/INT4)
  - Prompt length adjustment for TTFT
  - Concurrent users (batch size) configuration

### Changed
- Complete rewrite of calculation engine with physics-based formulas
- Separated weights/KV cache/activations in VRAM breakdown
- Added formula reference section with detailed explanations

## [1.5.0] - 2025-03-18

### Added
- **Llama 3.2 Series**
  - 1B and 3B models
  - Tie embedding support
  - 131K context length

- **Phi-4 Series**
  - Phi-4 14B
  - Phi-4 Mini 3.8B
  - Phi-4 MoE 16×3.8B

### Changed
- Improved quantization accuracy with overhead factors
- Better handling of GQA (Grouped Query Attention) models

## [1.0.0] - 2025-01-15

### Added
- Initial release
- Support for 50+ GPUs (NVIDIA, AMD, Intel, Apple)
- Support for 80+ LLM models
- Basic VRAM calculation (weights only)
- Simple dropdown selectors
- Clean, minimal UI

### Models Supported
- Llama 3.1 (8B, 70B, 405B)
- Mistral/Mixtral series
- Qwen2.5 series
- Gemma 2 series
- Phi-3 series
- DeepSeek-V2
- Falcon, Yi, Cohere Command

---

## Version History Summary

| Version | Release Date | Key Features |
|---------|-------------|--------------|
| 4.0.0   | 2026-04-02  | Qwen3.5, GLM, Qwen2.5-Coder, URL sharing, tests |
| 3.2.0   | 2025-12-15  | DeepSeek-R1, Llama 4, inference simulator |
| 3.1.0   | 2025-11-20  | M4 Ultra, TPU v6e |
| 3.0.0   | 2025-10-08  | GPU comparison, sensitivity analysis |
| 2.5.0   | 2025-08-22  | Qwen3, Gemma 3 |
| 2.0.0   | 2025-06-10  | **MoE support**, performance metrics |
| 1.5.0   | 2025-03-18  | Llama 3.2, Phi-4 |
| 1.0.0   | 2025-01-15  | Initial release |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Reference

- **Adding GPUs:** Edit `lib/gpu-data.ts`
- **Adding Models:** Edit `lib/model-data.ts`
- **Core Calculations:** Edit `lib/llm-data.ts`
- **UI Components:** Edit `components/` directory
- **Tests:** Add to `lib/__tests__/`

## License

MIT License - see [LICENSE](LICENSE) file for details.
