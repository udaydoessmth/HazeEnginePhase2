# ꛅ HazeEngine

> **Browser-based Visual Novel Engine + Digital Audio Workstation**  
> Create interactive branching stories with original music composed directly in the browser. No installs. No dependencies. Free and open.

---

## ✨ Features

### 📖 Visual Novel Studio
- **Node-based Story Editor**: Create and reorder scenes with custom backgrounds, character positioning, and transitions (*fade*, *cut*, *slide*).
- **Dialogue & Choices**: Write character dialogues, define branching choices, and preview story paths in real-time.
- **Audio Attachment**: Bind audio compositions created in the DAW directly to scenes with automated scene playback.
- **Player View**: Clean, distraction-free player view for readers with full audio and dialogue typewriter effects.

### 🎛️ Digital Audio Workstation (DAW)
- **4-Channel Sequencer**: Dedicated channels for **Lead**, **Bass**, **Chords/Arp**, and **Drums**.
- **Synthesizer Engine**: Built on Tone.js with customizable synth engines (*Monophonic*, *FM*, *Polyphonic*, *Subtractive*, and *Drum Kit*).
- **Musical Scales & Keys**: Automatic pitch mapping across Major, Minor, Pentatonic, Blues, and Chromatic scales.
- **Audio Export**: Offline rendering to WAV and high-quality MP3 export.

### 🚀 Publishing & Community
- **One-Click Publishing**: Publish visual novels and music compositions to permanent shareable public URLs.
- **Public Showcase Pages**: Dedicated standalone player pages (`/play/:id` for games, `/music/:id` for tracks).
- **Explore Hub (`/explore`)**: Discover published community creations with instant search and genre filtering.
- **Creator Management (`/my-publications`)**: Manage visibility (Public / Unlisted), copy share links, or unpublish anytime without deleting project source files.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4
- **State Management**: Zustand with persistent storage
- **Audio Engine**: Tone.js, Web Audio API, lamejs
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, Row-Level Security)
- **Local Fallback Server**: Express, Multer, local JSON storage

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**

### 2. Clone and Install
```bash
git clone https://github.com/udaydoessmth/HazeEnginePhase2.git
cd HazeEnginePhase2
npm install
```

### 3. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```
Fill in your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*(If Supabase credentials are not provided, HazeEngine will automatically fall back to the built-in local Express server and storage).*

### 4. Database Setup (Supabase)
If using Supabase, run [`scripts/migration.sql`](scripts/migration.sql) in your **Supabase Dashboard > SQL Editor**:
- Creates `profiles` table and auto-sync triggers.
- Sets up Row Level Security (RLS) policies.
- Adds publishing metadata columns to `projects` and `audio_tracks`.
- Ensure public storage buckets `images` and `audio` exist in **Storage > Buckets**.

### 5. Run Development Server
To run both the Vite frontend and local backend concurrently:
```bash
npm run dev:all
```
Or run the frontend only:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```text
├── public/                # Static assets, favicon, icons
├── scripts/               # Database SQL migrations and utility scripts
├── server/                # Local Express server (offline fallback & file uploads)
├── src/
│   ├── assets/            # UI images and icons
│   ├── audio/             # Tone.js AudioEngine, instruments, and exporter
│   ├── components/
│   │   ├── DAW/           # Step sequencer, transport, instrument panels
│   │   ├── GameEngine/    # Scene editor, canvas, dialogue editor, preview player
│   │   ├── layout/        # Navbar and global layout elements
│   │   └── ui/            # Modals, buttons, banners, error boundaries
│   ├── contexts/          # Auth context and user session providers
│   ├── lib/               # Supabase client initialization
│   ├── pages/             # Route pages (Landing, Dashboard, Explore, Editor, DAW, etc.)
│   └── stores/            # Zustand stores (sceneStore, dawStore, publishStore, projectStore)
└── index.html             # Application entrypoint
```

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts Vite client dev server at `localhost:5173` |
| `npm run server` | Starts local Express backend at `localhost:3001` |
| `npm run dev:all` | Runs both Vite dev server and Express server concurrently |
| `npm run build` | Builds optimized production bundle into `dist/` |
| `npm run preview` | Locally previews the production build |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## 📄 License

MIT License. Feel free to use, modify, and build upon HazeEngine.
