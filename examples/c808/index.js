const { PREFIXER } = require("./utils")
const React = require("react")

/**
 * @class Poti defines a Potentionmeter
 * @property {Array|Integer}  steps        if given an Array of values they will
 *                                         be used as labels
 *                                         if given an Integer it defines snappable
 *                                         points and/or return values.
 *                                         - fallback: 100
 * @property {Integer}        markers      if given an Array of values they will
 *                                         be used instead of the steps
 *                                         if steps have labels they will still
 *                                         appear
 *                                         fallback: <number of steps>
 * @property {Function}       onUpdate     a callback to communicate with other
 *                                         components
 * @property {Number}         resolution   resolution of the steps (e.g. 0.2 o 20)
 * @property {String}         label        optionally show label
 * @property {String}         label2       optionally show a second label
 * @property {Boolean}        labelsBelow  show labels below the poti
 * @property {Boolean}        numbered     show numbers instead of markers
 * @property {Boolean}        snap         snap to steps
 * @property {Array}          range        defines the start and end point
 *                                         - fallback: [0, <number of steps>]
 * @property {Intger}         fullAngle    defines the angle from start to end point
 *                                         - fallback: 360
 * @property {Integer}        size         the size of the Touchfield
 *                                         twice the size of the Poti
 *                                         - fallback: 100
 */
class Poti extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.getStep = this.getStep.bind(this)
    this.getDeg = this.getDeg.bind(this)
    this.getCoord = this.getCoord.bind(this)
    this.updateValue = this.updateValue.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)

    // create a fallback for steps
    let steps = this.props.steps || 100
    // in case steps is a number
    // build an array with that length
    this.steps = typeof steps === "number"
      ? (() => {
        let arr = []
        let n = steps
        while (n--) {
            // push an empty object for each step
          arr.push({})
        }
        return arr
      })()
      : steps // already an Array
    // save the length for easier access
    this.stepsLength = this.steps.length
    // apply a fallback for range
    this.range = this.props.range || [0, this.stepsLength - 1]
    // create a fallback for fullAngle
    let fullAngle = this.props.fullAngle || 360
    // remove one step from the angle
    this.fullAngle = fullAngle / (this.stepsLength + 1) * this.stepsLength
    // define the angle of one step
    this.step = this.fullAngle / (this.stepsLength - 1)
    // apply a fallback for size
    this.size = this.props.size || 100
    // global margin
    this.margin = 10
    // calculate the center of the touch field
    this.center = this.size / 2 + this.margin
    // start and and angle points
    this.startAngle = (360 - this.fullAngle) / 2
    this.endAngle = 360 - this.startAngle
    // calculate the initial rotation of the knob
    this.initialDeg = (() => {
      let deg = (this.props.value || 0) - this.range[0]
      deg /= this.range[1] - this.range[0]
      deg *= this.fullAngle
      deg += this.startAngle
      return deg
    })()
    // create the markers
    this.markers = this.steps
    // in case markers are defined
    if (this.props.markers) {
      let m = []
      let n = this.props.markers
      while (n--) {
        let label
        // make sure labels are still displayed at the correct position
        let markerAt = Math.round(
          (this.props.markers - 1) / (this.stepsLength - 1)
        )
        let step = this.steps[Math.floor((this.props.markers - n) / markerAt)]
        if (step && n % markerAt === 0) {
          label = step.label
        }
        m.push({
          label: label
        })
      }
      this.markers = m
    }
    // create indicators from markers
    this.indicators = this.markers.map((item, index) => {
      let baseAngle = this.fullAngle / (this.markers.length - 1)
      let deg = Math.round(baseAngle * index + this.startAngle)
      let y = Math.round(this.center / 2 + 4)
      // indicators with labels are visually bigger
      let scale = item.label ? 1.5 : 0.75
      // fix the offset created by scaling
      let correction = (-2) * scale
      // define indicator styles
      let styles = PREFIXER.prefix({
        marker: {
          height: 10,
          width: 2,
          position: "absolute",
          top: "50%",
          left: "50%",
          pointerEvents: "none",
          transform: `translate(-50%, -50%)
                      rotate(${deg}deg)
                      translateY(${y}px)
                      translateY(4px)
                      scale(${scale})
                      translateY(${correction}px)`
        },
        label: {
          transform: `translate(-50%,-100%)
                      translateY(${14}px)
                      rotate(${deg * (-1)}deg)
                      scale(${1 / scale})`,
          fontFamily: "sans-serif",
          fontSize: 6,
          position: "absolute",
          top: "50%",
          left: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          textTransform: "uppercase"
        },
        number: {
          transform: `translate(-50%,-100%)
                      translateY(${8}px)
                      rotate(${deg * (-1)}deg)
                      scale(${1 / scale})`,
          fontFamily: "sans-serif",
          fontSize: 6,
          position: "absolute",
          top: "50%",
          left: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textTransform: "uppercase"
        }
      })
      let label, number
      // apply optional label
      if (item.label) {
        label = (
          <div className="label" style={styles.label}>
            {item.label}
          </div>
        )
      }
      // show numbers instead of markers
      if (this.props.numbered) {
        number = (
          <div className="number" style={styles.number}>
            {index + 1}
          </div>
        )
      }
      // if numbered add a styling class
      let classes = classNames("PotiIndicator", {
        _numbered: this.props.numbered
      })
      // returns the complete marker
      return (
        <div className={classes} style={styles.marker}>
          {number}
          {label}
        </div>
      )
    })

    // component styles
    this.styles = PREFIXER.prefix({
      poti: {
        position: "relative",
        height: parseInt(this.size, 10) + this.margin * 2,
        width: parseInt(this.size, 10) + this.margin * 2,
        cursor: "crosshair"
      },
      knob: {
        userSelect: "none",
        position: "relative",
        background: "currentColor",
        borderRadius: "100%",
        height: this.size / 2,
        width: this.size / 2,
        transform: "translate(-50%,-50%)",
        position: "absolute",
        top: "50%",
        left: "50%",
        pointerEvents: "none"
      },
      marker: {
        height: this.center - this.margin,
        width: 2,
        position: "absolute",
        top: "50%",
        left: "50%",
        boxShadow: "0 -1em 0 -1px currentColor inset",
        pointerEvents: "none"
      },
      label: {
        fontFamily: "sans-serif",
        fontSize: 6,
        display: "flex",
        marginBottom: "1em",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        textTransform: "uppercase"
      },
      value: {
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        background: "white",
        color: "black",
        borderRadius: 2,
        padding: 5,
        fontFamily: "sans-serif",
        fontSize: 8,
        zIndex: 10,
        pointerEvents: "none"
      }
    })
  }

  componentWillMount () {
    // make sure inital options are applied
    this.updateValue(this.initialDeg)
  }

  /**
   * returns the closest step to an angle
   * @param  {Number} deg position to look for a step
   * @return {Integer}    returns the step
   */
  getStep (deg) {
    let diff = this.startAngle % this.step
    let step = deg - deg % this.step + diff
    return step
  }

  /**
   * get the degree from the pointer
   * @param  {Object} pointer  {x,y} values of the cursor
   * @return {Number}         returns the rotation of the knob
   */
  getDeg (pointer) {
    let x = pointer.x - this.center
    let y = pointer.y - this.center
    let deg = Math.atan(y / x) * 180 / Math.PI
    // fill the circle
    if ((x < 0 && y >= 0) || (x < 0 && y < 0)) {
      deg += 90
    } else {
      deg += 270
    }
    // in case snapping is activated convert to step
    let step = deg
    if (this.props.snap) {
      step = this.getStep(deg)
    }
    // set bounds of the rotation angle
    let finalDeg = Math.min(Math.max(this.startAngle, step), this.endAngle)
    return finalDeg
  }

  /**
   * get the pointer from the event
   * @param  {Event} e the event
   * @return {Object}  returns a simplified object
   */
  getCoord (e) {
    e = e.nativeEvent
    let x = e.offsetX || e.layerX
    let y = e.offsetY || e.layerY
    return {
      x: x,
      y: y
    }
  }

  /**
   * handle mousedown events and allows dragging
   * @param  {Event} e the event
   */
  onMouseDown (e) {
    e.preventDefault()
    let pointer = this.getCoord(e)
    let deg = this.getDeg(pointer)
    this.updateValue(deg)
    this.setState({
      down: true
    })
  }

  /**
   * handle mousemove events and updates the value
   * @param  {Event} e the event
   */
  onMouseMove (e) {
    e.preventDefault()
    if (!this.state.down) {
      return
    }
    let pointer = this.getCoord(e)
    let deg = this.getDeg(pointer)
    this.updateValue(deg)
  }

  /**
   * handle mouseup events and disallows dragging
   * @param  {Event} e the event
   */
  onMouseUp (e) {
    e.preventDefault()
    this.setState({
      down: false
    })
  }

  /**
   * update the value from a given angle
   * @param  {Number} deg the rotation of the knob
   * @callback        calls `this.props.onUpdate`for component communication
   */
  updateValue (deg) {
    // calculate the value from the angle
    let value = Math.round(
      (deg - this.startAngle) / this.fullAngle * (this.range[1] - this.range[0])
    ) + this.range[0]
    if (this.props.resolution) {
      value = Math.round(value * this.props.resolution * 100) / 100
    }
    // get the label for the given value
    let label = this.steps[value] && this.steps[value].label
    // if not a range and a label is present
    // the label will be returned
    if (label && !this.props.range) {
      value = label
    }
    // update the state
    this.setState({
      deg: deg,
      value: value
    })
    // call the callback function
    if (typeof this.props.onUpdate === "function") {
      this.props.onUpdate(value)
    }
  }

  render () {
    // add dynamic styles to the component styles
    let dynamicStyles = PREFIXER.prefix({
      marker: {
        transform: `translate(-50%, -50%)
                    rotate(${this.state.deg}deg)`
      }
    })

    Object.assign(this.styles.marker, dynamicStyles.marker)
    let styles = this.styles

    // show a value as tooltip while dragging/mousedown
    let value
    // if (this.state.down) {
    //  value = <div style={ styles.value }>
    //            { this.state.value }
    //          </div>
    // }
    // build the label
    let labelsAbove, labelsBelow, label2, labels
    if (this.props.label) {
      labels = (
        <label style={styles.label}>
          <div>{this.props.label}</div>
          <div>{this.props.label2}</div>
        </label>
      )
    }
    if (this.props.labelsBelow) {
      labelsBelow = labels
    } else {
      labelsAbove = labels
    }
    let classes = classNames(this.props.className, "Poti")
    return (
      <div
        className={classes}
        style={{ position: "relative", display: "inline-block" }}
      >
        {labelsAbove}
        {value}
        <div
          className="TouchField @decorator"
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          onMouseLeave={this.onMouseUp}
          style={styles.poti}
        >
          <div className="PotiKnob" style={styles.knob}>
            <div className="PotiMarker" style={styles.marker} />
          </div>
          <div className="PotiIndicators" style={{ pointerEvents: "none" }}>
            {this.indicators}
          </div>
        </div>
        {labelsBelow}
      </div>
    )
  }
}

