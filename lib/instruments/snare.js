import { connect, connectWith } from "../core"
import Noise from "../kit/noise"
import VCA from "../kit/vca"

export function Snare (ac, state) {
  state = Object.assign({}, Snare.state, state)
  const snare = {
    state,
    noise: Noise(ac, state.noise),
    amp: VCA(ac, state.amp)
  }
  connect(snare.noise, snare.amp)

  // API
  snare.connect = connectWith(snare.amp, snare)
  snare.trigger = snare.amp.trigger

  return snare
}
Snare.state = {
  noise: {
    type: "white"
  },
  amp: {
    gain: 0.3,
    envelope: {
      attack: 0.01,
      hold: 0.1,
      release: 0.1
    }
  }
}

export default Snare
