import { update } from "../core"

/**
 * Create a Filter
 * @param {AudioContext} context
 * @param {Object} [config]
 * @name Filter
 */
export default function Filter (ac, state) {
  return update(ac.createBiquadFilter(), state, Filter.state)
}
Filter.state = {
  type: "lowpass",
  frequency: 350,
  detune: 0,
  Q: 1,
}
