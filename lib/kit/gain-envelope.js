import { triggerAdsr } from "../synth"
import Gain from "./gain"

const SILENCE = { gain: 0 }
/**
 * Create a Gain envelope. Any audio source can be connected to an
 * audio envelope.
 *
 * @example
 * const [osc, adsr] = connect(Osc(ac), GainEnvelope(ac))
 * adsr.trigger()
 */
export default function GainEnvelope (ac, state) {
  const env = Gain(ac, SILENCE)
  state = Object.assign({}, GainEnvelope.defaultState, state)

  env.update = (newState) => {
    state = Object.assign(state, newState)
    return env
  }
  env.inspect = () => state

  env.trigger = function (time, dur) {
    if (!time) time = ac.currentTime
    const release = triggerAdsr(time, env.gain, state)
    if (dur) release(time + dur)
    return release
  }
  return env
}

GainEnvelope.params = [
  "base",
  "peak",
  "attack",
  "decay",
  "sustain",
  "release",
]

// default values
GainEnvelope.defaultState = {
  peak: 1,
  attack: 0.01,
  decay: 0.2,
}
