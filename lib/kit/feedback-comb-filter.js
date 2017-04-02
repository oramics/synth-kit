// # Feedback Comb Filter
import { createAudioNode } from "../synth"
import Gain from "./gain"

// The feedback comb filter can be used as a computational physical model of
// a series of echoes, exponentially decaying and uniformly spaced in time.

// #### References

// - https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filters.html

/**
 * Create a FeedbackCombFilter
 */
export default function FeedbackCombFilter (ac, config) {
  config = Object.assign({}, FeedbackCombFilter.defaults, config)
  const feedback = Gain(ac, config)
  // Create a delay with an extra param
  const filter = createAudioNode(ac, "Delay",
    FeedbackCombFilter.params, config.maxDelay)
  filter.resonance = feedback.gain
  filter.connect(feedback)
  feedback.connect(filter)
  return filter.update(config)
}
FeedbackCombFilter.params = ["delayTime", "resonance"]
FeedbackCombFilter.defaults = {
  maxDelay: 1,
  delayTime: 0.1,
  resonance: 0.5
}
