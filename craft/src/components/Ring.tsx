import { FC, ReactNode } from "react";
import { arcPath } from "../ui/geometry";
import { COLORS } from "../ui/colors";

export interface Segment {
  start: number;
  end: number;
  mid: number;
  key: string | number;
  fill: string;
  onClick?: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  label?: ReactNode;
}

interface Props {
  outerR: number;
  innerR: number;
  cx: number;
  cy: number;
  segments: Segment[];
}

export const Ring: FC<Props> = ({ outerR, innerR, cx, cy, segments }) => (
  <>
    {segments.map((s) => (
      <g key={s.key}>
        <path
          d={arcPath(cx, cy, outerR, innerR, s.start, s.end)}
          fill={s.fill}
          stroke={COLORS.stroke}
          onMouseEnter={s.onEnter}
          onMouseLeave={s.onLeave}
          onClick={s.onClick}
          style={s.onClick ? { cursor: "pointer" } : undefined}
        />
        {s.label}
      </g>
    ))}
  </>
);
