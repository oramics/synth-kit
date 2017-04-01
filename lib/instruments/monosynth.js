// # MonoSynth
import { instrument } from "../synth"
import VCO from "../kit/vco"
import VCF from "../kit/vcf"
import GainEnvelope from "../kit/gain-envelope"
import VCA from "../kit/vca"

// A MonoSynth is a basic subtractive synth with one oscillator

/**
 * Create a MonoSynth
 * @param {AudioContext} context
 * @param {Object} [config]
 */
export function MonoSynth (ac, state) {
  state = Object.assign({}, MonoSynth.defaults, state)
  const synth = instrument({
    oscillator: [ VCO(ac), "filter" ],
    filter: [ VCF(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "amp" ],
    amp: [ VCA(ac), "output" ]
  }).update(state)

  synth.trigger = (freq, time, dur) => {
    time = time || ac.currentTime
    if (freq) synth.oscillator.frequency.setValueAtTime(freq, time)
    synth.envelope.trigger(time, dur)
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
  amp: {
    gain: 0.5
  }
}

export default MonoSynth
