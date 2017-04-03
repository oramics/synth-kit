// # Oscillator Bank
import Gain from "./gain"
import Osc from "./osc"

const conn = (src, dest) => {
  src.connect(dest)
  return src
}

/**
 * Create a OscBank
 */
export default function OscBank (ac, ratios, config) {
  if (!ratios) throw Error("OscBank requires an array 'ratios' in constructor")

  // Setup internal state
  const state = Object.assign({}, OscBank.defaults, config)
  initState(state, ratios)

  // Create the audio nodes
  const output = Gain(ac)
  const amps = ratios.map(_ => {
    const amp = conn(Gain(ac), output)
    return amp
  })
  const oscs = amps.map((gain, i) => {
    const osc = conn(Osc(ac), gain)
    osc.type = state.types[i]
    return osc
  })
  const bank = { output, amps, oscs }

  // API
  bank.connect = (dest) => conn(output, dest)
  bank.update = (config, time) => {
    if (typeof config === "number" || typeof config === "string") {
      state.frequency = +config
      updateFrequencies(bank, state, time)
    } else if (config) {
      time = time || ac.currentTime
      if (config.gains) {
        updateArray(state.gains, config.gains)
        updateGains(bank, state, time)
      }
      if (config.frequency !== undefined) {
        state.frequency = config.frequency
        updateFrequencies(bank, state, time)
      }
    }
  }
  bank.inspect = () => state
  return bank
}
OscBank.defaults = {
  frequency: 440,
  gains: [0],
  types: ["sine"],
  compensate: true,
}

function initState (state, ratios) {
  const gains = state.gains
  const types = state.types
  state.gains = ratios.map((_, i) => gains[i % gains.length])
  state.types = ratios.map((_, i) => types[i % types.length])
  state.ratios = ratios
}

function updateFrequencies ({ oscs }, { ratios, frequency }, time) {
  oscs.forEach((osc, i) => {
    osc.frequency.setValueAtTime(ratios[i] * frequency, time)
  })
}

function updateGains ({ amps }, { gains }, time) {
  amps.forEach((amp, i) => {
    if (gains[i] !== undefined) amp.gain.setValueAtTime(gains[i], time)
  })
}

function updateArray (prev, next) {
  if (next) {
    const len = prev.length
    for (var i = 0; i < len; i++) {
      if (next[i] !== undefined) prev[i] = next[i]
    }
  }
}
