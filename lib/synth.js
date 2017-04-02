// const isString = (o) => typeof o === "string"
const isFn = (o) => typeof o === "function"
const { exp, E } = Math

export function ampToGain (amp) {
  return (exp(amp) - 1) / (E - 1)
}

export function instrument (config) {
  const inst = {}
  const names = Object.keys(config)
  names.forEach(key => {
    const [node, to] = config[key]
    inst[key] = node
    if (to === "output") setOutput(inst, node)
    else connect(node, config[to][0])
  })
  inst.update = (state) => {
    if (state) {
      names.forEach(key => {
        console.log("UPDATE", key, state[key])
        inst[key].update(state[key])
      })
    }
    return inst
  }
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
export function setOutput (inst, node) {
  inst.connect = (dest) => {
    if (dest === true) dest = node.context.destination
    node.connect(dest)
    return inst
  }
}

export function withDefaults (config, defaults) {
  return config ? Object.assign({}, defaults, config) : defaults
}
