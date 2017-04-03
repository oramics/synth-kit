// const isString = (o) => typeof o === "string"
const isFn = (o) => typeof o === "function"
const { exp, E } = Math

export function ampToGain (amp) {
  return (exp(amp) - 1) / (E - 1)
}

export function instrument (ac, config) {
  const inst = {}
  const names = Object.keys(config)

  // create nodes
  names.forEach(key => {
    const Node = config[key][0]
    inst[key] = typeof Node === "function" ? Node(ac) : Node
  })
  // connect nodes
  names.forEach(key => {
    const to = config[key][1]
    const node = inst[key]
    if (to === "output") connectWith(inst, node)
    else connect(node, inst[to])
  })

  // API
  // update: change the state of the instrument
  inst.update = (state, time) => {
    time = time || ac.currentTime
    if (state) {
      names.forEach(key => {
        inst[key].update(state[key], time)
      })
    }
    return inst
  }
  // inspect: get the current state of the instrument
  inst.inspect = () => names.reduce((state, name) => {
    state[name] = inst[name].inspect()
    return state
  }, {})
  return inst
}

export function createAudioNode (ac, type, params, initParam) {
  const node = ac["create" + type](initParam)
  node.update = (state) => {
    if (state) {
      params.forEach(name => {
        plug(node, name, state[name])
      })
    }
    return node
  }
  node.inspect = () => params.reduce((state, name) => {
    state[name] = inspect(node, name)
    return state
  }, {})
  return node
}

// Get the value of a node parameter
export function inspect (node, name) {
  const value = node[name]
  return value && value.value !== undefined ? value.value : value
}

/**
 * Update a node property with a value. If the property is a parameter and
 * the value is a node, it will connect them
 */
export function plug (node, name, value) {
  const target = node[name]
  if (isFn(value)) value = value()
  if (value === undefined || target === undefined) {
    // ignore
  } else if (target.value !== undefined) {
    // it's a parameter
    if (isFn(value.connect)) {
      value.connect(target)
    } else {
      target.value = value
      target.setValueAtTime(value, 0)
    }
  } else {
    // replace the old value with a new one
    node[name] = value
  }
}

function connect (node, dest) {
  if (dest) node.connect(dest)
}

/**
 * Set the output of a node (by creating a new connect function)
 */
export function connectWith (inst, node) {
  inst.connect = (dest) => {
    if (dest === true) dest = node.context.destination
    node.connect(dest)
    return inst
  }
}

export function withDefaults (config, defaults) {
  return config ? Object.assign({}, defaults, config) : defaults
}

/**
 * Trigger an ADSR envelope over a param
 */
export function triggerAdsr (time, param, adsr) {
  param.cancelScheduledValues(0)

  // attack phase
  const attack = adsr.attack || 0.01
  const peak = adsr.peak || 1
  param.setValueAtTime(0, time)
  time += attack
  console.log("attack", attack, peak, time)
  param.linearRampToValueAtTime(peak, time)

  // decay phase
  const decay = adsr.decay || 0.01
  const sustain = adsr.sustain || 0
  time += decay
  param.linearRampToValueAtTime(sustain, time)

  // hold phase
  const hold = adsr.hold || 0
  if (hold) {
    time += hold
    param.setValueAtTime(sustain, time)
  }

  const release = time => {
    if (sustain) {
      param.setValueAtTime(time, sustain)
      const release = adsr.release || 0
      console.log("Trigger release", release, time)
      time += release
      param.exponentialRampToValueAtTime(0.00001, time)
    }
  }

  // trigger release if hold is specified
  if (hold) {
    release(time)
  }

  return release
}
