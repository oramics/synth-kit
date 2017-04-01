import { instrument } from "../synth"
import Osc from "../kit/osc"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

export function Kick (ac, state) {
  state = Object.assign({}, Kick.defaults, state)
  const kick = instrument({
    oscillator: [ Osc(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "amp" ],
    amp: [ Gain(ac), "output" ]
  }).update(state)

  kick.trigger = (time) => {
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
    decay: 0.2
  },
  amp: {
    gain: 1,
  }
}

export default Kick
