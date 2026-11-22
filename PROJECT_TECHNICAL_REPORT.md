# HAZEENGINE: TECHNICAL EXPLANATION & PROJECT DEVELOPMENT REPORT

---

## 1. Executive Summary & Project Abstract

**HazeEngine** is a zero-install, cloud-integrated web platform combining an **Interactive Visual Novel Studio** with a full-fledged **Digital Audio Workstation (DAW)**. Historically, game developers and digital storytellers have had to juggle disparate tools—using specialized software (such as Ren'Py, Twine, or TyranoBuilder) alongside desktop audio workstations (such as FL Studio, Ableton, or Reaper)—often creating friction, licensing costs, and distribution bottlenecks.

HazeEngine eliminates this separation by embedding a node-based narrative visual novel engine and a 4-channel pattern sequencer directly into the browser. Creators write branching storylines, position characters, compose original soundtracks across customizable synthesized instruments, attach audio directly to story scenes, and publish playable games and standalone music tracks via permanent public URLs with one click.

---

## 2. High-Level Architecture & Design Philosophy

### 2.1 Dual-Tier Topology (Cloud Primary + Local Resilient Fallback)
The application is engineered with an adaptive data access layer designed to operate in two modes without changing frontend code:
1. **Cloud Mode (Primary - Supabase)**: Leverages Supabase PostgreSQL, GoTrue Authentication, Row Level Security (RLS), and S3-compatible cloud storage buckets (`images` and `audio`).
2. **Local Mode (Offline Fallback - Express Server)**: If internet connectivity drops or Supabase credentials are absent, the application gracefully degrades to an Express.js backend running on port `3001` with local JSON persistence (`data/projects.json`) and disk storage (`uploads/`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (React 19 + Vite 8)                     │
│  ┌───────────────────────┐  ┌────────────────┐  ┌───────────────────┐  │
│  │  Scene Visual Editor  │  │   Web DAW UI   │  │ Public Play /     │  │
│  │  (Canvas, Nodes, Text)│  │ (Step Grid)    │  │ Music Player Page │  │
│  └───────────┬───────────┘  └───────┬────────┘  └─────────┬─────────┘  │
│              └───────────────┐      │      ┌──────────────┘            │
│                              ▼      ▼      ▼                           │
│                      Zustand State Stores & Data Layer                 │
│                 (sceneStore, dawStore, publishStore, etc.)              │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                    Is Supabase Configured & Online?
                                      / \
                              Yes    /   \   No
                                    ▼     ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│           CLOUD BACKEND             │  │         LOCAL BACKEND         │
│         (Supabase Platform)         │  │     (Express.js Server :3001) │
│ - Auth (JWT, email signup/login)    │  │ - REST API (/api/projects)    │
│ - PostgreSQL DB (RLS policies)      │  │ - Multer File Uploads         │
│ - Storage Buckets ('images', 'audio')│ │ - Disk Storage (/uploads)     │
│ - Database Webhook Triggers         │  │ - JSON Store (data/projects)  │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

### 2.2 Aesthetic & User Experience Identity
- **Monochrome Dark Palette**: Deep `#0a0a0a` background with `#ffffff` high-contrast typography, avoiding unnecessary colored buttons.
- **Strict Monospace Accents**: All metadata, transport metrics (BPM, step numbers, key scales), and editor timestamps use `Space Mono`.
- **Zero-Friction Immersion**: Reader views (`/play/:id` and `/music/:id`) are stripped of all editor controls, toolbars, and extraneous chrome, rendering only full-bleed visual novel storyboards and customized audio waveforms.

---

## 3. Detailed Component & Subsystem Architecture

### 3.1 Digital Audio Workstation (DAW) & Sound Engine
The audio subsystem is decoupled from React's rendering lifecycle to prevent dropped frames and audio glitching during heavy DOM re-renders.

```
┌───────────────────────────────────────────────────────────────┐
│                       AUDIO PIPELINE                          │
│                                                               │
│   Channels:                                                   │
│   [Lead Channel]  ──► Tone.Synth / Square / Triangle          │
│   [Bass Channel]  ──► Tone.FMSynth / MonoSynth                │
│   [Extra Channel] ──► Tone.PolySynth (Tri)   ──► ChannelGain  │
│   [Drum Channel]  ──► MembraneSynth (Kick)        │           │
│                       NoiseSynth (Snare/Hat)      │           │
│                       MetalSynth (Rimshot)        ▼           │
│                                               MasterGain      │
│                                                   │           │
│                                                   ▼           │
│                                            AudioDestination   │
└───────────────────────────────────────────────────────────────┘
```

- **Audio Engine Singleton (`AudioEngine.js`)**: Built upon Tone.js and the Web Audio API. Manages synthesis, audio scheduling, and master/channel gain hierarchies.
- **Polyphonic & FM Synthesis**:
  - `synth` / `squareSynth` / `triangleSynth`: Subtractive oscillator voices with custom attack/decay envelopes.
  - `fmSynth`: 2-operator frequency modulation synth (harmonicity: 2, modulationIndex: 3) for deep bass timbres.
  - `polySynth`: 6-voice polyphonic triangle synth for background chord progressions.
- **Drum Machine Synthesizers**: Procedural percussion synthesis avoiding external sample loading dependencies:
  - **Kick**: `MembraneSynth` with exponential pitch decay (6 octaves down to `C1`).
  - **Snare & Hi-Hat**: White noise generators passed through filtered `NoiseSynth` envelopes.
  - **Rimshot**: Metallic frequency modulators (`MetalSynth`).
- **Sequencer Scheduling**:
  - `Tone.getTransport()` drives a 16-step grid indexed in 16th notes (`16n`).
  - Tone's `Draw.schedule` syncs UI step highlights with the hardware audio thread.
- **Offline Rendering & Export (`exporter.js`)**:
  - Computes audio in an offline buffer (`Tone.Offline`) at 44.1 kHz.
  - Converts raw `Float32Array` PCM channel data to 16-bit signed integers (`Int16Array`).
  - Encodes WAV buffers into MP3 via `lamejs` in 1152-sample blocks for user downloads and automated cloud publishing.

---

### 3.2 Visual Novel Game Engine
- **Scene Graph Model (`sceneStore.js`)**:
  - Stories are modeled as a directed graph of Scene nodes:
    $$\text{Scene} = \{ \text{id}, \text{title}, \text{background}, \text{characters}[], \text{dialogues}[], \text{choices}[], \text{transition}, \text{audioId} \}$$
- **Typewriter Effect Engine (`GamePreview.jsx`)**:
  - Custom interval-driven character streamer emitting text character-by-character (30ms per character).
  - Spacebar or click triggers instant expansion if text is actively streaming, or advances to the next dialogue/choice if streaming has concluded.
- **Spatial Character Coordinate System**:
  - Characters are positioned on an X-axis percentage (`0%` to `100%`) with anchor transformations (`translateX(-50%)`), ensuring sprite stability across mobile, tablet, and widescreen aspect ratios (standardized to 16:9).
- **Branching Decision Engine**:
  - Choices contain dynamic pointers (`targetSceneId`). When chosen, the engine smoothly transitions to the target scene using CSS opacity keyframes and state reset routines.

---

### 3.3 Publishing, Storage & Distribution Engine
- **Data Contract & Database Migration (`scripts/migration.sql`)**:
  - Extended core entities with publication properties (`is_published`, `visibility`, `published_at`, `cover_image`, `genre`, `creator_name`, `audio_url`).
  - Auto-populates creator profiles from authentication metadata using a PostgreSQL `AFTER INSERT` trigger (`handle_new_user()`).
- **Storage Strategy**:
  - Cover images are uploaded directly to the Supabase `images` bucket under `covers/{timestamp}-{rand}.ext`.
  - Exported WAV/MP3 tracks are uploaded to the `audio` bucket under `audio/{timestamp}-{rand}.wav`.
  - Both buckets provide high-speed public CDN endpoints.
- **Non-Destructive Unpublishing**:
  - Unpublishing a game or song toggles `is_published = false`. The original project in the creator's dashboard, editor scene graph, and DAW pattern data remain untouched.

---

### 3.4 Security Architecture & Hardening
- **Row Level Security (RLS)**:
  - `profiles`: Public read (`SELECT USING (true)`), authenticated self-write only (`id = auth.uid()`).
  - `projects` / `audio_tracks`: Authenticated write restrictions matching project owner (`user_id = auth.uid()`), while allowing anonymous public reads for published entries (`is_published = true AND visibility = 'public'`).
- **Server Path Traversal Mitigation (`server/index.js`)**:
  - Category uploads are strictly verified against an allowed whitelist (`ALLOWED_UPLOAD_TYPES`: `audio-drafts`, `audio-complete`, `assets`, `images`).
  - Filenames are cleansed using `path.basename()` with regular-expression sanitization.
  - Filepaths are resolved and verified using `filepath.startsWith(uploadsDir)`.
- **Environment & Credential Isolation**:
  - Supabase client uses the public `anon` key, whose capabilities are restricted by database RLS.
  - Secret patterns (`.env`, `.env.*`) are ignored in `.gitignore`, and a clean `.env.example` template is provided.

---

## 4. Complete Development Lifecycle in Phases

### Phase 1: Environment, Tooling & Design System
- **Objective**: Establish the foundation, development server, and styling tokens.
- **Work Performed**:
  - Configured Vite 8, React 19, and Tailwind CSS v4.
  - Implemented core CSS design tokens (`#0a0a0a` background, monospace fonts, card layouts).
  - Designed the landing page with interactive hero section, feature showcases, and call-to-actions.
  - Created Express backend to support local development and file uploads.
- **Deliverables**: Operational base repository, layout scaffolding, and initial Express API.

### Phase 2: Visual Novel Core Engine
- **Objective**: Build the narrative authoring environment.
- **Work Performed**:
  - Created `SceneEditor.jsx` featuring three-pane hierarchy (Scene Sidebar, 16:9 Canvas Viewport, and Tabbed Editor).
  - Built `DialogueEditor.jsx` and `ChoiceEditor.jsx` for creating non-linear story arcs.
  - Implemented `GamePreview.jsx` with real-time typewriter typography and dialogue progression.
  - Implemented image upload pipeline with automatic Base64 local fallback.
- **Deliverables**: Working story builder and in-editor preview player.

### Phase 3: Web-Based Digital Audio Workstation
- **Objective**: Provide an integrated sound design suite.
- **Work Performed**:
  - Built `StepSequencer.jsx` with a 16-step matrix across Lead, Bass, Chords, and Drums.
  - Created `AudioEngine.js` leveraging Tone.js synthesizers and custom envelope modulation.
  - Built `TransportBar.jsx` for dynamic BPM adjustment (40–300), key selection, and scale transposition (Major, Minor, Pentatonic, Blues, Chromatic).
  - Implemented client-side audio export using `lamejs` for MP3 generation.
- **Deliverables**: Fully operational in-browser music studio.

### Phase 4: User Authentication & Project Dashboard
- **Objective**: Enable user accounts and multi-project persistence.
- **Work Performed**:
  - Integrated Supabase Auth (`AuthContext.jsx`) supporting email login, signup, and local mock fallback.
  - Built `Dashboard.jsx` featuring project cards, creation modals, and deletion workflows.
  - Established project stores with automatic local storage caching.
- **Deliverables**: Project management hub with user authentication.

### Phase 5: Audio-Visual Integration
- **Objective**: Bridge the visual novel engine with composed music.
- **Work Performed**:
  - Built `AudioTrackPicker.jsx` allowing creators to attach tracks composed in the DAW directly to scenes.
  - Connected `GamePreview.jsx` to the audio engine to auto-load instrument presets and loop patterns on scene transitions.
  - Maintained backward compatibility between legacy `patternData` and modern `patterns` keys.
- **Deliverables**: Unified experience where stories play with synced soundtracks.

### Phase 6: MVP Publishing System
- **Objective**: Allow users to share visual novels and music via public URLs.
- **Work Performed**:
  - **Data Layer (`publishStore.js`)**: Methods for `publishProject`, `unpublishProject`, `publishTrack`, `fetchPublicGames`, and `fetchPublicMusic`.
  - **Publish Modals (`PublishModal.jsx`)**: Unified modal capturing title, description, cover art, genre, and visibility.
  - **Public Player Pages**:
    - `/play/:projectId` (`PlayGame.jsx`): Standalone visual novel runtime without editor tools.
    - `/music/:trackId` (`PublicMusicPage.jsx`): Web audio player with scrubbable seek bar and artist attribution.
  - **Explore Page (`ExplorePage.jsx`)**: Public catalog with debounced search and game/music tab switching.
  - **My Publications (`MyPublicationsPage.jsx`)**: Dashboard for managing, copying, and unpublishing published works.
  - **Database Migration**: Created SQL scripts for schema extensions, RLS policies, and triggers.
- **Deliverables**: Complete publishing pipeline from creation to public consumption.

### Phase 7: Optimization, Security & Brand Polish
- **Objective**: Harden the codebase and prepare for production deployment.
- **Work Performed**:
  - **Code Splitting**: Configured Rolldown in `vite.config.js` to isolate `tone` and `@supabase/supabase-js`, dropping bundle size to 415 kB and build time to <500ms.
  - **Security Fixes**: Patched directory traversal in `server/index.js`, sanitized filenames, and secured `.env` tracking.
  - **Brand Identity**: Replaced unstyled Bamum glyph with bespoke vector SVG `LogoMark.jsx` and updated `favicon.svg`.
  - **Data Sanitation**: Cleaned ~46,000 lines of duplicate local test entries in `data/projects.json` and added idempotent upserts.
- **Deliverables**: Robust, hardened, production-ready codebase.

---

## 5. Database Schema & Data Models

### 5.1 Tables
```sql
-- Profiles Table (Synced from Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table (Visual Novels)
-- Key columns: id (UUID), user_id (UUID), title (TEXT), description (TEXT),
-- cover_image (TEXT), genre (TEXT), visibility (TEXT), is_published (BOOLEAN),
-- published_at (TIMESTAMPTZ), creator_name (TEXT)

-- Scenes Table (Scene Graph)
-- Key columns: id (UUID), project_id (UUID), data (JSONB), updated_at (TIMESTAMPTZ)

-- Audio Tracks Table (DAW Compositions)
-- Key columns: id (UUID), user_id (UUID), project_id (UUID), title (TEXT),
-- tempo (INT), scale (TEXT), root_note (TEXT), instruments (JSONB), patterns (JSONB),
-- audio_url (TEXT), cover_image (TEXT), genre (TEXT), is_published (BOOLEAN)
```

---

## 6. Build Metrics & Performance Benchmarks

- **Build Time**: ~470 ms (Vite 8 production build).
- **Chunk Distribution**:
  - `dist/assets/index.js`: **416 kB** (Application runtime, components, UI).
  - `dist/assets/tone.js`: **260 kB** (Audio synthesizer, effects, Web Audio pipeline).
  - `dist/assets/supabase.js`: **195 kB** (Database client, auth routines, realtime engine).
  - `dist/assets/index.css`: **23 kB** (Tailwind CSS v4 design tokens).
- **Lighthouse Targets**: 95+ Performance, 100 Best Practices, 100 Accessibility.

---

## 7. Verification & Definition of Done

The application meets all success criteria:
1. **Creation**: Users can create visual novel scenes with dialogue and branching paths, and compose multi-channel soundtracks in the DAW.
2. **Publishing**: Clicking Publish outputs a permanent public URL and updates publication status.
3. **Distribution**: Unauthenticated users can open `/play/:id` to experience the visual novel with full audio, or `/music/:id` to listen to the track.
4. **Discovery & Management**: Published items appear on `/explore`, while creators can manage or unpublish content via `/my-publications`.
