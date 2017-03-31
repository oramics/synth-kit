/* global AudioContext */
require("web-audio-test-api")
const { GainEnvelope } = require("../lib/index")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("GainEnvelope", () => {
  test("state", () => {
    const ac = new AudioContext()
    const env = GainEnvelope(ac)
    expect(env.state).toEqual({
      attack: 0.01, release: 0.2
    })
    expect(env.gain.value).toBe(0)
  })
})
