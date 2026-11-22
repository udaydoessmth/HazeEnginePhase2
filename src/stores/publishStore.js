/**
 * publishStore.js
 * Handles all publish/unpublish operations for projects and audio tracks.
 * Works with Supabase (primary) and falls back to Express server for local mode.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ── helpers ────────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) return { ok: false, data: null }
    return { ok: true, data: await res.json() }
  } catch {
    return { ok: false, data: null }
  }
}

// Upload a cover image (file object) and return its URL.
// Tries Supabase Storage first, then Express server /api/upload/images.
export async function uploadCoverImage(file) {
  if (!file) return null

  if (isSupabaseConfigured()) {
    try {
      const ext = file.name.split('.').pop()
      const path = `covers/${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`
      const { data, error } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: false })
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
        return publicUrl
      }
    } catch { /* fall through */ }
  }

  // Express server fallback
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload/images', { method: 'POST', body: formData })
    if (res.ok) {
      const json = await res.json()
      return json.url
    }
  } catch { /* fall through */ }

  // Last resort: base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Visual Novel Publishing ────────────────────────────────────────────────

/**
 * Publish a visual novel project.
 * Writes: title, description, cover_image, genre, visibility, is_published, published_at, creator_name.
 * Returns the updated project row or null on failure.
 */
export async function publishProject(projectId, { title, description, coverImageUrl, genre, visibility, creatorName }) {
  const patch = {
    title,
    description: description || '',
    cover_image: coverImageUrl || null,
    genre: genre || null,
    visibility: visibility || 'public',
    is_published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(creatorName ? { creator_name: creatorName } : {}),
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', projectId)
      .select()
      .single()
    if (error) { console.error('[publish] project publish error:', error.message); return null }
    return data
  }

  const { ok, data } = await apiFetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return ok ? data : null
}

/**
 * Unpublish a visual novel project (hides from Explore, shareable URL stops working).
 */
export async function unpublishProject(projectId) {
  const patch = { is_published: false, updated_at: new Date().toISOString() }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .update(patch)
      .eq('id', projectId)
      .select()
      .single()
    if (error) { console.error('[publish] project unpublish error:', error.message); return null }
    return data
  }

  const { ok, data } = await apiFetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return ok ? data : null
}

/**
 * Fetch all public (is_published=true, visibility='public') published visual novels.
 * Used by the Explore page.
 */
export async function fetchPublicGames(searchQuery = '') {
  if (isSupabaseConfigured()) {
    let q = supabase
      .from('projects')
      .select('id, title, description, cover_image, genre, visibility, published_at, user_id, creator_name')
      .eq('is_published', true)
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })

    if (searchQuery.trim()) {
      q = q.ilike('title', `%${searchQuery.trim()}%`)
    }

    const { data, error } = await q
    if (error) { console.error('[publish] fetchPublicGames error:', error.message); return [] }
    return data || []
  }

  const { ok, data } = await apiFetch('/api/publish/games')
  if (!ok) return []
  let games = data || []
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    games = games.filter(g => g.title?.toLowerCase().includes(q))
  }
  return games
}

/**
 * Fetch the creator's display name for a user_id.
 * Returns null if not found (caller should omit the "by" label).
 */
export async function fetchCreatorName(userId) {
  if (!userId || !isSupabaseConfigured()) return null
  try {
    // Try profiles table first
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()
    if (!error && data?.username) return data.username
  } catch { /* profiles table may not exist */ }

  // Fallback: try auth.users email via admin (not available with anon key)
  // Return null — caller will omit the creator line
  return null
}

/**
 * Fetch a single published project by ID (for the public play page).
 * Returns null if not found or not published.
 */
export async function fetchPublishedProject(projectId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, cover_image, genre, visibility, is_published, published_at, user_id, creator_name')
      .eq('id', projectId)
      .maybeSingle()
    if (error || !data) return null
    if (!data.is_published) return null
    return data
  }

  const { ok, data } = await apiFetch(`/api/projects/${projectId}/publish-info`)
  return ok ? data : null
}

// ── Music Publishing ───────────────────────────────────────────────────────

/**
 * Publish a music track.
 * Exports audio, uploads the file, then writes publication metadata.
 * Returns the saved track row or null.
 */
