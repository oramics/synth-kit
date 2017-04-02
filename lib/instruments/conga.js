// # Conga
import { instrument, withDefaults } from "../synth"
import Osc from "../kit/osc"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

export default function Conga (ac, config) {
  const state = withDefaults(config, Conga.defaults)
  const conga = instrument({
    oscillator: [ Osc(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "amp" ],
    amp: [ Gain(ac), "output" ],
  }).update(state)

  conga.trigger = conga.envelope.trigger

  return conga
}
Conga.defaults = {
  oscillator: {
    frequency: 310
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 0.4
  },
}
