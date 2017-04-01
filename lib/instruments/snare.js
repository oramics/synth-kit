import { instrument } from "../synth"
import Noise from "../kit/noise"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

export function Snare (ac, state) {
  state = Object.assign({}, Snare.defaults, state)
  const snare = instrument({
    noise: [ Noise(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "amp" ],
    amp: [ Gain(ac), "output" ]
  }).update(state)

  snare.trigger = snare.envelope.trigger

  return snare
}

Snare.defaults = {
  noise: {
    type: "white"
  },
  envelope: {
    attack: 0.01,
    release: 0.1
  },
  amp: {
    gain: 0.1,
  }
}

export default Snare
