// # Pluck synth
import { instrument } from "../synth"
import Gain from "../kit/gain"
import Noise from "../kit/noise"
import FeedbackCombFilter from "../kit/feedback-comb-filter"
import GainEnvelope from "../kit/gain-envelope"

// Poor's man version of Karplus-String string synthesis

export default function Pluck (ac, config) {
  const pluck = instrument({
    noise: [ Noise(ac), "envelope" ],
    envelope: [ GainEnvelope(ac), "combFilter" ],
    combFilter: [ FeedbackCombFilter(ac), "amp" ],
    amp: [ Gain(ac), "output" ],
  }).update(config)

  pluck.trigger = (freq, time, dur) => {
    const delay = 1 / freq
    pluck.combFilter.delayTime.setValueAtTime(delay, time)
    pluck.envelope.trigger(time)
  }
  return pluck
}

Pluck.defaults = {
  noise: {
    type: "white",
  },
  envelope: {
    attack: 0.1,
    decay: 0.1,
  },
  combFilter: {
    delayTime: 0.2,
    resonance: 0.9,
  }
}
