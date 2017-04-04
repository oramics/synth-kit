// # Kick
import { instrument } from "../synth"
import Osc from "../kit/osc"
import Gain from "../kit/gain"
import Pulse from "../kit/pulse"
import SoftClipper from "../kit/soft-clipper"
import GainEnvelope from "../kit/gain-envelope"
import VCF from "../kit/vcf"

// A simple kick instrument

/**
 * Create a Kick
 */
export function Kick (ac, state) {
  state = Object.assign({}, Kick.defaults, state)

  // ## Architecture
  const kick = instrument(ac, {
    // An oscillator
    oscillator: [ Osc, "envelope" ],
    // A pulse trigger (click)
    click: [ Pulse, "envelope" ],
    // The gain envelope
    envelope: [ GainEnvelope, "vcf" ],
    // A filter with envelope
    vcf: [ VCF, "clipper" ],
    // A soft distortion
    clipper: [ SoftClipper, "amp" ],
    // The output amplifier
    amp: [ Gain, "output" ],
  }).update(state)

  kick.trigger = (time) => {
    kick.click.trigger(time)
    kick.envelope.trigger(time)
  }

  return kick
}

// ## Default configuration
Kick.defaults = {
  oscillator: {
    type: "sine",
    frequency: 48,
  },
  envelope: {
    attack: 0.1,
    decay: 0.2,
  },
  vcf: {
    type: "lowpass",
    frequency: 48,
    envelope: {
      base: 48,
      peak: 100,
      attack: 0.001,
      decay: 0.60,
    }
  },
  amp: {
    gain: 1,
  }
}

export default Kick
