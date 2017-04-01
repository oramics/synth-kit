/** @module kit */
import { createAudioNode } from "../synth"

/**
 * Create a Filter
 * @param {AudioContext} context
 * @param {Object} [config]
 */
export default function Filter (ac, state) {
  return createAudioNode(ac, "BiquadFilter", Filter.params).update(state)
}
Filter.params = ["type", "frequency", "detune", "Q"]