export async function publishTrack(trackId, { title, description, coverImageUrl, genre, visibility, audioBlob, creatorName }) {
  // 1. Upload the audio blob
  let audioUrl = null
  if (audioBlob) {
    if (isSupabaseConfigured()) {
      try {
        const path = `audio/${Date.now()}-${Math.round(Math.random() * 1e9)}.wav`
        const { data, error } = await supabase.storage
          .from('audio')
          .upload(path, audioBlob, { contentType: 'audio/wav', upsert: false })
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(path)
          audioUrl = publicUrl
        }
      } catch { /* fall through to Express */ }
    }

    if (!audioUrl) {
      // Express server fallback
      try {
        const formData = new FormData()
        formData.append('file', audioBlob, `track-${Date.now()}.wav`)
        const res = await fetch('/api/upload/audio-complete', { method: 'POST', body: formData })
        if (res.ok) {
          const json = await res.json()
          audioUrl = json.url
        }
      } catch { /* ignore */ }
    }
  }

  // 2. Write publish metadata
  const patch = {
    title: title || 'Untitled Track',
    description: description || '',
    cover_image: coverImageUrl || null,
    genre: genre || null,
    visibility: visibility || 'public',
    is_published: true,
    published_at: new Date().toISOString(),
    audio_url: audioUrl || null,
    updated_at: new Date().toISOString(),
    ...(creatorName ? { creator_name: creatorName } : {}),
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audio_tracks')
      .update(patch)
      .eq('id', trackId)
      .select()
      .single()
    if (error) { console.error('[publish] track publish error:', error.message); return null }
    return data
  }

  const { ok, data } = await apiFetch(`/api/audio-tracks/${trackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return ok ? data : null
}

/**
 * Unpublish a music track.
 */
export async function unpublishTrack(trackId) {
  const patch = { is_published: false, updated_at: new Date().toISOString() }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audio_tracks')
      .update(patch)
      .eq('id', trackId)
      .select()
      .single()
    if (error) { console.error('[publish] track unpublish error:', error.message); return null }
    return data
  }

  const { ok, data } = await apiFetch(`/api/audio-tracks/${trackId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return ok ? data : null
}

/**
 * Fetch all public published music tracks.
 * Used by the Explore page.
 */
export async function fetchPublicMusic(searchQuery = '') {
  if (isSupabaseConfigured()) {
    let q = supabase
      .from('audio_tracks')
      .select('id, title, description, cover_image, genre, visibility, published_at, user_id, audio_url, creator_name')
      .eq('is_published', true)
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })

    if (searchQuery.trim()) {
      q = q.ilike('title', `%${searchQuery.trim()}%`)
    }

    const { data, error } = await q
    if (error) { console.error('[publish] fetchPublicMusic error:', error.message); return [] }
    return data || []
  }

  const { ok, data } = await apiFetch('/api/publish/music')
  if (!ok) return []
  let tracks = data || []
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    tracks = tracks.filter(t => t.title?.toLowerCase().includes(q))
  }
  return tracks
}

/**
 * Fetch a single published track by ID (for the public music page).
 */
export async function fetchPublishedTrack(trackId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audio_tracks')
      .select('id, title, description, cover_image, genre, visibility, is_published, published_at, user_id, audio_url, creator_name')
      .eq('id', trackId)
      .maybeSingle()
    if (error || !data || !data.is_published) return null
    return data
  }

  const { ok, data } = await apiFetch(`/api/audio-tracks/${trackId}`)
  if (!ok || !data?.is_published) return null
  return data
}

// ── My Publications ────────────────────────────────────────────────────────

/**
 * Fetch all published projects owned by the current user.
 */
export async function fetchMyGames(userId) {
  if (!userId) return []

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, cover_image, genre, visibility, is_published, published_at, updated_at')
      .eq('user_id', userId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    if (error) { console.error('[publish] fetchMyGames error:', error.message); return [] }
    return data || []
  }

  const { ok, data } = await apiFetch('/api/projects')
  if (!ok) return []
  return (data || []).filter(p => p.isPublished || p.is_published)
}

/**
 * Fetch all published tracks owned by the current user.
 */
export async function fetchMyMusic(userId) {
  if (!userId) return []

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('audio_tracks')
      .select('id, title, description, cover_image, genre, visibility, is_published, published_at, audio_url, updated_at')
      .eq('user_id', userId)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
    if (error) { console.error('[publish] fetchMyMusic error:', error.message); return [] }
    return data || []
  }

  const { ok, data } = await apiFetch('/api/audio-tracks')
  if (!ok) return []
  return (data || []).filter(t => t.isPublished || t.is_published)
}