/**
 * @class Step defines a step with three states [off,selected,active]
 * @property {Boolean} selected  initial selected state
 * @property {Boolean} active    active state
 * @property {Integer} count     number above && index + 1
 * @property {Integer} rhythm    number below
 * @property {Function}       onUpdate  a callback to communicate with other
 *                                      components
 */
class Step extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    // set initial state
    this.state = {
      selected: this.props.selected
    }
    // component styles
    this.styles = PREFIXER.prefix({
      step: {
        position: "relative",
        height: 55,
        width: 26,
        margin: "20px 6px 30px",
        backgroundColor: "currentColor"
      },
      light: {
        position: "absolute",
        top: 5,
        height: 5,
        width: 5,
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "100%"
      },
      glow: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        borderRadius: "inherit"
      },
      count: {
        position: "absolute",
        bottom: "100%",
        left: 0,
        marginBottom: 5,
        fontSize: 8,
        width: "100%",
        textAlign: "center",
        fontFamily: "sans-serif"
      },
      rhythm: {
        position: "absolute",
        top: "100%",
        left: this.props.count === 13 ? -2 : this.props.count === 1 ? -60 : -6,
        right: this.props.count === 12
          ? -2
          : this.props.count === 16 ? -12 : -6,
        marginTop: 10,
        paddingTop: 1,
        paddingBottom: 1,
        paddingLeft: this.props.count === 13
          ? 2
          : this.props.count === 1 ? 60 : 6,
        paddingRight: this.props.count === 12
          ? 2
          : this.props.count === 16 ? 12 : 6,
        fontSize: 12,
        lineHeight: 1,
        borderRadius: this.props.count === 12
          ? "0 2px 2px 0"
          : this.props.count === 13 ? "2px 0 0 2px" : false,
        textAlign: "center",
        fontFamily: "sans-serif"
      }
    })
  }

  /**
   * handle clicks and toggle the state
   * @param  {Event} e the event
   */
  onClick (e) {
    let selected = this.props.selected
    selected = !selected

    // send action to parent
    // no internal state
    if (typeof this.props.onUpdate === "function") {
      this.props.onUpdate(this.props.count - 1, selected)
    }
  }

  render () {
    let classes = classNames("Step", this.props.className, {
      selected: this.props.selected,
      active: this.props.active
    })

    // add dynamic styles
    let dynamicStyles = {
      light: {
        backgroundColor: this.props.selected || this.props.active
          ? "red"
          : "black"
      }
    }

    Object.assign(this.styles.light, dynamicStyles.light)

    let styles = this.styles

    return (
      <div className={classes} onClick={this.onClick} style={styles.step}>
        <div className="count" style={styles.count}>
          {this.props.count}
        </div>
        <div className="rhythm" style={styles.rhythm}>
          {this.props.rhythm}
        </div>
        <div className="StepLight" style={styles.light}>
          <div className="glow" style={styles.glow} />
        </div>
      </div>
    )
  }
}

