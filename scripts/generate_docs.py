import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_docx():
    doc = Document()
    
    # Page Margins: 1 inch all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    # Document Header / Title
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title.add_run("HAZEENGINE")
    title_run.font.size = Pt(28)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_run = sub.add_run("Comprehensive Technical Architecture & Project Development Report")
    sub_run.font.size = Pt(14)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta_run = meta.add_run("Version 0.2.0 • Phase 2 MVP Publishing Release • Academic & Technical Documentation")
    meta_run.font.size = Pt(9.5)
    meta_run.font.color.rgb = RGBColor(0x77, 0x77, 0x77)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def add_p(text):
        p = doc.add_paragraph(text)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(6)
        return p

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, 'F1F5F9')
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 1. Executive Summary
    add_h1("1. Executive Summary & Project Abstract")
    add_p(
        "HazeEngine is a zero-install, cloud-integrated web platform that unifies an interactive Visual Novel Studio "
        "with a full-fledged Digital Audio Workstation (DAW). Historically, digital narrative creators were forced to juggle "
        "disjointed desktop software—using narrative scripting tools (such as Ren'Py or Twine) alongside complex commercial "
        "audio workstations (such as FL Studio, Ableton, or Reaper). This created severe friction, licensing costs, platform "
        "dependencies, and distribution bottlenecks."
    )
    add_p(
        "HazeEngine eliminates this divide by embedding both a node-based narrative visual novel studio and a 4-channel synthesizer/step "
        "sequencer directly into modern web browsers. Creators write branching storylines, position character sprites, compose original "
        "multi-channel soundtracks, bind music directly to scenes, and instantly distribute their work via permanent public URLs "
        "(/play/:id and /music/:id) with zero compilation steps."
    )

    # 2. Architecture & Design Philosophy
    add_h1("2. High-Level Architecture & Design Philosophy")
    add_h2("2.1 Dual-Tier Topology (Cloud Primary + Local Resilient Fallback)")
    add_p(
        "The system is engineered with an adaptive multi-tier architecture that operates transparently across both cloud and local environments:\n"
        "• Cloud Mode (Primary - Supabase): Leverages Supabase PostgreSQL, GoTrue Auth (JWT session management), Row Level Security (RLS), "
        "and S3-compatible cloud storage buckets ('images' and 'audio').\n"
        "• Local Mode (Offline Fallback - Express Server): If internet connectivity drops or Supabase credentials are absent, the application "
        "gracefully degrades to an Express.js server on port 3001 with local JSON persistence (data/projects.json) and disk storage (uploads/)."
    )

    add_code_block(
"""[Client Layer: React 19 + Vite 8]
    ├── Scene Visual Editor (Canvas, Nodes, Dialogue)
    ├── Web DAW Studio (4-Channel Sequencer, Synthesizers)
    └── Public Readers (/play/:projectId and /music/:trackId)
             │
             ├── (Primary Cloud)    ──► Supabase PostgreSQL + Auth + Storage
             └── (Offline Fallback) ──► Express.js API (:3001) + JSON Store"""
    )

    add_h2("2.2 Aesthetic & User Experience Identity")
    add_p(
        "HazeEngine follows a minimalist 099 Supply-inspired monochrome dark aesthetic. Deep #0a0a0a backdrops pair with high-contrast "
        "#ffffff typography, avoiding multi-colored noise. All transport controls, step grids, and editor metrics feature Space Mono "
        "typography. Public reader views are completely distraction-free, omitting all administrative toolbars."
    )

    # 3. Subsystem Architecture
    add_h1("3. Detailed Component & Subsystem Architecture")
    add_h2("3.1 Digital Audio Workstation (DAW) & Sound Engine")
    add_p(
        "The audio subsystem is decoupled from React's rendering lifecycle into an independent singleton engine (AudioEngine.js) built upon "
        "Tone.js and the Web Audio API to prevent dropped frames during heavy DOM updates."
    )
    add_p(
        "• Synthesis Engines: Includes subtractive oscillators (synth, squareSynth, triangleSynth), a 2-operator FM synthesizer (fmSynth) "
        "for basslines, and a 6-voice polyphonic synthesizer (polySynth) for chords.\n"
        "• Drum Machine: Procedural percussion synthesis avoiding external sample loading dependencies—MembraneSynth kick, NoiseSynth snare/hi-hat, "
        "and MetalSynth rimshot.\n"
        "• Sequencer Scheduling: Driven by Tone.Transport in 16th notes with Tone.Draw visual sync.\n"
        "• Offline Audio Export: Employs Tone.Offline at 44.1 kHz, Float32 to Int16 PCM conversion, and lamejs block encoding for WAV and MP3."
    )

    add_h2("3.2 Visual Novel Game Engine")
    add_p(
        "• Scene Graph Model: Stories are modeled as a directed graph of Scene nodes containing background artwork, character positions, dialogues, "
        "and branching choice pointers.\n"
        "• Typewriter Engine: Character-by-character text streaming (30ms per character) with spacebar/click fast-forwarding.\n"
        "• Spatial Character Positioning: Normalized percentage-based X coordinates (0-100%) with anchor transformations ensure sprite stability "
        "across all screen aspect ratios.\n"
        "• Choice & Branching Engine: Choices contain dynamic targetSceneId pointers, transitioning scenes smoothly with opacity keyframes."
    )

    add_h2("3.3 Publishing, Storage & Distribution")
    add_p(
        "• One-Click Publishing: Generates public URLs (/play/:id and /music/:id) while uploading cover art and rendered WAV/MP3 files to cloud storage.\n"
        "• Explore Discovery Hub (/explore): Allows public discovery with instant debounced title search.\n"
        "• Creator Management (/my-publications): Provides non-destructive unpublishing that conceals published items from Explore without altering project sources."
    )

    add_h2("3.4 Security Architecture & Hardening")
    add_p(
        "• Row Level Security (RLS): Supabase PostgreSQL tables strictly enforce authenticated ownership for writes, while allowing public read access "
        "only on published entries.\n"
        "• Backend File Path Traversal Defense: Upload categories are strictly checked against an allowed whitelist (ALLOWED_UPLOAD_TYPES), and all "
        "filenames are cleansed with path.basename() regex validation.\n"
        "• Environment Secret Protection: Private tokens and backup files are untracked from Git, supported by .env.example."
    )

    # 4. Development Lifecycle in Phases
    add_h1("4. Complete Development Lifecycle in Phases")
    
    phases = [
        ("Phase 1: Environment, Tooling & Design System", "Configured Vite 8, React 19, and Tailwind CSS v4. Built design tokens, responsive layout grid, animated landing page, and baseline Express upload API."),
        ("Phase 2: Visual Novel Core Engine", "Engineered SceneEditor.jsx with sidebar hierarchy, 16:9 canvas viewport, DialogueEditor.jsx, ChoiceEditor.jsx, and real-time typewriter preview player."),
        ("Phase 3: Web-Based Digital Audio Workstation", "Constructed StepSequencer.jsx, AudioEngine.js synthesis suite, TransportBar.jsx (BPM, key, scale transposition), and client-side MP3 exporter."),
        ("Phase 4: User Authentication & Project Dashboard", "Integrated Supabase Auth with local mode fallback, project dashboard grid, project cards with status badges, and project management modals."),
        ("Phase 5: Audio-Visual Engine Integration", "Created AudioTrackPicker.jsx, connected scene transitions to automated DAW track playback, and unified pattern data formats."),
        ("Phase 6: MVP Publishing System", "Built publishStore.js data layer, PublishModal.jsx, standalone public player views (/play/:id and /music/:id), Explore catalog, and My Publications dashboard."),
        ("Phase 7: Optimization, Security & Brand Polish", "Configured Rolldown vendor chunk-splitting (<500ms build time), patched directory traversal, designed vector SVG LogoMark and favicon, and sanitized data stores.")
    ]

    for title_text, desc_text in phases:
        add_h2(title_text)
        add_p(desc_text)

    # 5. Database Schema & Tables
    add_h1("5. Database Schema & Storage Architecture")
    add_p("The production database utilizes PostgreSQL hosted on Supabase with Row Level Security enabled:")

    table_data = [
        ["Table", "Primary Key", "Key Columns", "RLS Policy"],
        ["profiles", "id (UUID -> auth.users)", "username, created_at", "Public read, owner write"],
        ["projects", "id (UUID)", "user_id, title, description, cover_image, genre, is_published, visibility, creator_name", "Owner read/write, public read if published"],
        ["scenes", "id (UUID)", "project_id, data (JSONB), updated_at", "Owner read/write, public read if project published"],
        ["audio_tracks", "id (UUID)", "user_id, project_id, title, tempo, scale, instruments, patterns, audio_url, is_published", "Owner read/write, public read if published"]
    ]

    doc_table = doc.add_table(rows=len(table_data), cols=4)
    doc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = doc_table.cell(r_idx, c_idx)
            cell.text = val
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            if r_idx == 0:
                set_cell_background(cell, '0F172A')
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            else:
                set_cell_background(cell, 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF')
                p.runs[0].font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 6. Build Metrics
    add_h1("6. Build Performance & Production Metrics")
    add_p(
        "• Production Build Time: ~470 ms (Vite 8 production client bundling).\n"
        "• Application Bundle (index.js): 416 kB (Application logic, UI components, Zustand stores).\n"
        "• Tone.js Vendor Chunk: 260 kB (Independent cached Web Audio synthesizer chunk).\n"
        "• Supabase Vendor Chunk: 195 kB (Independent cached database and auth client).\n"
        "• Stylesheet (index.css): 23 kB (Tailwind CSS v4 utility classes and design tokens)."
    )

    # 7. Verification & Conclusion
    add_h1("7. Conclusion & Definition of Done")
    add_p(
        "HazeEngine Phase 2 successfully delivers on all requirements: users can create interactive branching visual novels, "
        "compose original multi-track soundtracks, publish both creations with dedicated URLs, explore community works, and "
        "manage publications seamlessly without software installation or third-party toolchains."
    )

    docx_path = os.path.abspath("HazeEngine_Technical_Report.docx")
    doc.save(docx_path)
    print("DOCX created at:", docx_path)

def create_html():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HazeEngine — Technical Report & Documentation</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
    .header h1 { font-size: 32px; margin: 0 0 8px; color: #0f172a; letter-spacing: -0.02em; }
    .header .subtitle { font-size: 16px; color: #64748b; margin: 0 0 12px; }
    .header .meta { font-family: monospace; font-size: 12px; color: #94a3b8; }
    h2 { font-size: 20px; color: #0f172a; margin-top: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    h3 { font-size: 16px; color: #334155; margin-top: 20px; }
    p, li { font-size: 14.5px; color: #334155; }
    ul { padding-left: 20px; }
    pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
      font-family: Consolas, monospace;
      font-size: 12px;
      overflow-x: auto;
      color: #0f172a;
    }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e2e8f0; color: #334155; }
    .btn-print {
      position: fixed; top: 20px; right: 20px;
      padding: 10px 18px; background: #0f172a; color: #fff;
      border: none; border-radius: 6px; font-family: monospace;
      font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    @media print {
      .btn-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <h1>HAZEENGINE</h1>
    <div class="subtitle">Comprehensive Technical Architecture & Project Development Report</div>
    <div class="meta">Version 0.2.0 • Phase 2 MVP Publishing Release • Engineering Documentation</div>
  </div>

  <h2>1. Executive Summary & Project Abstract</h2>
  <p><strong>HazeEngine</strong> is a zero-install, cloud-integrated web platform combining an <strong>Interactive Visual Novel Studio</strong> with a full-fledged <strong>Digital Audio Workstation (DAW)</strong>. Historically, digital narrative creators were forced to juggle disjointed desktop software—using narrative tools (Ren'Py, Twine) alongside complex commercial audio workstations (FL Studio, Ableton Live). This created severe friction, licensing costs, platform dependency, and distribution bottlenecks.</p>
  <p>HazeEngine eliminates this divide by embedding both a node-based visual novel studio and a 4-channel synthesizer/step sequencer directly into modern web browsers. Creators write branching storylines, position character sprites, compose original multi-channel soundtracks, bind music directly to scenes, and instantly distribute their work via permanent public URLs (<code>/play/:id</code> and <code>/music/:id</code>) with zero compilation steps.</p>

  <h2>2. High-Level Architecture & Design Philosophy</h2>
  <h3>2.1 Dual-Tier Topology (Cloud Primary + Local Resilient Fallback)</h3>
  <p>The system is built on an adaptive multi-tier architecture that operates transparently across both cloud and local environments:</p>
  <ul>
    <li><strong>Cloud Mode (Primary - Supabase)</strong>: Leverages Supabase PostgreSQL, GoTrue Auth (JWT session management), Row Level Security (RLS), and S3-compatible cloud storage buckets (<code>images</code> and <code>audio</code>).</li>
    <li><strong>Local Mode (Offline Fallback - Express Server)</strong>: If internet connectivity drops or Supabase credentials are absent, the application gracefully degrades to an Express.js server on port 3001 with local JSON persistence (<code>data/projects.json</code>) and disk storage (<code>uploads/</code>).</li>
  </ul>

  <pre>
[Client Layer: React 19 + Vite 8]
    ├── Scene Visual Editor (Canvas, Nodes, Dialogue)
    ├── Web DAW Studio (4-Channel Sequencer, Synthesizers)
    └── Public Readers (/play/:projectId and /music/:trackId)
             │
             ├── (Primary Cloud)    ──► Supabase PostgreSQL + Auth + Storage
             └── (Offline Fallback) ──► Express.js API (:3001) + JSON Store
  </pre>

  <h2>3. Detailed Subsystem Architecture</h2>
  <h3>3.1 Digital Audio Workstation (DAW)</h3>
  <p>Built upon Tone.js and the Web Audio API, decoupled from React's render thread to prevent audio jitter. Synthesizers include subtractive oscillators, a 2-operator FM synth for bass, a 6-voice polyphonic synth for chords, and synthesized drum instruments (Membrane kick, Noise snare/hat, Metal rimshot). Offline audio rendering computes PCM audio at 44.1 kHz, converted to 16-bit WAV and encoded to MP3 via <code>lamejs</code>.</p>

  <h3>3.2 Visual Novel Game Engine</h3>
  <p>Visual novel storylines are stored as a directed scene graph. Features real-time character-by-character typewriter streaming (30ms rate), normalized percentage coordinate positioning for sprite scaling across screen sizes, and dynamic target scene linking for interactive choices.</p>

  <h3>3.3 Security & Hardening</h3>
  <p>Row Level Security restricts database writes to authenticated resource owners while permitting anonymous public reads for published games and music. Express upload endpoints enforce an allowed category whitelist and <code>path.basename()</code> regex sanitization to eliminate path traversal vulnerabilities.</p>

  <h2>4. Complete Development Lifecycle in Phases</h2>
  <ul>
    <li><strong>Phase 1: Environment, Tooling & Design System</strong>: Vite 8, React 19, Tailwind v4, design tokens, responsive layout, animated landing page, and Express backend.</li>
    <li><strong>Phase 2: Visual Novel Core Engine</strong>: <code>SceneEditor.jsx</code> three-pane layout, <code>DialogueEditor.jsx</code>, <code>ChoiceEditor.jsx</code>, and typewriter preview player.</li>
    <li><strong>Phase 3: Web-Based Digital Audio Workstation</strong>: <code>StepSequencer.jsx</code>, <code>AudioEngine.js</code> multi-synth engine, <code>TransportBar.jsx</code>, scale transpositions, and MP3 exporter.</li>
    <li><strong>Phase 4: User Authentication & Project Dashboard</strong>: Supabase Auth integration, profile sync triggers, project dashboard grid, and project management workflows.</li>
    <li><strong>Phase 5: Audio-Visual Integration</strong>: <code>AudioTrackPicker.jsx</code>, scene audio loop bindings, and backward compatibility.</li>
    <li><strong>Phase 6: MVP Publishing System</strong>: <code>publishStore.js</code> data layer, <code>PublishModal.jsx</code>, public player pages (<code>/play/:id</code> and <code>/music/:id</code>), Explore catalog, and My Publications dashboard.</li>
    <li><strong>Phase 7: Optimization, Security & Brand Polish</strong>: Rolldown vendor chunk-splitting (&lt;500ms build), path traversal mitigation, vector SVG <code>LogoMark</code>, and data store sanitation.</li>
  </ul>

  <h2>5. Database Schema & Tables</h2>
  <table>
    <thead>
      <tr>
        <th>Table</th>
        <th>Primary Key</th>
        <th>Key Columns</th>
        <th>RLS Policy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>profiles</strong></td>
        <td>id (UUID)</td>
        <td>username, created_at</td>
        <td>Public read, owner write</td>
      </tr>
      <tr>
        <td><strong>projects</strong></td>
        <td>id (UUID)</td>
        <td>user_id, title, description, cover_image, genre, is_published, visibility, creator_name</td>
        <td>Owner write, public read if published</td>
      </tr>
      <tr>
        <td><strong>scenes</strong></td>
        <td>id (UUID)</td>
        <td>project_id, data (JSONB), updated_at</td>
        <td>Owner write, public read if project published</td>
      </tr>
      <tr>
        <td><strong>audio_tracks</strong></td>
        <td>id (UUID)</td>
        <td>user_id, project_id, title, tempo, scale, instruments, patterns, audio_url, is_published</td>
        <td>Owner write, public read if published</td>
      </tr>
    </tbody>
  </table>

  <h2>6. Build Performance & Metrics</h2>
  <ul>
    <li><strong>Vite Production Build Time</strong>: ~470 ms</li>
    <li><strong>Application Bundle (index.js)</strong>: 416 kB</li>
    <li><strong>Tone.js Vendor Chunk</strong>: 260 kB</li>
    <li><strong>Supabase Vendor Chunk</strong>: 195 kB</li>
    <li><strong>CSS Bundle</strong>: 23 kB</li>
  </ul>
</body>
</html>"""
    html_path = os.path.abspath("HazeEngine_Technical_Report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print("HTML created at:", html_path)

if __name__ == "__main__":
    create_docx()
    create_html()
