import Gain from "./gain"

/**
 * Create a Gain envelope. Any audio source can be connected to an
 * audio envelope.
 *
 * @example
 * const [osc, adsr] = connect(Osc(ac), GainEnvelope(ac))
 * adsr.trigger()
 */
export default function GainEnvelope (ac, state) {
  const env = Gain(ac)
  env.state = Object.assign({}, GainEnvelope.state, state)

  /**
   * Trigger the envelope. It triggers the attack phase of the envelope
   * at a given time and the release phase if a duration is given.
   * @param {Number} [when=now]
   * @param {Number} [duration]
   * @return {GainEnvelope} this
   */
  env.trigger = function (time, dur) {
    if (!time) time = ac.currentTime
    console.log("trigger env", time, dur, env.state)
    const release = triggerAdsr(time, env.gain, env.state)
    if (dur) release(time + dur)
    return release
  }
  return env
}
GainEnvelope.state = {
  attack: 0.01,
  release: 0.2
}

export function triggerAdsr (time, param, adsr) {
  param.cancelScheduledValues(0)
  // attack phase
  const attack = adsr.attack || 0.01
  param.setValueAtTime(0, time)
  time += attack
  param.linearRampToValueAtTime(1, time)

  // decay-sustain phase
  const sustain = adsr.sustain || 1
  if (sustain !== 1) {
    time += (adsr.decay || 0.01)
    param.exponentialRampToValueAtTime(sustain, time)
  }

  const release = time => {
    param.exponentialRampToValueAtTime(0.00001, time - 0.01)
    param.setValueAtTime(0, time)
  }

  // only trigger release if hold is defined
  if (adsr.hold !== undefined) {
    time += (adsr.hold || 0)
    param.setValueAtTime(sustain, time)
    release(time + (adsr.release || 0.1))
  }

  return release
}
