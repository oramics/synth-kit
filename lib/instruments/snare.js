import { instrument } from "../synth"
import Osc from "../kit/osc"
import Noise from "../kit/noise"
import Gain from "../kit/gain"
import GainEnvelope from "../kit/gain-envelope"

export function Snare (ac, state) {
  state = Object.assign({}, Snare.defaults, state)
  const snare = instrument(ac, {
    osc1: [ Osc, "oscEnv" ],
    osc2: [ Osc, "oscEnv" ],
    oscEnv: [ GainEnvelope, "amp" ],
    noise: [ Noise, "noiseEnv" ],
    noiseEnv: [ GainEnvelope, "amp" ],
    amp: [ Gain, "output" ]
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
    gain: 0.5,
    attack: 0.01,
    release: 0.4,
  },
  noise: {
    type: "white",
  },
  noiseEnv: {
    attack: 0.01,
    decay: 0.1,
  },
  amp: {
    gain: 0.5,
  },
}

export default Snare
