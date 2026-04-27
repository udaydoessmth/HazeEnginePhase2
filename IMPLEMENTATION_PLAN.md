# HazeEngine Phase 2 — Implementation Plan

## Overview
A fully browser-based platform combining a **Visual Novel Game Engine** with a **Digital Audio Workstation (DAW)**.
Users can create interactive stories, compose music, link audio to scenes, and publish playable games.

## Tech Stack
- **Frontend**: React (JavaScript) + Vite + Tailwind CSS v4 + TanStack Query
- **State**: Zustand
- **Audio**: Tone.js + Web Audio API + lamejs (MP3 export)
- **Backend**: Node.js (Express) for local file storage
- **Database**: Supabase (Auth + PostgreSQL) — optional, works without it in local mode
- **Fonts**: Space Mono (monospace), Inter (sans-serif)
- **Design**: 099 Supply-inspired monochrome aesthetic

## Architecture
```
Frontend (React + Vite)     →  Express API (port 3001)  →  Local File Storage (/uploads)
                            →  Supabase (Auth + DB)      →  PostgreSQL
```

## Design Language
- Pure black (#000) background
- Monospace typography (Space Mono)
- Thin subtle borders (#1a1a1a)
- White/grey text only — no color accents
- Clean card layouts with pixel-gap borders
- Minimal, functional, zero clutter

## Phase Breakdown

### Phase 1: Scaffolding + Design System + Landing [✅ COMPLETE]
- Vite + React project with Tailwind v4
- CSS design tokens (colors, fonts, spacing, animations)
- Landing page with animated sections
- Express server with file upload & JSON data storage

### Phase 2: Game Engine [✅ COMPLETE]
- Scene editor with sidebar, canvas, tabbed editing
- Dialogue editor (character name + text)
- Choice/branching editor with scene linking
- Scene settings (title, background, transition)
- Live game preview with typewriter text + choices
- Autosave to Express server

### Phase 3: DAW [✅ COMPLETE]
- 4-channel step sequencer (Lead, Bass, Extra, Drums)
- Tone.js audio engine with multiple synth types
- Transport controls (Play, Stop, Loop, BPM, Volume)
- Key/Scale selection with automatic pitch row generation
- Instrument switching per channel
- Save/load patterns to server

### Phase 4: Auth + Dashboard [✅ COMPLETE]
- Email login/signup (Supabase or local mode)
- Project dashboard with grid layout
- Create, edit, delete projects
- Navigation between editor and DAW

### Phase 5: Integration [IN PROGRESS]
- Attach audio tracks to scenes
- Playback during game preview
- Audio manager for crossfades

### Phase 6: Publishing + Polish [PLANNED]
- Publish button + public URLs
- Public game player (no auth needed)
- Autosave improvements
- Performance optimization

## Running the Project
```bash
# Install dependencies
npm install

# Start frontend (port 5173)
npm run dev

# Start Express server (port 3001)  
npm run server

# Start both concurrently
npm run dev:all

# Production build
npm run build
```

## File Structure
```
├── server/index.js          # Express API server
├── uploads/                 # Local file storage
│   ├── audio-drafts/
│   ├── audio-complete/
│   └── assets/
├── data/projects.json       # Local project database
├── src/
│   ├── main.jsx             # Entry point
│   ├── App.jsx              # Router + routes
│   ├── index.css            # Tailwind + design system
│   ├── lib/supabase.js      # Supabase client
│   ├── contexts/AuthContext  # Auth state
│   ├── stores/              # Zustand stores
│   ├── audio/               # Tone.js engine (decoupled)
│   ├── components/          # UI + GameEngine + DAW
│   └── pages/               # Route pages
```
