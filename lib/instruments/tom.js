// # Tom
import { instrument, withDefaults } from "../synth"
import Osc from "../kit/osc"
import Pulse from "../kit/pulse"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

export default function Tom (ac, config) {
  const state = withDefaults(config, Tom.defaults)
  const tom = instrument({
    oscillator: [ Osc(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "amp" ],
    pulse: [ Pulse(ac), "amp" ],
    amp: [ Gain(ac), "output" ],
  }).update(state)

  tom.trigger = (time) => {
    tom.pulse.trigger(time)
    tom.envelope.trigger(time)
  }
  return tom
}
Tom.defaults = {
  oscillator: {
    frequency: 165
  },
  pulse: {
    gain: 0.1,
  },
  envelope: {
    decay: 0.31
  },
  amp: {
    gain: 1
  },
}
