/* global AudioContext */
const pick = require("pick-random")
const SynthKit = require("..")
const ac = new AudioContext()
const { h, app } = require("hyperapp")
const hyperx = require("hyperx")
const html = hyperx(h)

const init = () => ({
  types: ["MonoSynth", "Kick", "Snare", "Cowbell"],
  current: null
})

const viewState = (state) =>
  state ? JSON.stringify(state, null, 2) : ""

const viewSynth = (model, actions) => html`
  <div>
    <h2>${model.current}</h2>
    <button onclick=${(e) => actions.trigger()}>Trigger</button>
    <pre><code>${viewState(model.instrument.inspect())}</code></pre>
  </di>
`

const viewType = (select) => (name) => html`
  <span>
    <a href="#!" onclick=${(e) => select(name)}>${name}</a>
  </span>
`

const view = (model, actions) => html`
  <div>
    <h1>SynthKit</h1>
    <div>${model.types.map(viewType(actions.select))}</div>
    ${model.current ? viewSynth(model, actions) : "Click to select"}
  </div>
`

const actions = {
  select: (model, name) => ({
    current: name,
    instrument: SynthKit[name](ac).connect(true)
  }),
  trigger (model) {
    const inst = model.instrument
    if (inst.trigger.length === 3) {
      const note = pick([440, 880, 2000])
      console.log("SYNTH", note)
      inst.trigger(note, 0, 0.5)
    } else {
      inst.trigger()
    }
  }
}

const model = init()
app({ model, actions, view })
