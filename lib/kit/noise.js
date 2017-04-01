// # Noise
import MonoBuffer from "./mono-buffer"
import Source from "./source"

/**
 * Create a Noise oscillator
 *
 * @param {AudioContext} ac
 * @param {Object} [config]
 * - type: the noise type. Can be "white" (by default)
 * - duration: the duration in seconds
 * @return {AudioNode} the noise node
 */
export default function Noise (ac, config) {
  config = Object.assign({}, Noise.defaults, config)
  const samples = config.duration * ac.sampleRate
  const buffer = MonoBuffer(ac, samples, () => Math.random() * 2 - 1)
  const noise = Source(ac, buffer, { loop: true })
  noise.start()
  return noise
}
Noise.defaults = {
  duration: 1,
  loop: true
}
