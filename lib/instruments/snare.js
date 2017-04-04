// # Snare
import { instrument } from "../synth"
import Osc from "../kit/osc"
import Noise from "../kit/noise"
import Filter from "../kit/filter"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

// A snare modeled after the 808 design

/**
 * Create the Snare
 */
export function Snare (ac, state) {
  state = Object.assign({}, Snare.defaults, state)
  // # Architecture
  // <img alt="808 snare" src="http://media.soundonsound.com/sos/apr02/images/synth9_10.gif" style="width: 100%;" />
  const snare = instrument(ac, {
    // The _snappy_ oscillators
    osc1: [Osc, "oscEnv"],
    osc2: [Osc, "oscEnv"],
    // The AD envelope for the oscillators
    oscEnv: [GainEnvelope, "amp"],
    // White noise generator
    noise: [Noise, "noiseFilter"],
    // The noise filter
    noiseFilter: [Filter, "noiseEnv"],
    // The AD envelope for the noise
    noiseEnv: [GainEnvelope, "amp"],
    // Output
    amp: [Gain, "output"],
  }).update(state)

  snare.trigger = (time) => {
    snare.oscEnv.trigger(time)
    snare.noiseEnv.trigger(time)
  }

  return snare
}

Snare.defaults = {
  osc1: {
    type: "sine",
    frequency: 238,
  },
  osc2: {
    type: "sine",
    frequency: 476,
  },
  oscEnv: {
    peak: 0.4,
    attack: 0.01,
    decay: 0.1,
  },
  noise: {
    type: "white",
  },
  noiseFilter: {
    type: "highpass",
    frequency: 4000,
  },
  noiseEnv: {
    attack: 0.01,
    decay: 0.08,
  },
  amp: {
    gain: 0.5,
  },
}

export default Snare
