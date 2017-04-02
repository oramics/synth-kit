import { instrument } from "../synth"
import Osc from "../kit/osc"
import Gain from "../kit/gain"
import Pulse from "../kit/pulse"
import SoftClipper from "../kit/soft-clipper"
import GainEnvelope from "../kit/gain-envelope"
import VCF from "../kit/vcf"

export function Kick (ac, state) {
  state = Object.assign({}, Kick.defaults, state)
  const kick = instrument({
    oscillator: [ Osc(ac), "envelope" ],
    click: [ Pulse(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "vcf" ],
    vcf: [ VCF(ac), "clipper" ],
    clipper: [ SoftClipper(ac), "amp" ],
    amp: [ Gain(ac), "output" ],
  }).update(state)

  kick.trigger = (time) => {
    kick.click.trigger(time)
    kick.envelope.trigger(time)
  }

  return kick
}

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