/**
 * @class Toggle creates a toggle with multiple steps and an optinal visual stem
 * @property {Array|Integer}  steps       if given an Array of values they will
 *                                        be used as labels
 *                                        if given an Integer it defines
 *                                        snappable points and/or return values.
 *                                        - required
 * @property {Integer}        activeLight the active light index
 * @property {Integer}        selected    initially selected state
 * @property {String}         label       optionally show label
 * @property {Boolean}        stem        optionally show a visual stem
 * @property {Boolean}        horizontal  optionally show as horizontal
 * @property {Array}          lights      an array of Integers
 *                                        if the Integer equals the selected
 *                                        index the light is on. this allows to
 *                                        render lights for speciffic selections
 * @property {Function}       onUpdate    a callback to communicate with other
 *                                        components
 */
class Toggle extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.onClick = this.onClick.bind(this)
    this.size = 14
    // save stem for easy access
    this.stem = this.props.stem
    // save lights for easy access
    this.lights = this.props.lights
    // support horizontal layout (vetical is default)
    this.horizontal = this.props.orientation === "horizontal"
    // build steps
    this.steps = []
    let isNumber = typeof this.props.steps === "number"
    if (isNumber) {
      let n = this.props.steps
      while (n--) {
        this.steps.push("")
      }
    } else {
      this.steps = this.props.steps
    }
    // build labels from steps
    this.labels = this.steps.map((item, index) => {
      // label styles
      // make sure we handle the orientation correctly
      let styles = PREFIXER.prefix({
        label: {
          position: "absolute",
          top: this.horizontal ? "100%" : index * this.size,
          left: this.horizontal ? index * this.size : "100%",
          pointerEvents: "none",
          fontSize: 6,
          fontFamily: "sans-serif",
          paddingLeft: this.horizontal ? 0 : 2,
          paddingTop: this.horizontal ? 2 : 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: this.size,
          width: this.size
        }
      })

      return (
        <div style={styles.label}>
          {item}
        </div>
      )
    })

    // component styles
    // handle orientation
    this.styles = PREFIXER.prefix({
      toggle: {
        position: "relative",
        height: this.horizontal ? this.size / 2 : this.steps.length * this.size,
        width: this.horizontal ? this.steps.length * this.size : this.size / 2,
        margin: "5px auto 20px",
        cursor: "pointer"
      },
      switch: {
        position: "absolute",
        height: this.horizontal ? this.size - 4 : this.size,
        width: this.horizontal ? this.size : this.size - 4,
        top: this.horizontal ? "50%" : 0,
        left: this.horizontal ? 0 : "50%",
        marginLeft: 1,
        backgroundColor: "currentColor",
        pointerEvents: "none",
        transition: "transform 0.2s"
      },
      stem: {
        pointerEvents: "none",
        position: "absolute",
        top: "50%",
        left: "50%",
        transformOrigin: this.horizontal ? "0% 50%" : "50% 0%",
        height: this.horizontal ? this.size - 4 : `${50 * this.steps.length}%`,
        width: this.horizontal ? `${50 * this.steps.length}%` : this.size - 4,
        transition: "transform 0.2s"
      },
      cap: {
        position: "absolute",
        top: "50%",
        left: "50%",
        height: this.size,
        width: this.size,
        transition: "transform 0.2s"
      },
      label: {
        fontSize: 8,
        fontFamily: "sans-serif",
        textTransform: "uppercase",
        margin: "10px 0"
      },
      lights: {
        height: this.horizontal ? 22 : "100%",
        width: this.horizontal ? "100%" : 22,
        boxSizing: "border-box",
        display: "flex",
        margin: this.horizontal ? "0 0 6px" : "0",
        alignItems: "center",
        justifyContent: "space-between",
        top: this.horizontal ? "100%" : "0%",
        left: this.horizontal ? "100%" : "100%",
        backgroundColor: "currentColor",
        padding: "0 6px",
        transform: `scale(0.6)`
      }
    })

    // set initial state
    this.state = {
      selected: this.props.selected || 0
    }
  }

  /**
   * handle clicks and toggle the state
   * @param  {Event} e the event
   */
  onClick (e) {
    // use native event to get access to e.offset{X,Y} and/or e.layer{X,Y}
    e = e.nativeEvent
    // use offset or layer
    // and respect orientation
    let offset = e.offsetY || e.layerY
    if (this.horizontal) {
      offset = e.offsetX || e.layerX
    }

    let length = this.steps.length
    // calculate selected
    let selected = Math.round(offset / (length * this.size) * length - 0.5)
    // ensure bounds
    selected = Math.max(0, Math.min(length - 1, selected))
    // update state
    this.setState({
      selected: selected
    })

    if (typeof this.props.onUpdate === "function") {
      this.props.onUpdate(selected)
    }
  }

  render () {
    let classes = classNames("Toggle", this.props.classNames, {
      _horizontal: this.horizontal,
      _stem: this.stem
    })

    // offset the switch to the current selected index
    let switchOffset = this.state.selected * this.size
    // build the stem
    let stem = 1
    if (this.stem) {
      let stemOffset = (this.steps.length - 1) / 2
      let baseAngle = Math.PI / this.steps.length
      stem = Math.sin((this.state.selected - stemOffset) * baseAngle)
    }

    // extend styles
    let dynamicStyles = PREFIXER.prefix({
      switch: {
        transform: this.horizontal
          ? `translate(${switchOffset}px, -50%)`
          : `translate(-50%,${switchOffset}px)`
      },
      stem: {
        transform: `scale${this.horizontal ? "X" : "Y"}(${stem * (-1)})
                    translate${this.horizontal ? "Y" : "X"}(-50%)
                    translate${this.horizontal ? "X" : "Y"}(${this.size / (-4)}px)`
      },
      cap: {
        transform: `translate(-50%,-50%)
                    scale${this.horizontal ? "X" : "Y"}(${1.1 - Math.abs(stem / 2)})
                    scale${this.horizontal ? "Y" : "X"}(${1.0 - Math.abs(stem / 5)})`
      }
    })

    Object.assign(this.styles.switch, dynamicStyles.switch)
    Object.assign(this.styles.stem, dynamicStyles.stem)
    Object.assign(this.styles.cap, dynamicStyles.cap)

    let styles = this.styles
    // render optional elements
    let stemElement, label, lights
    // stem
    if (this.stem) {
      stemElement = (
        <div>
          <div className="stem" style={styles.stem} />
          <div className="cap" style={styles.cap} />
        </div>
      )
    }
    // label
    if (this.props.label) {
      label = (
        <div style={styles.label}>
          {this.props.label}
        </div>
      )
    }
    // lights
    if (this.lights) {
      // map lights to include the selected state
      let allLights = this.lights.map((item, index) => {
        let styles = {
          light: {
            height: 12,
            width: 12,
            borderRadius: "100%",
            background: index === this.props.activeLight ? "red" : "black"
          }
        }
        return <div className="light" style={styles.light} />
      })
      lights = (
        <div style={styles.lights}>
          {allLights}
        </div>
      )
    }

    return (
      <div>
        {label}
        <div className={classes} style={styles.toggle} onClick={this.onClick}>
          <div className="ToggleSwitch" style={styles.switch}>
            {stemElement}
          </div>
          <div className="labels">
            {this.labels}
          </div>
        </div>
        {lights}
      </div>
    )
  }
}

