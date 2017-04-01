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
    console.log("trigger env", time, dur, state)
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
  gain: 1,
  attack: 0.01,
  decay: 0.2,
}

export function triggerAdsr (time, param, adsr) {
  console.log("trigger", time, adsr)
  param.cancelScheduledValues(0)

  // attack phase
  const attack = adsr.attack || 0.01
  const peak = adsr.gain || 1
  param.setValueAtTime(0, time)
  time += attack
  param.linearRampToValueAtTime(peak, time)

  // decay phase
  const decay = adsr.decay || 0.01
  const sustain = adsr.sustain || 0
  console.log("DECAY", decay, sustain)
  time += decay
  param.linearRampToValueAtTime(sustain, time)

  // hold phase
  const hold = adsr.hold || 0
  if (hold) {
    time += hold
    param.setValueAtTime(sustain, time)
  }

  const release = time => {
    const release = adsr.release || 0
    time += release
    param.exponentialRampToValueAtTime(0.00001, time)
  }

  // trigger release if hold is specified
  if (sustain && hold) {
    release(time)
  }

  return release
}
