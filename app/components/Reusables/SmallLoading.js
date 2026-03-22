import React from "react"

function SmallLoading(props) {
  return (
    <div
      className="loading-cont"
      style={{
        position: props.position,
        top: props.top,
        left: props.left,
        height: props.heigth,
        transform: props.transform,
        position: props.position,
      }}
    >
      <div
        className="loading-small"
        style={{
          width: props.width,
          height: props.height,
          color: props.color,
          border: props.border,
          borderBottom: props.borderBottom,
          position: props.position,
          top: props.top,
          marginRight: props.marginRight,
        }}
      ></div>
    </div>
  )
}

export default SmallLoading
