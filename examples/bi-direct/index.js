const Tone = require("tone")
const LZString = require("lz-string")
const StartAudioContext = require("startaudiocontext")

console.clear()

const colorOff1 = "#f9f9f9"
const colorOff2 = "#eee"
const colorOff3 = "#ddd"
const colorSat = 100
const colorLit = 55
const PI = Math.PI

class ModNodes {
  constructor () {
    this.init()
  }

  init (di) {
    let change = di > 0
    if (!change) this.initTransport()
    this.initSettings(di)
    this.initData(change)
    this.initSynths(change)
    this.initCanvases(change)
    if (change) this.reset()
    this.drawXY()
    this.initCtrl(change)
  }

  initData (change) {
    this.playing = false
    this.tickIdx = 0
    this.ticks = this.di
    if (this.di === 8) {
      this.scale = 84
      this.border = 8
    } else if (this.di === 16) {
      this.scale = 42
      this.border = 6
    } else if (this.di === 24) {
      this.scale = 32
      this.border = 5
    } else if (this.di === 32) {
      this.scale = 22
      this.border = 3
    }
    this.size = Math.floor(this.scale * 0.8)
    this.queuedPaths = []
    this.metronome = false
    this.lineSM = this.border
    this.lineLG = this.lineSM
    if (!change) {
      this.hues = []
      for (let i = 0; i < 5; i++) { this.hues.push(`${Math.round(i / 5 * 360)}`) } // being a string is imperative!
      this.hue = this.hues[2]
    }
  }

  initSettings (di) {
    let params = this.getUrlParameter("d")
    if (di) {
      this.di = di
      this.handleDefaultSettings()
    } else if (params) {
      try {
        let settings = this.decode(params)
        if (settings) {
          this.handleParamsSettings(settings)
        } else {
          this.handleDefaultSettings()
        }
      } catch (e) {
        this.handleDefaultSettings()
      }
    } else {
      this.handleDefaultSettings()
    }
  }

  handleDefaultSettings () {
    this.di = this.di || 8
    this.setNotes("C", "major")
    this.transport.bpm.value = 150
  }

  handleParamsSettings ({ di, key, mode, xy, bpm }) {
    this.di = this.di || di
    this.setNotes(key, mode)
    this.transport.bpm.value = bpm
    this.prefillXY = xy
  }

  drawXY (xy) {
    this.drawGrid()
    this.dataXY = []
    for (let x = 0; x <= this.di; x++) {
      let arr = []
      for (let y = 0; y <= this.di; y++) {
        arr.push(0)
      }
      this.dataXY.push(arr)
    }
    if (this.prefillXY) {
      this.prefillXY.forEach(data => {
        this.fill(data[0], data[1], data[2])
      })
    }
    this.routePaths()
  }

  reset () {
    this.dataXY = []
    for (let x = 0; x <= this.di; x++) {
      let arr = []
      for (let y = 0; y <= this.di; y++) {
        arr.push(0)
      }
      this.dataXY.push(arr)
    }
    this.RouteCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
    this.DrawCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
  }

  initCanvases (change) {
    if (!change) {
      this.DrawCVS = document.createElement("canvas")
      this.DrawCVS.classList.add("DrawCVS")
      this.DrawCTX = this.DrawCVS.getContext("2d")
      this.setDrawCVSEvents()

      this.PlayCVS = document.createElement("canvas")
      this.PlayCVS.classList.add("PlayCVS")
      this.PlayCTX = this.PlayCVS.getContext("2d")

      this.GridCVS = document.createElement("canvas")
      this.GridCVS.classList.add("GridCVS")
      this.GridCTX = this.GridCVS.getContext("2d")

      this.RouteCVS = document.createElement("canvas")
      this.RouteCVS.classList.add("RouteCVS")
      this.RouteCTX = this.RouteCVS.getContext("2d")

      var container = document.querySelector("section main")
      container.appendChild(this.GridCVS)
      container.appendChild(this.RouteCVS)
      container.appendChild(this.PlayCVS)
      container.appendChild(this.DrawCVS)
    }

    this.DrawCVS.width = this.di * this.scale
    this.DrawCVS.height = this.di * this.scale

    this.PlayCVS.width = this.di * this.scale
    this.PlayCVS.height = this.di * this.scale
    this.PlayCTX.strokeStyle = colorOff3

    this.GridCVS.width = this.di * this.scale
    this.GridCVS.height = this.di * this.scale

    this.RouteCVS.width = this.di * this.scale
    this.RouteCVS.height = this.di * this.scale
  }

