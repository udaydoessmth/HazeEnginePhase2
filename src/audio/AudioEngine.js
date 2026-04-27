import * as Tone from 'tone'

class AudioEngine {
  constructor() {
    this.isInitialized = false
    this.synths = {}
    this.sequences = {}
    this.channelGains = {}
    this.masterGain = null
    this.onStepCallback = null
  }

  async init() {
    if (this.isInitialized) return
    await Tone.start()

    // Master gain
    this.masterGain = new Tone.Gain(0.8).toDestination()

    // Per-channel gains
    const channels = ['lead', 'bass', 'extra', 'drums']
    channels.forEach(ch => {
      this.channelGains[ch] = new Tone.Gain(0.7).connect(this.masterGain)
    })

    // Default instruments
    this.createSynth('lead', 'synth')
    this.createSynth('bass', 'fmSynth')
    this.createSynth('extra', 'polySynth')
    this.createDrumSynths()

    this.isInitialized = true
  }

  createSynth(channel, type) {
    // Dispose old synth
    if (this.synths[channel] && typeof this.synths[channel].dispose === 'function') {
      this.synths[channel].dispose()
    }

    const gain = this.channelGains[channel]
    let synth

    switch (type) {
      case 'synth':
        synth = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 },
        }).connect(gain)
        break
      case 'squareSynth':
        synth = new Tone.Synth({
          oscillator: { type: 'square' },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.3 },
        }).connect(gain)
        break
      case 'triangleSynth':
        synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.5 },
        }).connect(gain)
        break
      case 'fmSynth':
        synth = new Tone.FMSynth({
          harmonicity: 2,
          modulationIndex: 3,
          envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.3 },
        }).connect(gain)
        break
      case 'monoSynth':
        synth = new Tone.MonoSynth({
          oscillator: { type: 'square' },
          filter: { Q: 3, type: 'lowpass', rolloff: -24 },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
          filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 200, octaves: 3 },
        }).connect(gain)
        break
      case 'polySynth':
        synth = new Tone.PolySynth(Tone.Synth, {
          maxPolyphony: 6,
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.8 },
        }).connect(gain)
        break
      case 'amSynth':
        synth = new Tone.AMSynth({
          envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.6 },
        }).connect(gain)
        break
      default:
        synth = new Tone.Synth().connect(gain)
    }

    this.synths[channel] = synth
    return synth
  }

  createDrumSynths() {
    const gain = this.channelGains['drums']

    this.synths['drums'] = {
      kick: new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.3 },
      }).connect(gain),
      snare: new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
      }).connect(gain),
      hihat: new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
        volume: -6,
      }).connect(gain),
      rimshot: new Tone.MetalSynth({
        frequency: 400,
        envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
        harmonicity: 5.1,
        modulationIndex: 16,
        resonance: 2000,
        octaves: 1.5,
        volume: -12,
      }).connect(gain),
    }
  }

  // Play a note on a melodic channel
  triggerNote(channel, note, time, duration = '16n') {
    const synth = this.synths[channel]
    if (!synth) return
    try {
      synth.triggerAttackRelease(note, duration, time)
    } catch {
      // Ignore errors for overlapping notes
    }
  }

  // Play a drum hit
  triggerDrum(drumType, time) {
    const drums = this.synths['drums']
    if (!drums || !drums[drumType]) return
    try {
      if (drumType === 'kick') {
        drums.kick.triggerAttackRelease('C1', '8n', time)
      } else if (drumType === 'rimshot') {
        drums.rimshot.triggerAttackRelease('16n', time)
      } else {
        drums[drumType].triggerAttackRelease('16n', time)
      }
    } catch {
      // Ignore
    }
  }

  // Start sequencer playback
  startPlayback(patterns, tempo, isLooping, onStep) {
    this.stopPlayback()

    Tone.getTransport().bpm.value = tempo
    Tone.getTransport().loop = isLooping
    Tone.getTransport().loopStart = 0
    Tone.getTransport().loopEnd = '1m'

    this.onStepCallback = onStep

    // Create sequences for each channel
    const stepIndices = Array.from({ length: 16 }, (_, i) => i)

    const patternsRef = { current: patterns }
    this._patternsRef = patternsRef

    this.sequences['main'] = new Tone.Sequence(
      (time, step) => {
        const currentPatterns = this._patternsRef.current

        // Trigger notes for each channel
        Object.keys(currentPatterns).forEach(channel => {
          const pattern = currentPatterns[channel]
          if (!pattern?.grid) return

          Object.keys(pattern.grid).forEach(row => {
            if (pattern.grid[row][step]) {
              if (channel === 'drums') {
                this.triggerDrum(row, time)
              } else {
                this.triggerNote(channel, row, time)
              }
            }
          })
        })

        // Visual callback (on the main thread via Draw)
        Tone.getDraw().schedule(() => {
          if (this.onStepCallback) this.onStepCallback(step)
        }, time)
      },
      stepIndices,
      '16n'
    )

    this.sequences['main'].start(0)
    Tone.getTransport().start()
  }

  // Update patterns during playback
  updatePatterns(patterns) {
    if (this._patternsRef) {
      this._patternsRef.current = patterns
    }
  }

  stopPlayback() {
    Tone.getTransport().stop()
    Object.values(this.sequences).forEach(seq => {
      seq.dispose()
    })
    this.sequences = {}
    this.onStepCallback = null
  }

  setTempo(bpm) {
    Tone.getTransport().bpm.value = bpm
  }

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.value = vol
    }
  }

  changeInstrument(channel, type) {
    if (channel === 'drums') {
      this.createDrumSynths()
    } else {
      this.createSynth(channel, type)
    }
  }

  dispose() {
    this.stopPlayback()
    Object.entries(this.synths).forEach(([key, synth]) => {
      if (key === 'drums') {
        Object.values(synth).forEach(s => s?.dispose?.())
      } else {
        synth?.dispose?.()
      }
    })
    Object.values(this.channelGains).forEach(g => g?.dispose?.())
    this.masterGain?.dispose?.()
    this.synths = {}
    this.channelGains = {}
    this.isInitialized = false
  }
}

// Singleton instance
const audioEngine = new AudioEngine()
export default audioEngine
