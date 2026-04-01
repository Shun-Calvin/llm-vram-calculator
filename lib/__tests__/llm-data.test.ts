/**
 * Unit tests for LLM VRAM Calculator core functions
 * 
 * Run with: pnpm test (requires vitest or jest)
 */

import { describe, it, expect } from 'vitest';
import {
  bytesPerParam,
  getActiveParams,
  calcWeightsVram,
  calcKvCacheVram,
  calcActivationVram,
  calcTotalVram,
  effectiveBandwidthGBs,
  calcTTFT,
  calcTokensPerSecond,
  gpusRequired,
  QUANT_OPTIONS,
  KV_CACHE_OPTIONS,
  MODEL_LIST,
  GPU_LIST,
} from '../lib/llm-data';

// Test data helpers
const getQuant = (id: string) => QUANT_OPTIONS.find(q => q.id === id)!;
const getKvCache = (id: string) => KV_CACHE_OPTIONS.find(k => k.id === id)!;
const getModel = (id: string) => MODEL_LIST.find(m => m.id === id)!;
const getGpu = (id: string) => GPU_LIST.find(g => g.id === id)!;

describe('LLM VRAM Calculator', () => {
  
  describe('bytesPerParam', () => {
    it('should calculate bytes per parameter for FP32', () => {
      expect(bytesPerParam(getQuant('fp32'))).toBe(4);
    });
    
    it('should calculate bytes per parameter for BF16/FP16', () => {
      expect(bytesPerParam(getQuant('bf16'))).toBe(2);
      expect(bytesPerParam(getQuant('fp16'))).toBe(2);
    });
    
    it('should calculate bytes per parameter for INT8 quantizations', () => {
      expect(bytesPerParam(getQuant('q8_0'))).toBe(1);
      expect(bytesPerParam(getQuant('int8'))).toBe(1);
    });
    
    it('should calculate bytes per parameter for 4-bit quantizations', () => {
      expect(bytesPerParam(getQuant('q4_k_m'))).toBe(4.5 / 8);
      expect(bytesPerParam(getQuant('awq'))).toBe(0.5);
    });
  });

  describe('getActiveParams', () => {
    it('should return total params for dense models', () => {
      const llama3_8b = getModel('llama3_8b');
      expect(getActiveParams(llama3_8b)).toBe(8.03);
    });
    
    it('should return active params for MoE models', () => {
      const mixtral_8x7b = getModel('mixtral_8x7b');
      expect(getActiveParams(mixtral_8x7b)).toBe(12.9);
    });
    
    it('should handle DeepSeek-V3 MoE', () => {
      const deepseek_v3 = getModel('deepseek_v3');
      expect(getActiveParams(deepseek_v3)).toBe(37);
      expect(deepseek_v3.params).toBe(685);
    });
  });

  describe('calcWeightsVram', () => {
    it('should calculate VRAM for Llama 3.1 8B at Q4_K_M', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('q4_k_m');
      const vram = calcWeightsVram(model, quant);
      
      // Expected: 8.03B × (4.5/8) bytes × 1.08 overhead / 1024³
      const expected = (8.03 * 1e9 * (4.5 / 8) * 1.08) / 1024 ** 3;
      expect(vram).toBeCloseTo(expected, 2);
      expect(vram).toBeGreaterThan(4); // ~4.5 GB
      expect(vram).toBeLessThan(6);
    });
    
    it('should calculate VRAM for MoE model with all experts loaded', () => {
      const mixtral = getModel('mixtral_8x7b');
      const quant = getQuant('q4_k_m');
      const vram = calcWeightsVram(mixtral, quant);
      
      // Should use TOTAL params (46.7B), not active (12.9B)
      expect(vram).toBeGreaterThan(20); // ~26 GB for 46.7B params at Q4
    });
    
    it('should scale correctly with quantization', () => {
      const model = getModel('llama3_8b');
      const fp16 = getQuant('fp16');
      const q4 = getQuant('q4_k_m');
      
      const vramFp16 = calcWeightsVram(model, fp16);
      const vramQ4 = calcWeightsVram(model, q4);
      
      // Q4 should use ~3.5× less VRAM than FP16
      const ratio = vramFp16 / vramQ4;
      expect(ratio).toBeGreaterThan(3);
      expect(ratio).toBeLessThan(5);
    });
  });

  describe('calcKvCacheVram', () => {
    it('should calculate KV cache for single user at 4K context', () => {
      const model = getModel('llama3_8b');
      const kvCache = getKvCache('fp16');
      const vram = calcKvCacheVram(model, 4096, kvCache, 1);
      
      // head_dim = 4096 / 32 = 128
      // kv_GB = 2 × 8 × 128 × 4096 × 32 × 1 × 2 / 1024³
      expect(vram).toBeGreaterThan(0.5);
      expect(vram).toBeLessThan(2);
    });
    
    it('should scale linearly with context length', () => {
      const model = getModel('llama3_8b');
      const kvCache = getKvCache('fp16');
      
      const vram4k = calcKvCacheVram(model, 4096, kvCache, 1);
      const vram8k = calcKvCacheVram(model, 8192, kvCache, 1);
      
      expect(vram8k).toBeCloseTo(vram4k * 2, 1);
    });
    
    it('should scale linearly with concurrent users', () => {
      const model = getModel('llama3_8b');
      const kvCache = getKvCache('fp16');
      
      const vram1 = calcKvCacheVram(model, 4096, kvCache, 1);
      const vram10 = calcKvCacheVram(model, 4096, kvCache, 10);
      
      expect(vram10).toBeCloseTo(vram1 * 10, 1);
    });
    
    it('should be independent of MoE expert count', () => {
      const mixtral = getModel('mixtral_8x7b');
      const llama = getModel('llama3_8b');
      const kvCache = getKvCache('fp16');
      
      // KV cache depends on attention layers only, not experts
      const vramMixtral = calcKvCacheVram(mixtral, 4096, kvCache, 1);
      const vramLlama = calcKvCacheVram(llama, 4096, kvCache, 1);
      
      // Should be similar since both have similar attention configs
      expect(vramMixtral / vramLlama).toBeGreaterThan(0.5);
      expect(vramMixtral / vramLlama).toBeLessThan(2);
    });
  });

  describe('calcActivationVram', () => {
    it('should calculate activation memory for single user', () => {
      const model = getModel('llama3_8b');
      const actVram = calcActivationVram(model, 4096, 1);
      
      expect(actVram).toBeGreaterThan(0.2);
      expect(actVram).toBeLessThan(2);
    });
    
    it('should scale with concurrent users', () => {
      const model = getModel('llama3_8b');
      
      const act1 = calcActivationVram(model, 4096, 1);
      const act10 = calcActivationVram(model, 4096, 10);
      
      expect(act10).toBeGreaterThan(act1 * 8);
      expect(act10).toBeLessThan(act1 * 12);
    });
  });

  describe('calcTotalVram', () => {
    it('should return complete VRAM breakdown', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('q4_k_m');
      const kvCache = getKvCache('fp16');
      const breakdown = calcTotalVram(model, quant, kvCache, 4096, 1);
      
      expect(breakdown.weightsGb).toBeGreaterThan(4);
      expect(breakdown.kvCacheGb).toBeGreaterThan(0);
      expect(breakdown.activationsGb).toBeGreaterThan(0);
      expect(breakdown.totalGb).toBeCloseTo(
        breakdown.weightsGb + breakdown.kvCacheGb + breakdown.activationsGb,
        2
      );
    });
    
    it('should identify MoE models', () => {
      const dense = calcTotalVram(getModel('llama3_8b'), getQuant('q4_k_m'), getKvCache('fp16'), 4096, 1);
      const moe = calcTotalVram(getModel('mixtral_8x7b'), getQuant('q4_k_m'), getKvCache('fp16'), 4096, 1);
      
      expect(dense.isMoE).toBe(false);
      expect(moe.isMoE).toBe(true);
    });
    
    it('should calculate active param fraction for MoE', () => {
      const moe = calcTotalVram(getModel('mixtral_8x7b'), getQuant('q4_k_m'), getKvCache('fp16'), 4096, 1);
      
      expect(moe.activeParamFraction).toBeDefined();
      expect(moe.activeParamFraction!).toBeCloseTo(12.9 / 46.7, 2);
    });
  });

  describe('effectiveBandwidthGBs', () => {
    it('should return single GPU bandwidth unchanged', () => {
      const gpu = getGpu('rtx4090');
      const eff = effectiveBandwidthGBs(gpu, 1);
      
      expect(eff).toBe(gpu.memoryBandwidthGBs);
    });
    
    it('should apply NVLink efficiency for multi-GPU', () => {
      const gpu = getGpu('h100_sxm');
      const eff = effectiveBandwidthGBs(gpu, 2);
      
      // H100 SXM has 900 GB/s NVLink, so 85% efficiency
      const expected = gpu.memoryBandwidthGBs * 2 * 0.85;
      expect(eff).toBeCloseTo(expected, 0);
    });
    
    it('should apply PCIe efficiency for low-bandwidth interconnect', () => {
      const gpu = getGpu('rtx4090');
      const eff = effectiveBandwidthGBs(gpu, 2);
      
      // RTX 4090 has 16 GB/s "NVLink" (actually PCIe), so 65% efficiency
      const expected = gpu.memoryBandwidthGBs * 2 * 0.65;
      expect(eff).toBeCloseTo(expected, 0);
    });
  });

  describe('calcTTFT', () => {
    it('should calculate TTFT for Llama 3.1 8B on RTX 4090', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('fp16');
      const gpu = getGpu('rtx4090');
      const ttft = calcTTFT(model, quant, gpu, 1, 512);
      
      expect(ttft).toBeGreaterThan(0);
      expect(ttft).toBeLessThan(100); // Should be very fast for 8B
    });
    
    it('should use active params for MoE TTFT', () => {
      const mixtral = getModel('mixtral_8x7b');
      const quant = getQuant('fp16');
      const gpu = getGpu('rtx4090');
      
      const ttft = calcTTFT(mixtral, quant, gpu, 1, 512);
      
      // Should be comparable to 13B model, not 47B
      expect(ttft).toBeLessThan(200);
    });
    
    it('should decrease with more GPUs', () => {
      const model = getModel('llama3_70b');
      const quant = getQuant('fp16');
      const gpu = getGpu('h100_sxm');
      
      const ttft1 = calcTTFT(model, quant, gpu, 1, 512);
      const ttft4 = calcTTFT(model, quant, gpu, 4, 512);
      
      expect(ttft4).toBeLessThan(ttft1);
      expect(ttft4).toBeLessThan(ttft1 / 2); // Should scale well
    });
    
    it('should scale linearly with prompt length', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('fp16');
      const gpu = getGpu('rtx4090');
      
      const ttft256 = calcTTFT(model, quant, gpu, 1, 256);
      const ttft512 = calcTTFT(model, quant, gpu, 1, 512);
      const ttft1024 = calcTTFT(model, quant, gpu, 1, 1024);
      
      expect(ttft512).toBeCloseTo(ttft256 * 2, 1);
      expect(ttft1024).toBeCloseTo(ttft512 * 2, 1);
    });
  });

  describe('calcTokensPerSecond', () => {
    it('should calculate throughput for Llama 3.1 8B on RTX 4090', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('q4_k_m');
      const gpu = getGpu('rtx4090');
      const tps = calcTokensPerSecond(model, quant, gpu, 1, 1);
      
      expect(tps).toBeGreaterThan(50);
      expect(tps).toBeLessThan(200);
    });
    
    it('should improve with lower quantization', () => {
      const model = getModel('llama3_8b');
      const gpu = getGpu('rtx4090');
      
      const tpsFp16 = calcTokensPerSecond(model, getQuant('fp16'), gpu, 1, 1);
      const tpsQ4 = calcTokensPerSecond(model, getQuant('q4_k_m'), gpu, 1, 1);
      
      expect(tpsQ4).toBeGreaterThan(tpsFp16 * 1.5);
    });
    
    it('should scale with multiple GPUs', () => {
      const model = getModel('llama3_70b');
      const quant = getQuant('fp16');
      const gpu = getGpu('h100_sxm');
      
      const tps1 = calcTokensPerSecond(model, quant, gpu, 1, 1);
      const tps4 = calcTokensPerSecond(model, quant, gpu, 4, 1);
      
      expect(tps4).toBeGreaterThan(tps1);
    });
    
    it('should decrease per-user with more concurrent users', () => {
      const model = getModel('llama3_8b');
      const quant = getQuant('q4_k_m');
      const gpu = getGpu('rtx4090');
      
      const tps1 = calcTokensPerSecond(model, quant, gpu, 1, 1);
      const tps10 = calcTokensPerSecond(model, quant, gpu, 1, 10);
      
      expect(tps10).toBeLessThan(tps1);
    });
  });

  describe('gpusRequired', () => {
    it('should return 1 GPU when VRAM fits', () => {
      const gpu = getGpu('rtx4090'); // 24 GB
      const required = gpusRequired(20, gpu);
      
      expect(required).toBe(1);
    });
    
    it('should return multiple GPUs when VRAM exceeds single GPU', () => {
      const gpu = getGpu('rtx4090'); // 24 GB
      const required = gpusRequired(50, gpu);
      
      expect(required).toBeGreaterThan(2);
    });
    
    it('should account for 92% usable VRAM', () => {
      const gpu = getGpu('rtx4090'); // 24 GB, ~22 GB usable
      const required = gpusRequired(22.1, gpu);
      
      expect(required).toBe(2);
    });
  });

  describe('Integration Tests', () => {
    it('should calculate realistic deployment for Qwen2.5 7B', () => {
      const model = getModel('qwen25_7b');
      const quant = getQuant('q4_k_m');
      const kvCache = getKvCache('fp16');
      const gpu = getGpu('rtx4090');
      
      const vram = calcTotalVram(model, quant, kvCache, 4096, 1);
      const ttft = calcTTFT(model, quant, gpu, 1, 512);
      const tps = calcTokensPerSecond(model, quant, gpu, 1, 1);
      
      // Sanity checks
      expect(vram.totalGb).toBeLessThan(24); // Should fit on single 4090
      expect(vram.weightsGb).toBeGreaterThan(4);
      expect(ttft).toBeLessThan(100); // Should be very fast
      expect(tps).toBeGreaterThan(50);
    });

    it('should handle massive MoE model (DeepSeek-V3)', () => {
      const model = getModel('deepseek_v3');
      const quant = getQuant('q4_k_m');
      const kvCache = getKvCache('fp16');
      
      const vram = calcTotalVram(model, quant, kvCache, 32768, 1);
      
      // 685B params at Q4 should require ~380+ GB VRAM
      expect(vram.weightsGb).toBeGreaterThan(350);
      expect(vram.isMoE).toBe(true);
      expect(vram.activeParamFraction).toBeCloseTo(37 / 685, 2);
    });
  });
});
