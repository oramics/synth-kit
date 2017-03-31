/* global AudioContext */
require("web-audio-test-api")
const { Gain, GainEnvelope } = require("../lib/nodes")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("synth-kit -- Nodes", () => {
  test("Gain", () => {
    const ac = new AudioContext()
    const gain = Gain(ac)
    expect(gain.state).toEqual({ gain: 0 })
  })
  test("GainEnvelope", () => {
    const ac = new AudioContext()
    const env = GainEnvelope(ac)
    expect(env.state).toEqual({
      attack: 0.01, release: 0.2
    })
    expect(env.gain.value).toBe(0)
  })
})
