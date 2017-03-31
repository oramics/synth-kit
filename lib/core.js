const isString = (o) => typeof o === "string"
const isFn = (o) => typeof o === "function"
const { exp, E } = Math

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
    if (isFn(value.connect)) {
      value.connect(target)
    } else {
      target.setValueAtTime(value, 0)
    }
  } else {
    // replace the old value with a new one
    node[name] = value
  }
}

/**
 * Update a node
 */
export function update (node, newState, initialState) {
  if (initialState) node.state = Object.assign({}, initialState)
  else if (!node.state) node.state = {}

  if (newState) {
    const state = node.state
    // diffing algorithm
    Object.keys(newState).forEach(key => {
      const newValue = newState[key]
      const prevValue = state[key]
      if (newValue !== prevValue) {
        plug(node, key, newValue)
        state[key] = newValue
      }
    })
  }
  return node
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

/**
 * Create a connect function with for the given node
 * The return function have two special characteristics:
 * - It's chainable
 * - It accepts `true` as param to connect to node's AudioContext's destination
 */
export function connectWith (node, parent) {
  if (!parent) throw Error("no parent!")
  const conn = node.connect
  return function (dest) {
    if (dest === true) conn.call(node, node.context.destination)
    else conn.apply(node, arguments)
    return parent
  }
}
