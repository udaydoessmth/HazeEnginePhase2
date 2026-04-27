import * as Tone from 'tone'

/**
 * Render the current DAW patterns to a WAV audio buffer using Tone.Offline,
 * then encode to MP3 using lamejs and return as a Blob.
 */
export async function renderToWav(patterns, instruments, tempo, durationBars = 4) {
  const duration = (60 / tempo) * 4 * durationBars // seconds for N bars at 4/4

  const buffer = await Tone.Offline(({ transport }) => {
    transport.bpm.value = tempo

    // Create offline synths for each channel
    const synths = {}
    const destination = Tone.getDestination()

    // Lead
    synths.lead = createOfflineSynth(instruments.lead || 'synth', destination)
    // Bass
    synths.bass = createOfflineSynth(instruments.bass || 'fmSynth', destination)
    // Extra
    synths.extra = createOfflineSynth(instruments.extra || 'polySynth', destination)
    // Drums
    synths.drums = {
      kick: new Tone.MembraneSynth({ envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 } }).toDestination(),
      snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 } }).toDestination(),
      hihat: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 }, volume: -6 }).toDestination(),
      rimshot: new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.1, release: 0.05 }, harmonicity: 5.1, modulationIndex: 16, resonance: 2000, octaves: 1.5, volume: -12 }).toDestination(),
    }

    // Schedule all notes
    const stepDuration = Tone.Time('16n').toSeconds()

    Object.keys(patterns).forEach(channel => {
      const pattern = patterns[channel]
      if (!pattern?.grid) return

      for (let bar = 0; bar < durationBars; bar++) {
        Object.keys(pattern.grid).forEach(row => {
          pattern.grid[row].forEach((active, step) => {
            if (!active) return
            const time = (bar * 16 + step) * stepDuration

            if (channel === 'drums') {
              try {
                if (row === 'kick') synths.drums.kick.triggerAttackRelease('C1', '8n', time)
                else if (row === 'rimshot') synths.drums.rimshot.triggerAttackRelease('16n', time)
                else synths.drums[row]?.triggerAttackRelease('16n', time)
              } catch { /* ignore */ }
            } else {
              try {
                synths[channel]?.triggerAttackRelease(row, '16n', time)
              } catch { /* ignore */ }
            }
          })
        })
      }
    })

    transport.start()
  }, duration)

  return buffer
}

function createOfflineSynth(type, dest) {
  switch (type) {
    case 'synth':
      return new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 } }).toDestination()
    case 'squareSynth':
      return new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.3 } }).toDestination()
    case 'triangleSynth':
      return new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination()
    case 'fmSynth':
      return new Tone.FMSynth({ harmonicity: 2, modulationIndex: 3 }).toDestination()
    case 'monoSynth':
      return new Tone.MonoSynth({ oscillator: { type: 'square' }, filter: { Q: 3 } }).toDestination()
    case 'polySynth':
      return new Tone.PolySynth(Tone.Synth, { maxPolyphony: 6, oscillator: { type: 'triangle' } }).toDestination()
    case 'amSynth':
      return new Tone.AMSynth().toDestination()
    default:
      return new Tone.Synth().toDestination()
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const headerSize = 44
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  let offset = 44
  const channels = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Export patterns as WAV file (download)
 */
export async function exportToWav(patterns, instruments, tempo) {
  const buffer = await renderToWav(patterns, instruments, tempo)
  const wavBlob = audioBufferToWav(buffer)

  const url = URL.createObjectURL(wavBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `haze-track-${Date.now()}.wav`
  a.click()
  URL.revokeObjectURL(url)

  return wavBlob
}

/**
 * Export patterns and upload to server
 */
export async function exportAndUpload(patterns, instruments, tempo, trackTitle) {
  const buffer = await renderToWav(patterns, instruments, tempo)
  const wavBlob = audioBufferToWav(buffer)

  // Upload the WAV directly (MP3 encoding removed for simplicity — WAV works fine for playback)
  const formData = new FormData()
  formData.append('file', wavBlob, `${trackTitle || 'track'}-${Date.now()}.wav`)

  const res = await fetch('/api/upload/audio-complete', {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  return data.url
}
