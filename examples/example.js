/* global AudioContext */
const SynthKit = require("..")
const ac = new AudioContext()
const { h, app } = require("hyperapp")
const hyperx = require("hyperx")
const html = hyperx(h)

app({
  model: {
    VCO: null
  },
  actions: {
    VCO: (model) => ({
      VCO: model.VCO ? model.VCO.disconnect() : SynthKit.VCO(ac).connect(true)
    })
  },
  view: (model, actions) => html`
    <div>
      <button onclick=${(e) => actions.VCO()}>VCO</button>
    </di>
  `
})

// const mono = SynthKit.MonoSynth(ac)
// console.log(mono.state)
// mono.trigger(60)
