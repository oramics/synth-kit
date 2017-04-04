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

  // ## Architecture
  const synth = instrument(ac, {
    // One modulated oscillator
    oscillator: [ VCO, "vcf" ],
    // One filter with envelope
    vcf: [ VCF, "envelope" ],
    // One gain envelope
    envelope: [ GainEnvelope, "amp" ],
    // The outut
    amp: [ VCA, "output" ]
  }).update(state)

  // ## API
  synth.trigger = (freq, time, dur) => {
    time = time || ac.currentTime
    if (freq) {
      synth.oscillator.frequency.setValueAtTime(freq, time)
      synth.vcf.frequency.setValueAtTime(freq / 2, time)
    }
    synth.vcf.trigger(time, dur)
    synth.envelope.trigger(time, dur)
  }
  return synth
}

// # Default configuration
MonoSynth.defaults = {
  oscillator: {
    type: "sawtooth"
  },
  vcf: {
    type: "lowpass",
    Q: 2,
    attack: 0.1,
    octaves: 2,
    decay: 1,
  },
  envelope: {
    attack: 0.1,
    decay: 0.5,
    sustain: 0.8,
    release: 2,
  },
  amp: {
    gain: 0.5
  }
}

export default MonoSynth
