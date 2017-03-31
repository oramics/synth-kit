import { connectWith } from "../core"
import Gain from "./gain"
import Source from "./source"

/**
 * Sample player. It's like a BufferSource but can be triggered more than once.
 *
 * @param {AudioContext} context
 * @param {AudioBuffer} buffer
 * @param {Object} [state]
 * - gain: the gain of the sample
 *
 * @constructor
 */
export default function Sample (ac, buffer, state) {
  if (!buffer) throw Error("Sample needs a buffer.")
  state = Object.assign({}, Sample.state, state)

  // create component
  const sample = {
    amp: Gain(ac, state)
  }

  // API
  /**
   * Connect to a node
   * @chainable
   * @param {AudioNode} dest
   * @return {Sample} this
   */
  sample.connect = connectWith(sample.amp, sample)

  /**
   * trigger attack/release
   * @param {Integer} [when=now]
   * @param {Duration} [dur]
   */
  sample.trigger = (time, dur) => {
    if (!time) time = ac.currentTime
    const source = Source(ac, buffer, state)
    source.connect(sample.amp)
    source.onended = () => {
      if (sample.onended) sample.onended()
      source.disconnect()
    }
    source.start(time)
  }
  return sample
}

Sample.state = {
  gain: 0.8
}
