import { update } from "../core"

/**
 * Create a Gain node.
 * Unlike the normal Gain node, the gain of this one is 0 by default
 */
export default function Gain (ac, state) {
  const gain = update(ac.createGain(), state, Gain.state)
  if (gain.state.gain === 0) gain.gain.setValueAtTime(0, 0)
  return gain
}

Gain.state = {
  gain: 0
}
