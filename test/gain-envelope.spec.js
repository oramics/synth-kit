/* global AudioContext */
require("web-audio-test-api")
const { GainEnvelope } = require("../lib/index")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("GainEnvelope", () => {
  test("inspect", () => {
    const ac = new AudioContext()
    const env = GainEnvelope(ac)
    expect(env.inspect()).toEqual({
      attack: 0.01, decay: 0.2, peak: 1
    })
    expect(env.gain.value).toBe(0)
  })
})
