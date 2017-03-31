/* global AudioContext */
require("web-audio-test-api")
const { connect } = require("../lib/core")

const output = (node) => node.toJSON()
const inputs = (node) => node.toJSON().inputs

describe("synth-kit -- Core", () => {
  test("connect", () => {
    const ac = new AudioContext()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const chain = connect(osc, gain)
    expect(chain[0]).toBe(osc)
    expect(chain[1]).toBe(gain)
    expect(inputs(gain)).toEqual([ output(osc) ])
  })
})
