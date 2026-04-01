/**
 * URL Query Param Utilities for Configuration Sharing
 * 
 * Encode/decode calculator configuration to/from URL query parameters
 * for easy sharing and bookmarking.
 */

import type { CalcConfig } from "@/components/config-panel";
import { QUANT_OPTIONS, KV_CACHE_OPTIONS, GPU_LIST, MODEL_LIST } from "@/lib/llm-data";

/**
 * Compact config for URL encoding (uses IDs instead of full objects)
 */
interface CompactConfig {
  gpu: string;
  numGpus: number;
  model: string;
  quant: string;
  kvCache: string;
  contextLen: number;
  concurrentUsers: number;
  promptTokens: number;
}

/**
 * Convert full config to compact format
 */
function toCompact(config: CalcConfig): CompactConfig {
  return {
    gpu: config.gpu.id,
    numGpus: config.numGpus,
    model: config.model.id,
    quant: config.quant.id,
    kvCache: config.kvCache.id,
    contextLen: config.contextLen,
    concurrentUsers: config.concurrentUsers,
    promptTokens: config.promptTokens,
  };
}

/**
 * Convert compact config back to full format
 */
function fromCompact(compact: CompactConfig): CalcConfig | null {
  const gpu = GPU_LIST.find(g => g.id === compact.gpu);
  const model = MODEL_LIST.find(m => m.id === compact.model);
  const quant = QUANT_OPTIONS.find(q => q.id === compact.quant);
  const kvCache = KV_CACHE_OPTIONS.find(k => k.id === compact.kvCache);

  if (!gpu || !model || !quant || !kvCache) {
    return null;
  }

  return {
    gpu,
    numGpus: compact.numGpus,
    model,
    quant,
    kvCache,
    contextLen: compact.contextLen,
    concurrentUsers: compact.concurrentUsers,
    promptTokens: compact.promptTokens,
  };
}

/**
 * Encode config to URL query params
 * Returns a Base64URL-encoded string for compactness
 */
export function encodeConfigToUrl(config: CalcConfig): string {
  const compact = toCompact(config);
  const json = JSON.stringify(compact);
  
  // Use Base64URL encoding for shorter URLs
  const base64 = btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `?config=${base64}`;
}

/**
 * Decode config from URL query params
 * Returns null if invalid or missing
 */
export function decodeConfigFromUrl(search: string): CalcConfig | null {
  const params = new URLSearchParams(search);
  const configParam = params.get('config');
  
  if (!configParam) {
    return null;
  }

  try {
    // Convert Base64URL back to standard Base64
    const base64 = configParam
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad if necessary
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    const json = atob(paddedBase64);
    const compact = JSON.parse(json) as CompactConfig;
    
    return fromCompact(compact);
  } catch (error) {
    console.error('Failed to decode config from URL:', error);
    return null;
  }
}

/**
 * Generate a shareable URL with current config
 */
export function generateShareUrl(config: CalcConfig, baseUrl?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : baseUrl || 'https://llm-vram-calculator.vercel.app';
  const queryString = encodeConfigToUrl(config);
  return `${origin}${queryString}`;
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(config: CalcConfig): Promise<boolean> {
  try {
    const url = generateShareUrl(config);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy share URL:', error);
    return false;
  }
}

/**
 * Check if URL contains config params
 */
export function hasConfigInUrl(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('config');
}

/**
 * Get all available models for a specific GPU provider
 * Helper for validation
 */
export function validateConfig(config: CalcConfig): boolean {
  const gpu = GPU_LIST.find(g => g.id === config.gpu.id);
  const model = MODEL_LIST.find(m => m.id === config.model.id);
  const quant = QUANT_OPTIONS.find(q => q.id === config.quant.id);
  const kvCache = KV_CACHE_OPTIONS.find(k => k.id === config.kvCache.id);

  return !!(gpu && model && quant && kvCache);
}