  drawGrid () {
    this.GridCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
    this.GridCTX.strokeStyle = colorOff1
    this.GridCTX.lineWidth = this.border
    this.GridCTX.fillStyle = colorOff2
    let indicatorDi = this.scale * 0.5

    for (let i = 0; i < this.di; i++) {
      let offset = this.scale / 2 + this.scale * i
      this.path(this.GridCTX, offset, 0, offset, this.di * this.scale)
      this.path(this.GridCTX, 0, offset, this.di * this.scale, offset)
    }
    for (let i = 0; i < this.di; i++) {
      let indicatorOffset = indicatorDi / 2 + this.scale * i
      if (i % 8 === 0) {
        for (let y = 0; y < 4; y++) {
          this.GridCTX.fillRect(
            indicatorOffset,
            y * this.scale * 8 + indicatorDi / 2,
            indicatorDi,
            indicatorDi
          )
        }
      }
    }
  }

  initSynths (change) {
    if (change) {
      this.PolySynth.dispose()
    } else {
      let fx = new Tone.PingPongDelay()
      fx.wet.value = 0.2
      fx.toMaster()
      this.mixer = new Tone.Gain(0.6)
      this.mixer.connect(fx)
      let metGain = new Tone.Gain(0.3)
      metGain.toMaster()
      this.metSynth = new Tone.MembraneSynth()
      this.metSynth.oscillator.type = "triangle2"
      this.metSynth.octaves = 4
      this.metSynth.envelope.release = 0.05
      this.metSynth.envelope.attackCurve = "linear"
      this.metSynth.envelope.decay = 0.05
      this.metSynth.pitchDecay = 0.025
      this.metSynth.connect(metGain)
    }

    this.PolySynth = new Tone.PolySynth(8, Tone.Synth)
    this.PolySynth.volume.value = -6
    this.PolySynth.set({
      oscillator: { type: "triangle64" },
      envelope: { attack: 0.01 }
    })
    this.PolySynth.connect(this.mixer)
  }

  initTransport () {
    this.transport = Tone.Transport
    this.transport.scheduleRepeat(
      time => {
        this.tickSynths(this.tickIdx, time)
        Tone.Draw.schedule(
          () => {
            this.tickDraw()
          },
          time
        )
      },
      "8n"
    )
  }

  playMetronome (int, time) {
    let pitch = int % 8 === 0 ? "G5" : "C5"
    this.metSynth.triggerAttackRelease(pitch, "32n", time)
  }

  setDrawCVSEvents () {
    this.DrawCVS.addEventListener("click", e => {
      this.processMouse(e)
    })
  }

  processMouse (e) {
    this.resetLink()
    let x = Math.floor(
      Math.max(0, e.offsetX) / (this.DrawCVS.clientWidth - 1) * this.di
    )
    let y = Math.floor(
      Math.max(0, e.offsetY) / (this.DrawCVS.clientHeight - 1) * this.di
    )
    this.fill(x, y, this.hue)
    this.routePaths()
  }

