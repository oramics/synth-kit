// # MonoSynth
import { connectWith, connect } from "../core"
import VCO from "../kit/vco"
import VCA from "../kit/vca"
import VCF from "../kit/vcf"

// A MonoSynth is a basic subtractive synth with one oscillator

/**
 * Create a MonoSynth
 * @param {AudioContext} context
 * @param {Object} [config]
 */
export function MonoSynth (ac, state) {
  if (!state) state = MonoSynth.defaults
  else state = Object.assign({}, MonoSynth.defaults, state)

  // Create the synth
  const synth = {
    state,
    oscillator: VCO(ac, state.oscillator),
    filter: VCF(ac, state.filter),
    amp: VCA(ac, state, state.envelope),
  }
  connect(synth.oscillator, synth.filter, synth.amp)

  // Synth API
  synth.connect = connectWith(synth.amp, synth)
  synth.trigger = (freq, time, dur) => {
    time = time || ac.currentTime
    if (freq) synth.oscillator.frequency.setValueAtTime(freq, time)
    synth.amp.trigger(time, dur)
  }
  return synth
}
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  filter: {
    type: "lowpass",
    frequency: 4000,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3,
  },
  gain: 0.5
}

export default MonoSynth
