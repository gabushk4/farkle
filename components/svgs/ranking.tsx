import * as React from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

// Podium icon: simple, valid SVG with multiple steps.
export const path1 = "M40 208 L40 136 L88 136 L88 208 Z"
export const path2 = "M104 208 L104 88 L152 88 L152 208 Z M168 208 L168 152 L216 152 L216 208 Z"

const path = [path1, path2].join(' ')

const Ranking = (props: SvgProps) => (
  <Svg viewBox="0 0 256 256" {...props}>
    <Path
      stroke={props.stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={8}
      fill="none"
      d={path}
    />
  </Svg>
)

export default Ranking