/**
 * @class  Scale displays a scale for a rhythm
 * @property {Array}   measure  an Array of [1,0,0...] Arrays where the
 *                              1 or 0 define a note
 * @property {Integer} swing    shows a bow from 0 to this note (index)
 */
class Scale extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.styles = PREFIXER.prefix({
      scale: {
        display: "flex",
        width: "100%",
        justifyContent: "space-around"
      }
    })
    // map measures
    this.measures = this.props.measures.map((items, index) => {
      let lastItem = index === this.props.measures.length - 1
      let swing = this.props.swing
      // measures styles
      let styles = PREFIXER.prefix({
        measure: {
          overflow: "hidden",
          display: "flex",
          justifyContent: "space-around",
          flex: items.length,
          padding: "6px 0 0",
          margin: "2px 0",
          borderTopRightRadius: swing && lastItem ? 0 : false,
          borderBottomRightRadius: swing && lastItem ? 0 : false
        }
      })

      // map notes from item
      let notes = items.map((item, index) => {
        let styles = PREFIXER.prefix({
          note: {
            position: "relative",
            flex: "0 0 26px",
            display: "flex",
            justifyContent: "center",
            fontSize: 14
          },
          bow: {
            position: "absolute",
            top: -3,
            left: 18,
            width: `${Math.floor((swing || 0) / 2) * 2 * 130 + Math.pow(swing, 2) * 1.5}%`,
            height: 8,
            borderRadius: "100%",
            boxShadow: "0 -1px 0"
          }
        })
        let bow
        // add the bow if needed
        if (swing && index === 0) {
          bow = <div className="note-bow" style={styles.bow} />
        }
        let note
        // only show if item == 1 (true) and not if item == 0 (false)
        if (item) {
          note = "♪"
        }

        return (
          <div className="note" style={styles.note}>
            {note}
            {bow}
          </div>
        )
      })

      return (
        <div className="ScaleMeasure" style={styles.measure}>
          {notes}
        </div>
      )
    })
  }

  render () {
    let styles = this.styles
    return (
      <div className="Scale" style={styles.scale}>
        {this.measures}
      </div>
    )
  }
}

/**
 * @class  Button creates a simple button with a callback
 * @property {Function} onClick passes a fubction to clicks
 */
class Button extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (prop) {
    super(prop)
    this.onClick = this.onClick.bind(this)
    this.styles = PREFIXER.prefix({
      button: {
        display: "inline-flex",
        height: 40,
        minWidth: 40,
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        textTransform: "uppercase",
        fontSize: 10,
        fontFamily: "sans-serif",
        margin: "4px auto",
        cursor: "pointer",
        userSelect: "none"
      }
    })
  }
  /**
   * handle clicks and call the callback
   * @param  {Event} e the event
   */
  onClick (e) {
    if (typeof this.props.onClick === "function") {
      this.props.onClick()
    }
  }

  render () {
    let classes = classNames("Button", this.props.className)
    let styles = this.styles
    return (
      <div className={classes} onClick={this.onClick} style={styles.button}>
        {this.props.children}
      </div>
    )
  }
}

/**
 * class Instrument creates a channel for an instrument
 * @property {Integer} index  the index of the instrument on the board
 * @property {Array}   potis   a list of potis to render/use inside the channel
 * @property {Array}   label   expects an array since an instrument can have
 *                             two labels. can render smallcaps style titles
 *                             - syntax: *C*apitals c*A*n *BE* *E*ve*R*ywhere
 */
