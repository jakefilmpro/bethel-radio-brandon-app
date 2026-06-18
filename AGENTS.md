# Bethel Radio Brandon — Project Knowledge Base

## Overview

Single-page vanilla JS PWA radio player for WSPE 96.5 FM. Zero dependencies, deployed as static files on Vercel.

- **Stream source**: rcast.net (Shoutcast/Icecast)
- **Metadata**: Polls `status.rcast.net/73642` every 12s via a CORS proxy
- **Deployment**: Vercel (static file hosting)
- **Language**: English UI, Spanish PWA install prompt

---

## File Map

| File | Purpose |
|---|---|
| `index.html` | Entire app in one file (HTML + CSS + JS) |
| `manifest.json` | PWA manifest (icons, display, theme) |
| `service-worker.js` | Network-first SW with cache fallback |
| `vercel.json` | Vercel headers (MIME types, caching) |
| `Asset 1.png` | Station logo |
| `logo-bethel.png` | Logo variant |
| `fallback.png` | Default album art when artwork fetch fails |
| `favicon.ico` | Tab icon |
| `icon_180x180.png` | Apple touch icon |
| `icon_192x192.png` | PWA icon |
| `icon_512x512.png` | PWA icon |
| `README.md` | Project description |

---

## Architecture

```
index.html
├── <head>
│   ├── PWA meta tags (apple-mobile-web-app-capable, viewport-fit, theme-color)
│   ├── Manifest + favicon + apple-touch-icon links
│   └── <style> (inline CSS — glassmorphism card, gradient bg, responsive)
├── <body>
│   ├── Logo image
│   ├── .radio-player card
│   │   ├── #cover (album art, fallback.png initially)
│   │   ├── ● LIVE badge
│   │   ├── #songTitle + #nowPlaying
│   │   ├── #playBtn (play/pause toggle, SVG icons)
│   │   ├── #volumeBtn (mute/unmute toggle, SVG icons)
│   │   └── <audio id="radio">
│   ├── <script> (Player logic — play/pause, volume, metadata polling, artwork)
│   └── <script> (PWA install prompt — iOS/Android detection, custom install modal)
```

### Data flow

```
fetchMetadata() every 12s
  → API_PROXY (Vercel CORS proxy)
  → status.rcast.net/73642
  → Parse "Title - Artist" format
  → Update #songTitle, #nowPlaying
  → (Artwork fetch disabled — cover stays on fallback.png)
```

### PWA install flow

```
beforeinstallprompt event → capture deferredPrompt
window load + 1.5s delay → showInstallModal()
  → iOS: show alert with Share Sheet instructions
  → Android: deferredPrompt.prompt()
```

---

## Key Technical Details

- **Stream URL**: `https://stream.rcast.net/73642`
- **Metadata URL**: `https://status.rcast.net/73642`
- **Artwork URL**: `https://artwork.rcast.net/73642`
- **CORS Proxy**: `https://bethel-radio-redirect-resolver.vercel.app/api/resolve`
- **Cache name**: `bethel-radio-v1` (service worker)
- **Polling interval**: 12 seconds
- **Audio preload**: `none`
- **Default volume**: `0.8`

---

## Improvement Roadmap

### UI / UX
- [ ] **Volume slider** — replace mute toggle with a proper volume slider for granular control
- [ ] **Loading / error states** — show spinner during buffering; display friendly error on stream failure
- [ ] **Audio error handling** — listen to `error`, `stalled`, `waiting`, `ended` events on `<audio>`; auto-reconnect on failure
- [ ] **Re-enable artwork** — uncomment artwork fetch; add fallback fade transition
- [ ] **Now-playing animation** — scrolling marquee for long song titles
- [ ] **Skeleton/shimmer** — replace "Loading..." with a proper skeleton placeholder
- [ ] **Smarter PWA prompt** — don't show on every visit; track dismissed state in localStorage; show after user interaction
- [ ] **Swipe to dismiss** — add swipe gesture to dismiss install modal
- [ ] **Announcement banner** — space for station announcements or current show info

