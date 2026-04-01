# Build Fix - Next.js Prerendering Error

## Issue

The build was failing with the following error:

```
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /page: /, exiting the build.
```

## Root Cause

The error was caused by using `useSearchParams()` from `next/navigation` in the page component. This hook is **client-side only** and cannot be used during static prerendering/build time in Next.js.

When Next.js tries to prerender the page at build time, `useSearchParams()` throws an error because:
1. There's no browser `window` object available
2. There's no URL search params to read during static generation
3. The hook is designed for client-side navigation only

## Solution

Replaced the Next.js hook with a simple client-side approach:

### Before (❌ breaks build)
```typescript
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const search = searchParams.toString();
    // ... load config
  }, [searchParams]);
}
```

### After (✅ works)
```typescript
import { useState, useEffect } from "react";

export default function Page() {
  // Load config from URL on mount (client-side only)
  useEffect(() => {
    const search = window.location.search;
    if (search) {
      const loadedConfig = decodeConfigFromUrl(search);
      if (loadedConfig && validateConfig(loadedConfig)) {
        setConfig(loadedConfig);
      }
    }
  }, []);
}
```

## Key Changes

1. **Removed `useSearchParams`** - This hook is not compatible with static prerendering
2. **Use `window.location.search`** - Direct browser API, safe in client-side useEffect
3. **Removed unused imports** - Cleaned up `useRouter`, `useCallback`
4. **Removed unused state** - Removed `isClient` state that was no longer needed

## Why This Works

- The `useEffect` hook only runs on the client side (after hydration)
- By the time `useEffect` runs, `window.location` is available
- The build process can complete without errors
- The functionality remains identical from the user's perspective

## Testing

After the fix:
```bash
pnpm build
# ✅ Build succeeds
```

The share URL functionality works exactly as before:
- Share URLs with `?config=xxx` are loaded on page mount
- Configuration is decoded and validated
- Invalid configs fall back to defaults

## Next.js Documentation

- [useSearchParams API](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Prerendering Error Reference](https://nextjs.org/docs/messages/prerender-error)
- [Client-Only Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching#client-side-data-fetching)

## Lesson Learned

**For Next.js App Router:**
- Avoid `useSearchParams` in page components if you need static prerendering
- Use `window.location.search` in `useEffect` for client-side only features
- Consider `dynamic = 'force-dynamic'` if you need runtime rendering (but this disables static optimization)

---

**Fixed in commit:** `8589125`  
**Date:** 2026-04-02 00:49 HKT