  initCtrl (change) {
    if (!change) {
      let hues = document.createElement("div")
      hues.classList.add("colors")
      this.hues.forEach(hue => {
        let item = document.createElement("span")
        if (hue === this.hue) {
          item.classList.add("active")
        }
        item.setAttribute("data-color", hue)
        item.style.backgroundColor = `hsl(${hue},${colorSat}%,${colorLit}%)`
        item.style.borderColor = `hsl(${hue},${colorSat - 10}%,${colorLit - 5}%)`
        hues.appendChild(item)
        item.addEventListener("click", e => {
          this.hue = e.target.getAttribute("data-color")
          let existing = document.querySelector("[data-color].active")
          if (existing) existing.classList.remove("active")
          e.target.classList.add("active")
        })
      })
      document.querySelector("section header").appendChild(hues)
    }

    let bpm = document.querySelector("#bpm")
    bpm.value = this.transport.bpm.value
    let di = document.querySelector("#di")
    di.value = this.di
    let go = document.querySelector("#go")
    let reset = document.querySelector("#reset")
    let metro = document.querySelector("#metronome")
    this.$link = document.querySelector("#link")
    this.$save = document.querySelector("#save")
    let mode = document.querySelector("#mode")
    mode.querySelector("[value='" + this.mode + "']").selected = true
    let key = document.querySelector("#key")
    key.querySelector("[value='" + this.key + "']").selected = true

    if (change) {
      this.resetLink()
      this.playing = false
      this.stop()
      go.innerHTML = "Play"
      go.classList.remove("active")
      this.metronome = false
      metro.classList.remove("active")
    } else {
      bpm.addEventListener("input", e => {
        this.resetLink()
        this.transport.bpm.value = parseInt(e.target.value)
      })

      di.addEventListener("change", e => {
        let conf = confirm(
          "Higher resoultions are less performant on slower machines and changing will reset your work. Are you sure?"
        )
        if (conf) {
          let di = parseInt(e.target.value)
          this.prefillXY = null
          this.init(di)
        } else {
          e.target.value = this.di
        }
      })

      StartAudioContext(Tone.context, go, () => {})
      go.addEventListener("click", e => {
        e.preventDefault()
        if (this.playing) {
          this.playing = false
          this.stop()
          go.innerHTML = "Play"
          go.classList.remove("active")
        } else {
          this.playing = true
          this.start()
          go.innerHTML = "Stop"
          go.classList.add("active")
          this.tickIdx = 0
        }
      })

      reset.addEventListener("click", e => {
        e.preventDefault()
        this.reset()
      })

      metro.addEventListener("click", e => {
        e.preventDefault()
        this.metronome = !this.metronome
        if (this.metronome) {
          e.target.classList.add("active")
        } else {
          e.target.classList.remove("active")
        }
      })

      this.$save.addEventListener("click", e => {
        e.preventDefault()
        this.$save.innerHTML = ""
        let output = this.save()
        this.$link.setAttribute(
          "href",
          `//codepen.io/jakealbaugh/full/xqVrvE?d=${output}`
        )
        this.$link.innerHTML = "Get Url"
      })

      mode.addEventListener("change", e => {
        this.resetLink()
        this.setNotes(key.value, e.target.value)
      })

      key.addEventListener("change", e => {
        this.resetLink()
        this.setNotes(e.target.value, mode.value)
      })
    }
  }

  resetLink () {
    this.$link.innerHTML = ""
    this.$save.innerHTML = "Save"
  }

  setNotes (key, mode) {
    this.key = key
    this.mode = mode
    let notes = new MusicalScale({ key, mode }).notes
    // make proximity a good thing.
    this.notes = [
      notes[0],
      notes[2],
      notes[4],
      notes[6],
      notes[1],
      notes[3],
      notes[5]
    ]
  }

  tickDraw () {
    if (this.playing) {
      this.PlayCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
      this.PlayCTXXStroke = this.lineSM
      this.PlayCTXYStroke = this.lineSM

      let offset = this.tickIdx * this.scale + this.scale / 2

      this.PlayCTX.lineWidth = this.PlayCTXYStroke
      this.path(this.PlayCTX, offset, 0, offset, this.di * this.scale)

      this.PlayCTX.lineWidth = this.PlayCTXXStroke
      this.path(this.PlayCTX, 0, offset, this.di * this.scale, offset)
      this.tickIdx++
      if (this.tickIdx >= this.ticks) this.tickIdx = 0
    }
  }

  tickSynths (int, time) {
    if (this.playing) {
      if (this.metronome) {
        if (int % 2 === 0) {
          this.playMetronome(int, time)
        }
      }
      let notes = []
      for (let i = 0; i < this.dataXY[int].length; i++) {
        if (this.dataXY[int][i] !== 0) {
          let note = this.notes[i % 7]
          let octave = this.hues.indexOf(this.dataXY[int][i]) +
            2 +
            note.rel_octave
          let notation = `${note.note}${octave}`
          if (notes.indexOf(notation) === -1) notes.push(notation)
        }

        if (this.dataXY[i][int] !== 0) {
          let note = this.notes[i % 7]
          let octave = this.hues.indexOf(this.dataXY[i][int]) + 2
          let notation = `${note.note}${octave}`
          if (notes.indexOf(notation) === -1) notes.push(notation)
        }
      }
      this.PolySynth.triggerAttackRelease(notes, "8n", time)
    }
  }

