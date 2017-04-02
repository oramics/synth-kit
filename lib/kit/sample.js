// # Sample
import Gain from "./gain"
import Source from "./source"

// A sample is a re-triggerable audio buffer source.

/**
 * Create a Sample
 *
 * @param {AudioContext} context
 * @param {AudioBuffer} buffer
 * @param {Object} [state]
 */
export default function Sample (ac, buffer, config) {
  const sample = Gain(ac)

  sample.trigger = (time, dur) => {
    if (!time) time = ac.currentTime
    const source = Source(ac, buffer, config)
    source.connect(sample)
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