### Code quality
- [ ] **Split files** — extract CSS and JS into separate files (`styles.css`, `app.js`, `pwa-install.js`)
- [ ] **Add package.json** — even if no build step, it anchors the project (name, version, scripts)
- [ ] **ESLint + Prettier** — standardize code formatting and catch issues
- [ ] **TypeScript** — add types for stream config, metadata shape, and UI state
- [ ] **Error handling** — exponential backoff on metadata fetch failures instead of naive setInterval
- [ ] **Constants module** — move URLs and config into a single place
- [ ] **IIFE / module pattern** — avoid polluting global scope

### Performance
- [ ] **Preload stream on hover/touch** — start buffering when user hovers play button
- [ ] **Optimize images** — convert PNGs to WebP; consider SVG for logo
- [ ] **Cache artwork** — store fetched artwork URLs in localStorage/Cache API
- [ ] **Reduce polling** — longer interval when tab is backgrounded (use Page Visibility API)

### PWA
- [ ] **Pre-cache assets** — cache logo, icons, fallback.png on SW install (currently only caches on fetch)
- [ ] **Offline page** — serve a minimal offline state when network is unavailable
- [ ] **Periodic background sync** — update metadata even when app is backgrounded
- [ ] **Splash screen** — customize PWA splash screen with theme_color and icons
- [ ] **Update SW cache strategy** — consider stale-while-revalidate for assets

### Infrastructure
- [ ] **CI/CD** — GitHub Actions to lint and auto-deploy to Vercel on push to main
- [ ] **Environment variables** — move URLs to env vars for different environments
- [ ] **Content Security Policy** — add CSP headers in vercel.json
- [ ] **Compression** — ensure Vercel serves Brotli/gzip
- [ ] **Custom domain** — add custom domain DNS + Vercel config (if not already set)
- [ ] **Analytics** — privacy-friendly analytics (Plausible, Umami) to track listeners

### Testing
- [ ] **Manual test checklist** — test play/pause, metadata display, PWA install on iOS Safari and Android Chrome
- [ ] **Lighthouse audit** — run Lighthouse for PWA, performance, accessibility scores
- [ ] **Cross-browser test** — verify on Firefox, Safari, Chrome, Samsung Internet

### Accessibility
- [ ] **ARIA labels** — add `aria-label` to play/volume buttons, live region for now-playing updates
- [ ] **Keyboard navigation** — ensure all controls are keyboard-accessible
- [ ] **Reduced motion** — respect `prefers-reduced-motion`
- [ ] **Color contrast** — verify text contrast ratios against green gradient background
- [ ] **Focus indicators** — visible focus ring on buttons

### Security
- [ ] **Subresource Integrity** — SRI hashes for any external resources
- [ ] **Permissions policy** — restrict camera/mic/geolocation in headers (not needed by app)
- [ ] **X-Content-Type-Options: nosniff** — add to vercel.json headers

### Git / repo
- [ ] **Commit history** — meaningful commits, not just one initial commit
- [ ] **Issue templates** — GitHub issue templates for bugs / feature requests
- [ ] **.github/ workflows** — CI pipeline
- [ ] **Branch protection** — protect main branch

---

## Current Pain Points

1. **Artwork is completely disabled** — commented out with no timeline for re-enabling
2. **Single monolithic file** — hard to maintain, read, and diff
3. **No error recovery** — if the proxy goes down, metadata silently fails with no retry
4. **Intrusive install prompt** — shows after 1.5s unconditionally (no dismiss tracking)
5. **No package.json** — means no standardized scripts or tooling entry point
6. **No analytics** — impossible to know how many listeners use the app
7. **Hardcoded URLs** — stream/proxy URLs are hardcoded with no env var support
8. **SVGs inlined in JS** — makes icon changes painful; consider using an SVG sprite or icon component
