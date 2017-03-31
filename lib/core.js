/* global AudioContext */
const isString = (o) => typeof o === "string"
const isFn = (o) => typeof o === "function"
const { exp, E } = Math

let ctx = null
/**
 * Get an audio context.
 */
export function context (config, ac) {
  if (ac) {
    return ac
  } else if (config && config.context) {
    return config.context
  } else {
    if (ctx === null) ctx = new AudioContext()
    return ctx
  }
}

export function ampToGain (amp) {
  return (exp(amp) - 1) / (E - 1)
}

/**
 * Update a node property with a value. If the property is a parameter and
 * the value is a node, it will connect them
 */
export function plug (node, name, value) {
  const target = node[name]
  if (isFn(value)) value = value()
  if (target === undefined || value === undefined || value === null) {
    // ignore
  } else if (target.value !== undefined) {
    // it's a parameter
    if (isFn(value.connect)) value.connect(target)
    else target.setValueAtTime(value, 0)
  } else if (target === undefined) {
    // replace the old value with a new one
    node[name] = value
  }
}

/**
 * Update a node
 */
export function update (node, newState) {
  const state = node.state || {}
  Object.keys(newState).forEach(key => {
    const newValue = newState[key]
    const prevValue = state[key]
    if (newValue !== prevValue) {
      plug(node, key, newValue)
      state[key] = newValue
    }
    node.state = state
  })
  return node
}

export function triggerAttack (time, param, adsr) {
  param.cancelScheduledValues(0)
  // attack phase
  const attack = adsr.attack || 0.01
  param.setValueAtTime(0, time)
  time += attack
  param.linearRampToValueAtTime(1, time)

  // decay-sustain phase
  const sustain = adsr.sustain || 1
  if (sustain !== 1) {
    time += (adsr.decay || 0.01)
    param.exponentialRampToValueAtTime(adsr.sustain, time)
  }

  // only trigger release if hold is defined
  if (adsr.hold !== undefined) {
    time += (adsr.hold || 0)
    param.setValueAtTime(adsr.sustain)
    time += (adsr.release || 0.1)
    param.exponentialRampToValueAtTime(0.00001, time - 0.01)
    param.setValueAtTime(0, time)
  }
}

export function polyphony (init, options = {}) {
  const max = options.maxVoices || 16
  const voices = []
  for (var i = 0; i < max; i++) voices[i] = init()
  let current = -1

  return function next () {
    current = (current + 1) % max
    return voices[current]
  }
}

export function connected (object, connections) {
  connections.reduce((src, next) => {
    if (isString(src)) src = object[src]
    if (isString(next)) next = object[next]
    src.connect(next)
    return next
  })
  return object
}

export function connect (...nodes) {
  nodes.reduce((prev, next) => {
    prev.connect(next)
    return next
  })
  return nodes
}
