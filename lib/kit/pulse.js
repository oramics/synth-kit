// # Pulse
import MonoBuffer from "./mono-buffer"
import Sample from "./sample"

/**
 * Create a Pulse audio node
 *
 * @param {AudioContext} ac
 * @param {Object} [config]
 * - type: the pulse type. Can be "white" (by default)
 * - duration: the duration in seconds
 * @return {AudioNode} the pulse node
 */
export default function Pulse (ac, config) {
  config = Object.assign({}, Pulse.defaults, config)
  const samples = config.duration * ac.sampleRate
  const buffer = MonoBuffer(ac, samples, () => Math.random() * 2 - 1)
  const pulse = Sample(ac, buffer)
  return pulse
}
Pulse.defaults = {
  duration: 0.001
}
