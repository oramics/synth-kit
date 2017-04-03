// # HiHat
import { instrument } from "../synth"
import OscBank from "../kit/osc-bank"
import Filter from "../kit/filter"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

// A HiHat modeled after the 808 design

// **References**
// - Synth secrets: https://github.com/micjamking/synth-secrets/blob/master/part-40.md

const BASE_FQ = 400
const RATIOS = [263, 400, 421, 474, 587, 845].map(f => f / BASE_FQ)

/**
 * Create a HiHat
 */
export function HiHat (ac, state) {
  state = Object.assign({}, HiHat.defaults, state)

  // ## Architecture
  const hihat = instrument(ac, {
    // six square-wave oscillators
    bank: [OscBank(ac, RATIOS, state.bank), "midFilter"],
    // band pass filter
    midFilter: [Filter, "envelope"],
    // AD envelope
    envelope: [GainEnvelope, "hiFilter"],
    // hipass filter
    hiFilter: [Filter, "amp"],
    // amplifier
    amp: [Gain, "output"]
  }).update(state)

  // # API
  // trigger
  hihat.trigger = hihat.envelope.trigger

  console.log(hihat)

  return hihat
}

HiHat.defaults = {
  bank: {
    frequency: BASE_FQ,
    types: ["square"],
    gains: [0.5],
    compensate: false,
  },
  midFilter: {
    type: "bandpass",
    frequency: 10000,
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
  },
  hiFilter: {
    type: "highpass",
    frequency: 8000,
  },
  amp: {
    gain: 0.8,
  },
}

export default HiHat
