import { Component } from "react";

/**
 * Handle the key down/up mechanism globally
 * Props:
 * - detect: an array of letters to be detected
 * - onKeyDown
 * - onKeyUp
 */
export default class KeyHandler extends Component {
  constructor (props) {
    super(props)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    const detect = props.detect || []
    this.selection = detect.reduce((keys, k) => {
      keys[k] = false
      return keys
    }, {})
  }
  render () {
    return null
  }
  componentDidMount () {
    window.document.addEventListener("keydown", this.handleKeyDown)
    window.document.addEventListener("keyup", this.handleKeyUp)
  }
  componentWillUnmount () {
    window.document.removeEventListener("keydown", this.handleKeyDown)
    window.document.removeEventListener("keyup", this.handleKeyUp)
  }
  handleKeyDown(e) {
    const sel = this.selection
    const k = e.key.toUpperCase()
    if (sel[k] === false) {
      sel[k] = true
      this.props.onKeyDown(k)
    }
  }
  handleKeyUp(e) {
    const sel = this.selection
    const k = e.key.toUpperCase()
    if (sel[k] === true) {
      sel[k] = false
      this.props.onKeyUp(k)
    }
  }
}
