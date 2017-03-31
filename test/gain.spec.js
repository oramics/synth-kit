/* global AudioContext */
require("web-audio-test-api")
const { Gain } = require("../lib/index")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("synth-kit -- Gain", () => {
  test("state", () => {
    const ac = new AudioContext()
    const gain = Gain(ac)
    expect(gain.state).toEqual({ gain: 0 })
  })
})
