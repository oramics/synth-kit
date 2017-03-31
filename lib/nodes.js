import { update, triggerAttack } from "./core"

function createNode (ac, name, initialState, state, params) {
  const node = ac["create" + name].apply(ac, params)
  node.state = initialState
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
  const gain = createNode(ac, "Gain", Osc.state, state)
  if (gain.state.gain === 0) gain.gain.setValueAtTime(0, 0)
  return gain
}
Gain.state = {
  gain: 0
}

export function GainEnvelope (ac, state) {
  const env = Gain(null, ac)
  env.state = state
  env.trigger = function (time, dur) {
    triggerAttack(time, env.gain, env.state)
  }
  return env
}
GainEnvelope.state = {
  attack: 0.01,
  release: 0.2
}

export function FilterEnvelope (ac, state) {
}
