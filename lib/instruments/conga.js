// # Conga
import { instrument, withDefaults } from "../synth"
import Osc from "../kit/osc"
import Pulse from "../kit/pulse"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

/**
 * Create a Conga
 */
export default function Conga (ac, config) {
  const state = withDefaults(config, Conga.defaults)
  const conga = instrument(ac, {
    oscillator: [ Osc, "envelope" ],
    envelope: [ GainEnvelope, "amp" ],
    pulse: [ Pulse, "amp" ],
    amp: [ Gain, "output" ],
  }).update(state)

  conga.trigger = conga.envelope.trigger

  return conga
}
Conga.defaults = {
  oscillator: {
    frequency: 310
  },
  pulse: {
    gain: 0.8,
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 0.4
  },
}
