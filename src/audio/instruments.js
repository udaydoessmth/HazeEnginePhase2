export const INSTRUMENT_PRESETS = {
  lead: [
    { id: 'synth', name: 'Sawtooth Lead' },
    { id: 'squareSynth', name: 'Square Lead' },
    { id: 'triangleSynth', name: 'Triangle Lead' },
    { id: 'amSynth', name: 'AM Synth' },
  ],
  bass: [
    { id: 'fmSynth', name: 'FM Bass' },
    { id: 'monoSynth', name: 'Mono Bass' },
    { id: 'synth', name: 'Simple Bass' },
  ],
  extra: [
    { id: 'polySynth', name: 'Poly Pad' },
    { id: 'amSynth', name: 'AM Pad' },
    { id: 'fmSynth', name: 'FM Pad' },
  ],
  drums: [
    { id: 'drums', name: 'Standard Kit' },
  ],
}

export const CHANNEL_INFO = {
  lead: { label: 'Lead', shortLabel: 'L', description: 'Melody line' },
  bass: { label: 'Bass', shortLabel: 'B', description: 'Bass line' },
  extra: { label: 'Extra', shortLabel: 'E', description: 'Chords & pads' },
  drums: { label: 'Drums', shortLabel: 'D', description: 'Percussion' },
}

export const SCALES_INFO = {
  major: { name: 'Major', mood: 'Happy, bright' },
  minor: { name: 'Minor', mood: 'Sad, dark' },
  pentatonic: { name: 'Pentatonic', mood: 'Simple, universal' },
  blues: { name: 'Blues', mood: 'Soulful' },
  chromatic: { name: 'Chromatic', mood: 'All notes' },
}
