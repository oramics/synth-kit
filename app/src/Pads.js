import React from "react";
import classNames from "classnames"

const Pad = ({ letter, pressed }) => (
  <div className={classNames("Pad", { pressed })}>{letter} {pressed}</div>
)

const Pads = ({ letters, pressed }) => (
  <div className="Pads">
    {letters.map(letter => (
      <Pad key={letter} letter={letter} pressed={pressed.indexOf(letter) !== -1} />
    ))}
  </div>
)
export default Pads
