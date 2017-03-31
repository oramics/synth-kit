/* global AudioContext */
const SynthKit = require("..")
const ac = new AudioContext()
const { h, app } = require("hyperapp")
const hyperx = require("hyperx")
const html = hyperx(h)

app({
  model: {
    MonoSynth: SynthKit.MonoSynth(ac, {
      envelope: { hold: 0.6 }
    }).connect(true)
  },
  actions: {
    VCO: (model) => ({
      VCO: model.VCO ? model.VCO.disconnect() : SynthKit.VCO(ac).connect(true)
    }),
    MonoSynth: (model) => {
      console.log("AMP", model.MonoSynth.amp)
      model.MonoSynth.trigger(440)
    }
  },
  view: (model, actions) => html`
    <div>
      <button onclick=${(e) => actions.VCO()}>VCO</button>
      <button onclick=${(e) => actions.MonoSynth()}>MonoSynth</button>
      <pre><code>${model.MonoSynth
        ? JSON.stringify(model.MonoSynth.state, null, 2) : ""}
      </code></pre>
    </di>
  `
})

// const mono = SynthKit.MonoSynth(ac)
// console.log(mono.state)
// mono.trigger(60)
