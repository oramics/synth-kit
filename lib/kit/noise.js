import MonoBuffer from "./mono-buffer"
import Source from "./source"

/**
 * Noise oscillator
 */
export default function Noise (ac, state) {
  state = Object.assign({}, Noise.state, state)
  const duration = state.duration * ac.sampleRate
  const buffer = MonoBuffer(ac, duration, () => Math.random() * 2 - 1)
  const noise = Source(ac, buffer, { loop: true })
  noise.start()
  return noise
}
Noise.state = {
  type: "white",
  duration: 1,
  gain: 0.7,
  loop: true
}
