import { update } from "./core"
const assign = Object.assign

function createNode (ac, name, initialState, state, params) {
  const node = ac["create" + name].apply(ac, params)
  node.state = assign({}, initialState)
  return state ? update(node, state) : node
}

/**
 * Create an Oscillator
 * A oscillator is always started
 */
export function Osc (ac, state) {
  const osc = createNode(ac, "Oscillator", Osc.state, state)
  const start = state ? state.start : 0
  if (start !== false) osc.start(start || 0)
  return osc
}
Osc.state = {
  type: "sine",
  frequency: 440,
  detune: 0
}

export function Filter (ac, state) {
  return createNode(ac, "BiquadFilter", Filter.state, state)
}
Filter.state = {
  type: "lowpass",
  frequency: 350,
  detune: 0,
  Q: 1,
}

/**
 * Create a Gain node. By default a it's gain value it's 0
 */
export const Gain = (ac, state) => {
  const gain = createNode(ac, "Gain", Gain.state, state)
  if (gain.state.gain === 0) gain.gain.setValueAtTime(0, 0)
  return gain
}
Gain.state = {
  gain: 0
}

export function GainEnvelope (ac, state) {
  const env = Gain(ac)
  env.state = assign({}, GainEnvelope.state, state)
  env.gain.value = 0.5
  env.trigger = function (time, dur) {
    if (!time) time = ac.currentTime
    console.log("trigger env", time, dur, env.state)
    const release = triggerAttack(time, env.gain, env.state)
    if (dur) release(time + dur)
    return release
  }
  return env
}
GainEnvelope.state = {
  attack: 0.01,
  release: 0.2
}

export function FilterEnvelope (ac, state) {
}

// ## Private utility functions

function triggerAttack (time, param, adsr) {
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
