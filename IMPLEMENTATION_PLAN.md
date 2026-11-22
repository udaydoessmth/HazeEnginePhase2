# HazeEngine Phase 2 — Implementation Plan & Status

## Overview
A fully browser-based platform combining an interactive **Visual Novel Studio** with an integrated **Digital Audio Workstation (DAW)**. Users can craft branching stories, compose multi-track soundtracks, link audio directly to scenes, and publish playable games and standalone tracks via public shareable URLs.

---

## Tech Stack
- **Frontend**: React 19 (JavaScript) + Vite 8 + Tailwind CSS v4 + TanStack Query
- **State Management**: Zustand with persistent storage
- **Audio Engine**: Tone.js + Web Audio API + lamejs (MP3 offline export)
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Local Fallback**: Express server + local JSON storage + Multer uploads
- **Fonts**: Space Mono (monospace), Inter (sans-serif), Space Grotesk
- **Design Language**: Monochrome aesthetic (#0a0a0a), thin subtle borders, crisp vector emblems

---

## Architecture
```
┌────────────────────────────────────────────────────────┐
│               Frontend (React 19 + Vite 8)             │
│   Scene Editor │ DAW Studio │ Public Players │ Explore │
└──────────┬─────────────────────────────┬───────────────┘
           │ (Primary)                   │ (Local Fallback)
           ▼                             ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│     Supabase Cloud      │   │       Express Server      │
│  PostgreSQL (RLS)       │   │  Local Endpoints (:3001)  │
│  Auth (JWT Sessions)    │   │  JSON Storage (data/)     │
│  Storage (Images/Audio) │   │  Disk Uploads (uploads/)  │
└─────────────────────────┘   └───────────────────────────┘
```

---

## Phase Breakdown & Status

### Phase 1: Scaffolding + Design System + Landing [✅ COMPLETE]
- Vite + React project setup with Tailwind CSS v4.
- CSS design tokens (monochrome palette, typography, glassmorphism, responsive viewports).
- Landing page with animated sections, product feature highlights, and interactive CTAs.
- Express server with local file uploads and JSON database fallback.

### Phase 2: Game Engine [✅ COMPLETE]
- Node-based scene editor with sidebar hierarchy, canvas, and tabbed inspectors.
- Dialogue editor supporting character names, typewriter preview, and dialogue ordering.
- Choice and branching system with direct target scene linking.
- Scene settings: title, background upload/URL, character sprites, and transitions (*fade*, *cut*, *slide*).
- Live game preview player with real-time dialogue typewriter and interactive choice buttons.
- Autosave integration (Supabase with Express/beacon fallback).

### Phase 3: Web DAW [✅ COMPLETE]
- 4-channel step sequencer: **Lead**, **Bass**, **Chords/Arp**, and **Drums**.
- Tone.js audio engine with multiple synth models (*Monophonic*, *FM*, *Polyphonic*, *Square*, *Triangle*).
- Synthesizer drum kits (*MembraneSynth kick*, *NoiseSynth snare/hi-hat*, *MetalSynth rimshot*).
- Transport bar: Play/Pause/Stop, Loop toggle, BPM tempo slider (40–300), and Master Volume.
- Musical Scale & Root Key selector with automatic scale row transposition (Major, Minor, Pentatonic, Blues, Chromatic).
- Step sequencing grid with beat indicators and playhead tracker.
- Offline audio rendering to WAV and client-side MP3 export via `lamejs`.

### Phase 4: Auth + Project Dashboard [✅ COMPLETE]
- Authentication system supporting email signup, login, session persistence, and local mode fallback.
- User profile synchronization linking Supabase Auth metadata to public creator display names.
- Project dashboard featuring grid view, quick create modal, and deletion dialogs.
- Project cards displaying publication status badges, timestamps, and direct links to editor/DAW.

### Phase 5: Engine & DAW Integration [✅ COMPLETE]
- Direct audio track picker inside Scene Editor settings to attach composed tracks to scenes.
- Automatic track synchronization and background loop playback during visual novel preview and play mode.
- Dual-key compatibility support (`patterns` and legacy `patternData`) across storage layers.

### Phase 6: MVP Publishing System [✅ COMPLETE]
- **Visual Novel Publishing**:
  - Modal form in Scene Editor capturing title, description, cover image, genre, and visibility (*Public* / *Unlisted*).
  - Permanent shareable URL generation (`/play/:projectId`).
  - Standalone reader page displaying cover artwork, creator name, description, and Play button without editor chrome.
- **DAW Music Publishing**:
  - Publish modal in DAW interface capturing track details, artwork, and visibility.
  - Automatic offline audio rendering to WAV and upload to storage infrastructure.
  - Public music player page (`/music/:trackId`) featuring HTML5 playback, scrubbable seek bar, and creator attribution.
- **Explore Hub (`/explore`)**:
  - Public discovery page for both published visual novels and music compositions.
  - Debounced search filter by title.
  - Filter by Public visibility only.
- **My Publications (`/my-publications`)**:
  - Creator management dashboard tabbed into "My Games" and "My Music".
  - Quick action buttons to open publications, copy share links, or unpublish content.
  - Unpublishing conceals publications without modifying or deleting original project source files.

### Phase 7: Polish, Hardening & Optimization [✅ COMPLETE]
- **Bundle & Performance**: Configured dynamic chunk splitting for `tone` and `@supabase/supabase-js`; build finishes in <500ms.
- **Backend Security**: Patched directory traversal in file uploads, restricted allowed categories, and validated basenames.
- **Secret Hygiene**: Protected `.env` files in `.gitignore`, removed cached backup files, and added `.env.example`.
- **Brand & Vector Identity**: Replaced unstyled fallback character glyph with bespoke vector SVG `LogoMark` and updated `favicon.svg`.
- **Defensive State Guards**: Added null-safe guards for legacy scene and track schemas across all Zustand stores.

---

## 🔮 Future Roadmap (Phase 8)
- [ ] Keyboard shortcuts in Visual Novel player (Space/Enter to advance, Esc to close).
- [ ] Multiple background music cues and sound effect (SFX) triggers per dialogue line.
- [ ] Custom visual novel themes/skins for text box styling.
- [ ] DAW pattern length expansion (32-step / 64-step sequencer modes).
- [ ] Audio volume automation / fade-in / fade-out controls per scene.

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Apply database migration (in Supabase SQL Editor)
# scripts/migration.sql

# 4. Start frontend + local backend concurrently
npm run dev:all

# 5. Production build test
npm run build
```