class Instrument extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.onToggle = this.onToggle.bind(this)
    this.poti_0 = this.poti_0.bind(this)
    this.poti_1 = this.poti_1.bind(this)
    this.poti_2 = this.poti_2.bind(this)
    // create names from the labels
    this.names = this.props.label.map((item, index) => {
      // look for ampersands to identify capitals
      let parts = item.split("*")
      let word = parts.map((item, index) => {
        let group = item
        // every even match is a capital
        if (Math.floor(index / 2) !== Math.round(index / 2)) {
          group = <span style={{ fontSize: "1.75em" }}>{item}</span>
        }
        return group
      })
      return word
    })
    // show potis for channel
    this.potis = this.props.potis.map((item, index) => {
      let poti
      // optionally show an empty space (lyout,visual)
      if (!item.empty) {
        let potiCallback = `poti_${index}`
        poti = (
          <Poti
            className={item.className}
            label={item.label}
            size={item.size}
            onUpdate={this[potiCallback]}
            fullAngle={item.fullAngle}
            markers={item.markers}
            resolution={item.resolution}
            value={item.value}
            range={item.range}
          />
        )
      } else {
        poti = <div style={{ height: this.props.potis[index - 1].size * 2 }} />
      }
      return (
        <div>
          {poti}
        </div>
      )
    })

    let styles = PREFIXER.prefix({
      instrument: {
        cursor: "default",
        display: "inline-flex",
        flexDirection: "column"
      },
      name: {
        fontSize: 6,
        fontFamily: "sans-serif",
        textTransform: "uppercase"
      }
    })

    // add first name
    let names = []
    names.push(
      <div className="InstrumentName" style={styles.name}>
        {this.names[0]}
      </div>
    )
    // render a toggle and show the second label if given
    if (this.names[1]) {
      names.push(
        <div
          style={
            PREFIXER.prefix({
              style: {
                display: "flex",
                flexDirection: "column"
              }
            }).style
          }
        >
          <div
            style={
              PREFIXER.prefix({
                style: {
                  height: 40,
                  display: "flex",
                  flexDirection: "column"
                }
              }).style
            }
          >
            <span
              style={
                PREFIXER.prefix({
                  style: {
                    flex: 1
                  }
                }).style
              }
            />
            <Toggle steps={2} onUpdate={this.onToggle} selected={1} />
            <span
              style={
                PREFIXER.prefix({
                  style: {
                    flex: 1
                  }
                }).style
              }
            />
          </div>
          <div className="InstrumentName" style={styles.name}>
            {this.names[1]}
          </div>
        </div>
      )
    }

    // map new values
    this.styles = styles
    this.names = names
    this.spacer = (
      <span
        style={
          PREFIXER.prefix({
            style: {
              flex: 1
            }
          }).style
        }
      />
    )
  }

  /**
   * Poti callbacks
   */
  poti_0 (value) {
    if (typeof this.props.onInstrumentPoti_0 === "function") {
      this.props.onInstrumentPoti_0(this.props.index, value)
    }
  }
  poti_1 (value) {
    if (typeof this.props.onInstrumentPoti_1 === "function") {
      this.props.onInstrumentPoti_1(this.props.index, value)
    }
  }
  poti_2 (value) {
    if (typeof this.props.onInstrumentPoti_2 === "function") {
      this.props.onInstrumentPoti_2(this.props.index, value)
    }
  }

  /**
   * toggles the primary secondary instrument
   * @param {Integer}  selected  should be 0 or 1
   */
  onToggle (selected) {
    if (typeof this.props.onToggle === "function") {
      this.props.onToggle(this.props.index, selected)
    }
  }

  render () {
    let styles = this.styles

    return (
      <div className="Instrument" style={styles.instrument}>
        {this.potis}
        {this.spacer}
        {this.names[0]}
        {this.names[1]}
      </div>
    )
  }
}

/**
 * class Sequencer defines a collection of steps that can edit the pattern
 * of the selected track
 * @property {Integer} activeStep lights a step if active while playing
 * @property {Array}   pattern    defines the steps that are selected (visual)
 * @property {Array}   part       defines which part of the pattern to edit (0,1 equals A,B)
 */
class Sequencer extends React.Component {
  /**
   * construct the component
   * @param  {Object} props sent via Component call
   *                        see list of properties in comment above
   */
  constructor (props) {
    super(props)
    this.setStep = this.setStep.bind(this)
    // wrapper styles
    this.styles = PREFIXER.prefix({
      stepsWrapper: {
        display: "flex",
        flex: 1
      }
    })
  }

  /**
   * toggles a step and sends a callback
   * @param {Integer} index     the index of the step
   * @param {Boolean} selected  selected state of the step
   */
  setStep (index, selected) {
    if (typeof this.props.onStepChange === "function") {
      this.props.onStepChange(index, selected)
    }
  }

  render () {
    // desine steps inside the render function to pass the activeStep
    // four different colors will be used to create collection
    let steps = ["red", "orange", "yellow", "white"].map((item, index) => {
      let stepCount = 4
      let steps = []
      let classes = classNames("_colored", item)
      let count = index * stepCount
      while (stepCount--) {
        // build rhythm numbers
        let rhythm = count % 12 + 1
        count++
        // check states
        let active = this.props.activeStep - this.props.part * 16 === count - 1
        let selected = this.props.pattern[count - 1 + this.props.part * 16]
        // add steps to collection
        steps.push(
          <Step
            className={classes}
            count={count}
            rhythm={rhythm}
            active={active}
            selected={selected}
            onUpdate={this.setStep}
          />
        )
      }
      return steps
    })

    /**
     * TODO: move step creation outside the render function
     *       and reduce impact
     */
    return (
      <div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              right: "100%",
              width: 60,
              paddingTop: 12
            }}
          >
            <div className="ScaleToggler">
              <Toggle steps={[1, 2, 3, 4]} />
            </div>
            <div className="Arrow right grey">STEP NO</div>
            <div className="LightLabel">
              <div
                className="light"
                style={{
                  borderRadius: "100%",
                  height: 8,
                  width: 8,
                  background: this.props.part === 0 ? "red" : "black",
                  margin: "1em"
                }}
              />
              1st PART
            </div>
            <div className="LightLabel">
              <div
                className="light"
                style={{
                  borderRadius: "100%",
                  height: 8,
                  width: 8,
                  background: this.props.part === 1 ? "red" : "black",
                  margin: "1em"
                }}
              />
              2nd PART
            </div>
          </div>
          <div>
            <Scale
              swing={2}
              measures={[
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
                [1]
              ]}
            />
            <Scale
              swing={5}
              measures={[[1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 1, 0], [1, 0, 1, 0]]}
            />
            <Scale
              measures={[
                [1, 0, 0, 0],
                [1, 0, 0, 0],
                [1, 0, 0, 0],
                [1, 0, 0, 0]
              ]}
            />
            <Scale
              measures={[[1, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0]]}
            />
          </div>
        </div>
        <div style={this.styles.stepsWrapper}>
          {steps}
        </div>
      </div>
    )
  }
}

