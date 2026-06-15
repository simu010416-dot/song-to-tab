import { useMemo } from "react";
import type { Chord, Note } from "./api";

interface Props {
  notes: Note[];
  chords: Chord[];
  tuning: string[]; // ["E","A","D","G","B","E"] 低->高
  duration: number;
}

const PX_PER_SEC = 90;
const ROW_WIDTH = 940;
const LEFT_PAD = 34;
const STRING_GAP = 16;
const STAFF_TOP_PAD = 26; // 给和弦标注留空间
const STAFF_BOTTOM_PAD = 18;

// 顶 -> 底 显示顺序：高音 e 弦在最上面
const DISPLAY_LABELS = ["e", "B", "G", "D", "A", "E"];

export default function TabView({ notes, chords, duration }: Props) {
  const layout = useMemo(() => {
    const totalWidth = Math.max(duration, 1) * PX_PER_SEC + LEFT_PAD;
    const usable = ROW_WIDTH - LEFT_PAD;
    const rows = Math.max(1, Math.ceil((totalWidth - LEFT_PAD) / usable));
    const staffHeight = STAFF_TOP_PAD + STRING_GAP * 5 + STAFF_BOTTOM_PAD;
    return { rows, usable, staffHeight };
  }, [duration]);

  const stringY = (rowTop: number, displayRow: number) =>
    rowTop + STAFF_TOP_PAD + displayRow * STRING_GAP;

  const placeX = (t: number) => {
    const globalX = t * PX_PER_SEC;
    const row = Math.floor(globalX / layout.usable);
    const localX = LEFT_PAD + (globalX - row * layout.usable);
    return { row, x: localX };
  };

  const height = layout.rows * (layout.staffHeight + 18) + 10;

  return (
    <div className="tab-svg-wrap">
      <svg width={ROW_WIDTH} height={height}>
        {Array.from({ length: layout.rows }).map((_, row) => {
          const rowTop = row * (layout.staffHeight + 18) + 6;
          return (
            <g key={`staff-${row}`}>
              {DISPLAY_LABELS.map((label, di) => {
                const y = stringY(rowTop, di);
                return (
                  <g key={`s-${row}-${di}`}>
                    <line
                      x1={LEFT_PAD}
                      y1={y}
                      x2={ROW_WIDTH - 10}
                      y2={y}
                      stroke="var(--string)"
                      strokeWidth={1}
                    />
                    <text
                      x={LEFT_PAD - 12}
                      y={y + 4}
                      fill="var(--muted)"
                      fontSize={11}
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              {/* TAB 竖标记 */}
              <text
                x={6}
                y={stringY(rowTop, 0) - 8}
                fill="var(--muted)"
                fontSize={10}
              >
                TAB
              </text>
            </g>
          );
        })}

        {/* 和弦标注 */}
        {chords.map((ch, i) => {
          const { row, x } = placeX(ch.start);
          const rowTop = row * (layout.staffHeight + 18) + 6;
          return (
            <text
              key={`ch-${i}`}
              x={x}
              y={rowTop + 14}
              fill="var(--accent-2)"
              fontSize={12}
              fontWeight={700}
            >
              {ch.name}
            </text>
          );
        })}

        {/* 音符品格数字 */}
        {notes.map((n, i) => {
          const { row, x } = placeX(n.start);
          const rowTop = row * (layout.staffHeight + 18) + 6;
          const displayRow = 5 - n.string; // 高音弦在顶部
          const y = stringY(rowTop, displayRow);
          const label = String(n.fret);
          const w = label.length * 7 + 6;
          return (
            <g key={`n-${i}`}>
              <rect
                x={x - w / 2}
                y={y - 8}
                width={w}
                height={16}
                rx={4}
                fill="#0b0e13"
              />
              <text
                x={x}
                y={y + 4}
                fill="var(--fret)"
                fontSize={12}
                fontWeight={700}
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
