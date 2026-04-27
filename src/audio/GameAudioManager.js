import * as Tone from 'tone'

class GameAudioManager {
  constructor() {
    this.player = null
    this.currentTrackUrl = null
    this.isInitialized = false
    this.volume = 0.7
    this.gainNode = null
    this.crossfadeDuration = 1.5
  }

  async init() {
    if (this.isInitialized) return
    await Tone.start()
    this.gainNode = new Tone.Gain(this.volume).toDestination()
    this.isInitialized = true
  }

  async playTrack(url) {
    if (!url) return
    await this.init()

    // Same track already playing
    if (this.currentTrackUrl === url && this.player?.state === 'started') {
      return
    }

    // Crossfade if switching tracks
    if (this.player && this.player.state === 'started') {
      await this.crossfadeTo(url)
      return
    }

    // Fresh play
    await this.loadAndPlay(url)
  }

  async loadAndPlay(url) {
    this.dispose()

    try {
      this.player = new Tone.Player({
        url,
        loop: true,
        fadeIn: 0.3,
        fadeOut: 0.3,
        onload: () => {
          if (this.player && this.gainNode) {
            this.player.connect(this.gainNode)
            this.player.start()
          }
        },
        onerror: (err) => {
          console.warn('[GameAudioManager] Failed to load audio:', err)
        },
      })
      this.currentTrackUrl = url
    } catch (err) {
      console.warn('[GameAudioManager] Error creating player:', err)
    }
  }

  async crossfadeTo(newUrl) {
    const oldPlayer = this.player
    const oldGain = this.gainNode

    // Create new gain for crossfade
    const newGain = new Tone.Gain(0).toDestination()

    try {
      const newPlayer = new Tone.Player({
        url: newUrl,
        loop: true,
        onload: () => {
          newPlayer.connect(newGain)
          newPlayer.start()

          // Fade in new
          newGain.gain.rampTo(this.volume, this.crossfadeDuration)

          // Fade out old
          if (oldGain) {
            oldGain.gain.rampTo(0, this.crossfadeDuration)
          }

          // Cleanup old after crossfade
          setTimeout(() => {
            oldPlayer?.stop()
            oldPlayer?.dispose()
            oldGain?.dispose()
          }, this.crossfadeDuration * 1000 + 200)

          this.player = newPlayer
          this.gainNode = newGain
          this.currentTrackUrl = newUrl
        },
      })
    } catch (err) {
      console.warn('[GameAudioManager] Crossfade error:', err)
    }
  }

  stop() {
    if (this.player && this.player.state === 'started') {
      this.player.stop()
    }
  }

  pause() {
    // Tone.Player doesn't have pause — stop and track position
    this.stop()
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.gainNode) {
      this.gainNode.gain.rampTo(this.volume, 0.1)
    }
  }

  dispose() {
    if (this.player) {
      try {
        this.player.stop()
        this.player.dispose()
      } catch { /* ignore */ }
      this.player = null
    }
    this.currentTrackUrl = null
  }

  destroy() {
    this.dispose()
    if (this.gainNode) {
      this.gainNode.dispose()
      this.gainNode = null
    }
    this.isInitialized = false
  }
}

const gameAudioManager = new GameAudioManager()
export default gameAudioManager