/**
 * class Eight_O_Eight is the actual instrument
 * It loads an instance of Tone.js (https://github.com/Tonejs/Tone.js)
 * to play the sounds.
 * patterns are stored inside the component and then used by Tone.js
 * Currently activated controls:
 *   - Mater volume       : changes the master volume
 *   - Tempo              : changes the bpm
 *   - Instrument-select  : changes the track
 *   - Start/Stop         : starts or stops the loop
 *   - Sequencer          : Steps change the pattern of the selected track
 *   - Instrument toggle  : the second instrument on some chanels (lc,mc,hc,cl,ma)
 *   - Instrument volume  : volume of single tracks (level)
 */
class Eight_O_Eight extends React.Component {
  /**
   * construct the component
   * This component has no properties as it is meant as an app
   * depending on the changes it might get a `samples` property to load different sets.
   */
  constructor () {
    super()
    this.steps = 32
    let emptyPattern = []
    for (let i = 0; i < this.steps; i++) {
      emptyPattern.push(false)
    }
    this.state = {
      track: 1,
      pattern: emptyPattern,
      activeStep: -1,
      activePart: 0,
      editingPart: 0,
      style: 0
    }
    this.initBPM = 132
    this.toggleStyle = this.toggleStyle.bind(this)
    this.togglePlay = this.togglePlay.bind(this)
    this.createSequencer = this.createSequencer.bind(this)
    this.setTempo = this.setTempo.bind(this)
    this.onStepChange = this.onStepChange.bind(this)
    this.setStep = this.setStep.bind(this)
    this.updatePattern = this.updatePattern.bind(this)
    this.changeTrack = this.changeTrack.bind(this)
    this.changeMasterVolume = this.changeMasterVolume.bind(this)
    this.onInstrumentToggle = this.onInstrumentToggle.bind(this)
    this.onInstrumentLevel = this.onInstrumentLevel.bind(this)
    this.onInstrumentPoti_1 = this.onInstrumentPoti_1.bind(this)
    this.onInstrumentPoti_2 = this.onInstrumentPoti_2.bind(this)
    this.createSampler = this.createSampler.bind(this)
    this.onBasicVariation = this.onBasicVariation.bind(this)
    this.toggleEditingPart = this.toggleEditingPart.bind(this)

    this.basicVariation = 0
    // build the matrix for later manipulation
    this.tracksMap = {}
    this.matrix = {}
    for (let i = 0; i < this.steps; i++) {
      this.matrix[i] = {}
    }
    // extend the matrix by our instruments
    // and build the track map
    INSTRUMENTS.forEach((item, index) => {
      for (let i = 0; i < this.steps; i++) {
        this.matrix[i][index] = 0
      }
      this.tracksMap[index] = {
        selected: 0,
        poti1: item.potis[1] ? "50" : false,
        poti2: item.potis[2] ? "50" : false,
        tracks: item.tracks
      }
      if (item.potis[1] && item.potis[1].empty) {
        this.tracksMap[index].poti1 = false
      }
    })
    // let"s make sure the pattern is initially set
    this.updatePattern()
    // predefine the tracks
    this.instruments = INSTRUMENTS.map((item, index) => {
      return (
        <Instrument
          name={item.name}
          label={item.label}
          index={index}
          handle={item.handle}
          potis={item.potis}
          onInstrumentPoti_0={this.onInstrumentLevel}
          onInstrumentPoti_1={this.onInstrumentPoti_1}
          onInstrumentPoti_2={this.onInstrumentPoti_2}
          onToggle={this.onInstrumentToggle}
        />
      )
    })
    // buoild the data for the potis
    this.tracksPoti = INSTRUMENTS.map(item => ({
      label: item.handle
    }))
    this.measuresPoti = ["manual", 16, 12, 8, 4, 2].map(item => ({
      label: item
    }))
    this.tempoPoti = ["0", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(item => ({
      label: item
    }))
    this.masterVolumePoti = [
      "min",
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      "max"
    ].map(item => ({
      label: item
    }))
    this.patternWritePoti = [
      "pattern clear",
      "1st PART",
      "2nd PART",
      "manual play",
      "play",
      "com- pose"
    ].map(item => ({
      label: item
    }))
    this.screws = []
    for (let i = 0; i < 16; i++) {
      this.screws.push(<div className="Screw" />)
    }

    // component styles
    this.styles = PREFIXER.prefix({
      name: {
        fontFamily: "Josefin Sans, sans-serif",
        fontSize: 40,
        position: "relative",
        display: "flex",
        flex: 1,
        flexWrap: "wrap",
        paddingRight: 30,
        lineHeight: 1,
        justifyContent: "flex-end",
        alignItems: "baseline"
      },
      underline: {
        position: "absolute",
        top: "1em",
        left: 0,
        width: "100%",
        height: 2,
        background: "currentColor",
        marginTop: "-0.175em"
      },
      eightoeight: {
        display: "flex",
        flexDirection: "column",
        width: 980
      },
      top: {
        display: "flex"
      },
      flexBox: {
        display: "flex"
      },
      patternWrite: {
        display: "flex",
        justifyContent: "flex-end",
        paddingRight: 40,
        paddingLeft: 20
      },
      flexBoxFlex: {
        display: "flex",
        flex: 1
      },
      flexBoxCenter: {
        display: "flex",
        alignItems: "center"
      },
      flexBoxColumn: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column"
      },
      mainControl: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        width: 200
      },
      tapArea: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        width: 140
      },
      blackLine: {
        height: 2,
        background: "currentColor",
        width: "calc(100% - 10px)",
        margin: "10px 0"
      }
    })
    // build the sequencer with Tone.js
    this.createSequencer()
  }

  /**
   * toggles the editing part of the sequencer
   * @param {Integer}  selected  either 0 or 1
   */
  toggleEditingPart (selected) {
    this.setState({ editingPart: selected })
  }

  /**
   * callback for basic variation changes
   * @param {Integer}  selected  either 0, 1 or 2
   */
  onBasicVariation (selected) {
    this.basicVariation = selected
    this.loop.loopStart = "0m"
    this.loop.loopEnd = "1m"
    if (this.basicVariation > 0) {
      this.loop.loopEnd = "2m"
    }
    if (this.basicVariation > 1) {
      this.loop.loopStart = "1m"
    }
  }

  /**
   * callback for instrument toggles
   * @param {Integer}  index     index of the insrument on the board
   * @param {Integer}  selected  either 0 or 1
   */
  onInstrumentToggle (index, selected) {
    // change direction due to layout direction
    selected = selected === 1 ? 0 : 1
    this.tracksMap[index].selected = selected
  }
  /**
   * callback for instrument volumes
   * @param {Integer}  index     index of the insrument on the board
   * @param {Integer}  db        value from 1 to 127
   */
  onInstrumentLevel (index, db) {
    if (index > 0) {
      let value = (db - 127 / 2) / 4
      this.samplers[index].volume.value = value
    }
  }

  /**
   * callback for instrument poti 1
   * @param {Integer}  index     index of the insrument on the board
   * @param {Integer}  value     value from 0 to 100 in steps of 25
   */
  onInstrumentPoti_1 (index, value) {
    this.tracksMap[index].poti1 = value
  }

  /**
   * callback for instrument poti 2
   * @param {Integer}  index     index of the insrument on the board
   * @param {Integer}  value     value from 0 to 100 in steps of 25
   */
  onInstrumentPoti_2 (index, value) {
    this.tracksMap[index].poti2 = value
  }

  /**
   * creates the sequencer with Tone.js (see component description for more info)
   */
  createSequencer () {
    // use the Tone.Sampler to create the tracks (http://tonejs.org/docs/#Sampler)
    this.samplers = []
    this.loopSteps = []
    for (let i = 0; i < this.steps; i++) {
      this.loopSteps.push(i)
    }

    // push an empty object to fix the index for the accent channel
    this.samplers.push({})
    // then create all samplers
    this.createSampler(["BD"], 2)
    this.createSampler(["SD"], 2)
    this.createSampler(["LT", "LC"], 1)
    this.createSampler(["MT", "MC"], 1)
    this.createSampler(["HT", "HC"], 1)
    this.createSampler(["RS", "CL"], 0)
    this.createSampler(["CP", "MA"], 0)
    this.createSampler(["CB"], 0)
    this.createSampler(["CY"], 2)
    this.createSampler(["OH"], 1)
    this.createSampler(["CH"], 0)

    // define a loop on the component so we can control it
    this.loop = new Tone.Sequence(
      (time, col) => {
        var column = this.matrix[col]
        // on each iteration change the activeStep
        // this will be passed to our <Sequencer> component and
        // visually play the steps
        let steps = this.steps / 2

        this.setState({
          activeStep: col,
          activePart: Math.floor(col / steps) // requires a stop/start if chaged
          // TODO: fix it already!!!
        })
        // loop through all instruments
        // and play a tone for each true value in the pattern
        for (var i = 1; i < INSTRUMENTS.length; i++) {
          if (column[i] === true) {
            // get the correct sample from the map
            let track = this.tracksMap[i]
            let note = track.tracks[track.selected].toUpperCase()
            if (track.poti1 !== false) {
              note += `.${track.poti1}`
            }
            if (track.poti2 !== false) {
              note += `.${track.poti2}`
            }
            let velocity = column[0] ? 1.3 : 0.6
            this.samplers[i].triggerAttackRelease(note, "1m", time, velocity)
          }
        }
      },
      this.loopSteps,
      "16n"
    )
    this.loop.loopStart = "0m"
    this.loop.loopEnd = "1m"

    // set initial options to the sequencer and start the transport
    Tone.Transport.bpm.value = this.initBPM
    Tone.Transport.start()
    // hide the loading message when all buffers are loaded
    Tone.Buffer.on("load", () => {
      this.setState({
        buffersLoaded: true
      })
    })
  }

  /**
    * creates a sampler for the given instrument, respects the number of potis
    * @param {String}  handle    uppercase handle of the track
    * @param {Integer} potiCount number of potis. describes how many samples are loaded {0|1|2}
    */
  createSampler (handles, potiCount) {
    let steps = ["0", "25", "50", "75", "100"]
    let sampleMap = {}
    /**
     * get the value for the sample Name part
     * @param {String}  the string matches the value of the poti
     */
    let getValue = item => {
      let value = item
      if (item === "0") {
        value = "00"
      } else if (item === "100") {
        value = "10"
      }
      return value
    }
    // loop trough the  steps twice if needed
    // TODO: write a recusive function for this
    // some instruments have two different samples
    // lets add each as a main channel
    handles.forEach((handle, index) => {
      handle = handle.toUpperCase()
      // while the level poti does not count
      // ==>
      // no poti will create 1 sound in total
      sampleMap[handle] = `${BUCKET + handle}.WAV`
      // first poti will create 5 sounds in total
      if (potiCount >= 1) {
        sampleMap[handle] = {}
        steps.forEach((item, index) => {
          let key = item
          let value = getValue(item)
          sampleMap[handle][key] = `${BUCKET + handle + value}.WAV`
          // second poti will create 25 sounds in total
          if (potiCount >= 2) {
            sampleMap[handle][key] = {}
            steps.forEach((item, index) => {
              let key2 = item
              let value2 = getValue(item)
              sampleMap[handle][key][
                key2
              ] = `${BUCKET + handle + value + value2}.WAV`
            })
          }
        })
      }
    })
    // send the sampler to the master and add it to the list
    let sampler = new Tone.Sampler(sampleMap).toMaster()
    this.samplers.push(sampler)
  }
  /**
   * starts and stops the loop
   */
  togglePlay () {
    let playing = this.state.playing
    this.playing = !this.playing
    if (this.playing) {
      this.loop.start()
    } else {
      this.loop.stop()
      // make sure we manually deactivate the activeStep
      this.setState({ activeStep: -1 })
    }
  }

  /**
   * sets the tempo
   * @param {Integer} bpm the beats per minute
   */
  setTempo (bpm) {
    Tone.Transport.bpm.value = bpm
  }

  /**
   * changes the track for the pattern display
   * @param  {Integer} handle lookup for the track
   */
  changeTrack (handle) {
    this.setState({
      track: handle
    })
    this.updatePattern(handle)
  }

  /**
   * changes the master volume
   * @param  {Number} db  decibel to change by
   */
  changeMasterVolume (db) {
    Tone.Master.volume.value = db
  }

  /**
   * sends the pattern to the state so the Sequencer can recognize it
   * @param  {Integer} track the index of the track column
   */
  updatePattern (track = this.state.track) {
    let pattern = []
    // set the correct steps in the pattern
    for (let step in this.matrix) {
      pattern.push(this.matrix[step][track])
    }
    this.setState({
      pattern: pattern
    })
  }

  /**
   * used in callback for the Sequencer
   * @param {Integer} index    index of step
   * @param {Boolean} selected state of step
   */
  setStep (index, selected) {
    let col = index + this.steps / 2 * this.state.editingPart
    this.matrix[col][this.state.track] = selected
    this.updatePattern()
  }

  /**
   * callback for sequencer calls setStep to send to the pattern
  * @param {Integer} index    index of step
  * @param {Boolean} selected state of step
   */
  onStepChange (index, selected) {
    this.setStep(index, selected)
  }

  /**
   * changes the style from original (Roland) to CodePen
   */
  toggleStyle () {
    let style = this.state.style === 1 ? 0 : 1
    this.setState({
      style: style
    })
  }

  render () {
    let loadingBuffers
    if (!this.state.buffersLoaded) {
      loadingBuffers = (
        <div className="LoadingBuffers">
          <div className="Loader"><div /><div /><div /></div>
          <div>Loading buffers, please be patient ...</div>
        </div>
      )
    }

    let styles = this.styles
    let tracks = this.tracksPoti
    let measures = this.measuresPoti
    let tempo = this.tempoPoti
    let masterVolume = this.masterVolumePoti
    let patternWrite = this.patternWritePoti
    let titleLeft = this.state.style === 1
      ? "Thank you followers"
      : "Rhythm Composer"
    let titleRight = this.state.style === 1 ? "CP-888" : "TR-808"
    let subTitle = this.state.style === 1
      ? "CodePen Controlled"
      : "Computer Controlled"
    let logo = this.state.style === 1 ? CODEPENLOGO : ROLANDLOGO

    let classes = classNames("Eight_0_Eight", {
      roland: this.state.style === 0,
      codepen: this.state.style === 1
    })
    return (
      <div className={classes} style={styles.eightoeight}>
        <div>
          {loadingBuffers}
          <div className="onOfflabels">
            <div>Power</div>
            <div>on</div>
            <div>off</div>
          </div>
          <Button className="onOffButton" onClick={this.toggleStyle} />
          <div className="Screws">{this.screws}</div>
          {logo}
        </div>
        <div className="top" style={styles.top}>
          <div className="left" style={{ width: 230 }}>
            <div style={styles.flexBox}>
              <div className="FAKECLEAR">
                <div>step number</div>
                <div>pre-scale</div>
                <div>track clear</div>
                <div className="FAKECLEARBUTTON" />
              </div>
              <div style={styles.patternWrite}>
                <Poti
                  className="pattern-write"
                  label="pattern write"
                  size="60"
                  snap
                  fullAngle={160}
                  value={4}
                  snap
                  range={[1, 6]}
                  steps={patternWrite}
                />
              </div>
              <Poti
                className="instrument-select"
                label="instrument-select"
                label2="rhythm track"
                size="60"
                snap
                value={1}
                numbered
                steps={tracks}
                range={[0, 11]}
                onUpdate={this.changeTrack}
              />
            </div>
            <div style={styles.flexBox}>
              <div style={{ width: 140, position: "relative" }}>
                <div className="tempoBoxBorder" />
                <Poti
                  label="tempo"
                  className="_ring"
                  size="130"
                  fullAngle="300"
                  markers={51}
                  value={this.initBPM}
                  range={[80, 200]}
                  steps={tempo}
                  onUpdate={this.setTempo}
                />
              </div>
              <div style={styles.flexBoxColumn}>
                <Poti
                  className="measures"
                  label="measures"
                  label2="auto fill in"
                  size="60"
                  snap
                  fullAngle="160"
                  steps={measures}
                  labelsBelow
                />
                <Poti
                  label="fine"
                  className=""
                  size="40"
                  resolution={0.2}
                  fullAngle="340"
                  range={[-5, 5]}
                  value={5}
                  steps={[
                    { label: "slow" },
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    {},
                    { label: "fast" }
                  ]}
                />
              </div>
            </div>
          </div>
          <div className="right">
            <div style={styles.flexBox}>
              {this.instruments}
            </div>
            <div style={styles.flexBoxCenter}>
              <div className="title-area" style={styles.name}>
                <span
                  className="primary"
                  style={{ position: "relative", zIndex: 1, paddingRight: 30 }}
                >
                  {titleLeft}
                </span>
                <span
                  className="primary"
                  style={{ position: "relative", zIndex: 1, fontSize: "0.5em" }}
                >
                  {titleRight}
                </span>
                <span className="underline" style={styles.underline} />
                <span className="secondary">{subTitle}</span>
              </div>
              <div style={{ margin: "5px 20px 0" }}>
                <Poti
                  label="master volume"
                  size="60"
                  fullAngle="300"
                  range={[-30, 30]}
                  value={0}
                  labelsBelow
                  steps={masterVolume}
                  onUpdate={this.changeMasterVolume}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bottom" style={styles.flexBox}>
          <div className="main-control" style={styles.mainControl}>
            <div>
              <div>
                <Toggle
                  stem
                  label="basic-variation"
                  orientation="horizontal"
                  lights={[0, 2]}
                  activeLight={this.state.activePart}
                  onUpdate={this.onBasicVariation}
                  steps={["A", "AB", "B"]}
                />
              </div>
            </div>
            <div style={styles.blackLine} />
            <Button onClick={this.togglePlay}>
              <div style={{ textAlign: "center", padding: "0 10px" }}>
                <div style={{ padding: "0 20px" }}>
                  Start
                </div>
                <div style={{ height: 1, background: "currentColor" }} />
                <div style={{ padding: "0 20px" }}>
                  Stop
                </div>
              </div>
            </Button>
            <div className="Arrow right basic-rhythm">basic rhythm</div>
          </div>
          <Sequencer
            activeStep={this.state.activeStep}
            onStepChange={this.onStepChange}
            pattern={this.state.pattern}
            part={this.state.editingPart}
            activePart={this.state.activePart}
          />
          <div className="tap-area" style={styles.tapArea}>
            <div>
              <Toggle
                stem
                label="I/F — variation"
                orientation="horizontal"
                steps={["A", "B"]}
                onUpdate={this.toggleEditingPart}
              />
            </div>
            <div style={styles.blackLine} />
            <div
              style={{
                margin: "4px 2px",
                height: 20,
                fontFamily: "sans-serif",
                fontSize: 8,
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 1
              }}
            >
              intro set
              <div
                style={{
                  height: 1,
                  background: "currentColor",
                  width: "100%",
                  margin: "2px 0"
                }}
              />
              {" "}Fill in trigger
            </div>
            <Button onClick={this.onTap}>
              <div style={{ textAlign: "center", padding: "0 10px" }}>
                Tap
              </div>
            </Button>
            <div className="Arrow left">intro/fill in</div>
          </div>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<Eight_O_Eight />, document.body)
