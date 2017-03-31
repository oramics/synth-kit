import { connect, connectWith } from "../core"
import VCO from "../kit/vco"
import VCA from "../kit/vca"

export function Kick (ac, state) {
  state = Object.assign({}, Kick.state, state)
  const kick = {
    oscillator: VCO(ac, state.oscillator),
    amp: VCA(ac, state.amp)
  }
  connect(kick.oscillator, kick.amp)

  // API
  kick.state = state
  kick.connect = connectWith(kick.amp, kick)
  kick.trigger = kick.amp.trigger

  return kick
}
Kick.state = {
  oscillator: {
    type: "sine",
    frequency: 48
  },
  amp: {
    gain: 1,
    envelope: {
      attack: 0.01,
      hold: 0.1,
      release: 0.1
    }
  }
}

export default Kick
