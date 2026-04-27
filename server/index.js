import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Ensure upload directories exist
const dirs = ['uploads/audio-drafts', 'uploads/audio-complete', 'uploads/assets', 'data']
dirs.forEach(d => {
  const full = join(ROOT, d)
  if (!existsSync(full)) mkdirSync(full, { recursive: true })
})

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(join(ROOT, 'uploads')))

// ===== FILE STORAGE =====
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.params.type || 'assets'
    const dir = join(ROOT, 'uploads', type)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = file.originalname.split('.').pop()
    cb(null, `${unique}.${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// Upload file
app.post('/api/upload/:type', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  const url = `/uploads/${req.params.type}/${req.file.filename}`
  res.json({ url, filename: req.file.filename })
})

// List files in a category
app.get('/api/files/:type', (req, res) => {
  const dir = join(ROOT, 'uploads', req.params.type)
  if (!existsSync(dir)) return res.json({ files: [] })
  const files = readdirSync(dir).map(f => ({
    name: f,
    url: `/uploads/${req.params.type}/${f}`,
  }))
  res.json({ files })
})

// Delete file
app.delete('/api/files/:type/:filename', (req, res) => {
  const filepath = join(ROOT, 'uploads', req.params.type, req.params.filename)
  if (existsSync(filepath)) {
    unlinkSync(filepath)
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'File not found' })
  }
})

// ===== LOCAL DATA STORAGE (when Supabase is not configured) =====
const DATA_FILE = join(ROOT, 'data', 'projects.json')

function loadData() {
  if (!existsSync(DATA_FILE)) return { projects: [], scenes: {}, audioTracks: [] }
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function saveData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// Projects CRUD
app.get('/api/projects', (_req, res) => {
  const data = loadData()
  res.json(data.projects)
})

app.post('/api/projects', (req, res) => {
  const data = loadData()
  const project = {
    id: crypto.randomUUID(),
    title: req.body.title || 'Untitled Project',
    description: req.body.description || '',
    userId: req.body.userId || 'local',
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.projects.push(project)
  saveData(data)
  res.json(project)
})

app.put('/api/projects/:id', (req, res) => {
  const data = loadData()
  const idx = data.projects.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.projects[idx] = { ...data.projects[idx], ...req.body, updatedAt: new Date().toISOString() }
  saveData(data)
  res.json(data.projects[idx])
})

app.delete('/api/projects/:id', (req, res) => {
  const data = loadData()
  data.projects = data.projects.filter(p => p.id !== req.params.id)
  delete data.scenes[req.params.id]
  saveData(data)
  res.json({ success: true })
})

// Scenes CRUD
app.get('/api/projects/:projectId/scenes', (req, res) => {
  const data = loadData()
  const scenes = data.scenes[req.params.projectId] || []
  res.json(scenes)
})

app.put('/api/projects/:projectId/scenes', (req, res) => {
  const data = loadData()
  data.scenes[req.params.projectId] = req.body.scenes || []
  saveData(data)
  res.json({ success: true })
})

// Audio Tracks CRUD
app.get('/api/audio-tracks', (_req, res) => {
  const data = loadData()
  res.json(data.audioTracks || [])
})

app.get('/api/audio-tracks/:id', (req, res) => {
  const data = loadData()
  const track = (data.audioTracks || []).find(t => t.id === req.params.id)
  if (!track) return res.status(404).json({ error: 'Not found' })
  res.json(track)
})

app.post('/api/audio-tracks', (req, res) => {
  const data = loadData()
  if (!data.audioTracks) data.audioTracks = []
  const track = {
    id: crypto.randomUUID(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.audioTracks.push(track)
  saveData(data)
  res.json(track)
})

app.put('/api/audio-tracks/:id', (req, res) => {
  const data = loadData()
  if (!data.audioTracks) data.audioTracks = []
  const idx = data.audioTracks.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  data.audioTracks[idx] = { ...data.audioTracks[idx], ...req.body, updatedAt: new Date().toISOString() }
  saveData(data)
  res.json(data.audioTracks[idx])
})

app.delete('/api/audio-tracks/:id', (req, res) => {
  const data = loadData()
  if (!data.audioTracks) data.audioTracks = []
  data.audioTracks = data.audioTracks.filter(t => t.id !== req.params.id)
  saveData(data)
  res.json({ success: true })
})

// Save audio file (base64 MP3)
app.post('/api/audio-export', (req, res) => {
  const { audioData, filename } = req.body
  if (!audioData) return res.status(400).json({ error: 'No audio data' })

  const buffer = Buffer.from(audioData, 'base64')
  const fname = filename || `track-${Date.now()}.mp3`
  const filepath = join(ROOT, 'uploads', 'audio-complete', fname)
  writeFileSync(filepath, buffer)
  res.json({ url: `/uploads/audio-complete/${fname}` })
})

app.listen(PORT, () => {
  console.log(`[HazeEngine Server] Running on http://localhost:${PORT}`)
  console.log(`[HazeEngine Server] Uploads: ${join(ROOT, 'uploads')}`)
  console.log(`[HazeEngine Server] Data: ${DATA_FILE}`)
})