  start () {
    this.transport.start("+1")
  }

  stop () {
    this.PlayCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
    this.transport.stop()
    this.PolySynth.releaseAll(Tone.now)
  }

  path (ctx, x1, y1, x2, y2) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.closePath()
  }

  fill (x, y, hue) {
    if (this.dataXY[x][y] && hue !== 0) {
      hue = 0
    }
    this.dataXY[x][y] = hue

    if (hue === 0) {
      this.DrawCTX.clearRect(
        x * this.scale,
        y * this.scale,
        this.scale,
        this.scale
      )
    } else {
      // relative saturation and lightness
      let sat = colorSat // (7 - y % 7) / 7 * (colorSat * 0.7) + (colorSat * 0.3)
      let lit = colorLit // (7 - x % 7) / 7 * (colorLit * 0.3) + (colorLit * 0.9)
      this.DrawCTX.strokeStyle = `hsl(${hue},${sat - 10}%,${lit - 5}%)`
      this.DrawCTX.lineWidth = this.border

      this.DrawCTX.beginPath()
      this.DrawCTX.fillStyle = `hsl(${hue},${sat}%,${lit}%)`
      let r = (this.size - this.border * 2) / 2
      let cx = x * this.scale +
        this.border +
        (this.scale - this.border * 2) / 2
      let cy = y * this.scale +
        this.border +
        (this.scale - this.border * 2) / 2

      this.DrawCTX.arc(cx, cy, r, 0, 2 * PI, false)
      this.DrawCTX.fill()
      this.DrawCTX.stroke()
      this.DrawCTX.closePath()
    }
  }

  routePaths () {
    this.RouteCTX.clearRect(0, 0, this.di * this.scale, this.di * this.scale)
    this.dataXY.forEach((row, x) => {
      row.forEach((col, y) => {
        if (col) this.route(x, y)
      })
    })
  }

  route (x, y) {
    let c = this.dataXY[x][y]
    let e, w, n, s

    for (let i = x + 1; i < this.di; i++) {
      if (this.dataXY[i][y]) {
        e = { x: i, y }
        break
      }
    }

    for (let i = x - 1; i >= 0; i--) {
      if (this.dataXY[i][y]) {
        w = { x: i, y }
        break
      }
    }

    for (let i = y + 1; i < this.di; i++) {
      if (this.dataXY[x][i]) {
        s = { x, y: i }
        break
      }
    }

    for (let i = y - 1; i >= 0; i--) {
      if (this.dataXY[x][i]) {
        n = { x, y: i }
        break
      }
    }

    if (e) this.routePath(x, y, e)
    if (w) this.routePath(x, y, w)
    if (n) this.routePath(x, y, n)
    if (s) this.routePath(x, y, s)
  }

  routePath (x, y, destination) {
    this.RouteCTX.lineWidth = this.border
    this.RouteCTX.strokeStyle = colorOff2
    x += 0.5
    y += 0.5
    destination.x += 0.5
    destination.y += 0.5
    let x1 = x * this.scale
    let y1 = y * this.scale
    let x2 = destination.x * this.scale
    let y2 = destination.y * this.scale
    this.RouteCTX.beginPath()
    this.RouteCTX.moveTo(x1, y1)
    this.RouteCTX.lineTo(x2, y2)
    this.RouteCTX.stroke()
    this.RouteCTX.closePath()
  }

  save () {
    return this.encode({
      key: this.key,
      mode: this.mode,
      bpm: this.transport.bpm.value,
      xy: this.xyData(),
      di: this.di
    })
  }

  xyData () {
    let arr = []
    this.dataXY.forEach((row, x) => {
      row.forEach((col, y) => {
        if (col) arr.push([x, y, col])
      })
    })
    return arr
  }

  encode (object) {
    return LZString.compressToEncodedURIComponent(JSON.stringify(object))
  }

  decode (string) {
    return JSON.parse(LZString.decompressFromEncodedURIComponent(string))
  }

  getUrlParameter (name) {
    name = name.replace(/[[]/, "[").replace(/[\]]/, "]")
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
    var results = regex.exec(window.location.search)
    return results === null
      ? null
      : decodeURIComponent(results[1].replace(/\+/g, " "))
  }
}

module.exports = new ModNodes()
