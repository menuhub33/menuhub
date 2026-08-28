import { cn } from "@/components/lib/cn";
import type { ChartPoint } from "@/components/lib/types";

const TEAL = "#0f766e";
const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 20, right: 16, bottom: 48, left: 52 };

function formatCount(value: number): string {
  return new Intl.NumberFormat("ar").format(value);
}

function truncateLabel(label: string): string {
  return label.length > 10 ? `${label.slice(0, 9)}…` : label;
}

export function AnalyticsChart({
  points,
  type = "bar",
  color = TEAL,
  emptyLabel = "لا توجد بيانات للعرض",
  className,
}: {
  points: ChartPoint[];
  type?: "bar" | "line";
  color?: string;
  emptyLabel?: string;
  className?: string;
}) {
  if (points.length === 0) {
    return (
      <div
        className={cn(
          "flex h-52 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400",
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 0);
  const scaleMax = maxValue === 0 ? 1 : maxValue;
  const ticks = [0, scaleMax / 2, scaleMax];
  const labelStep = points.length > 8 ? Math.ceil(points.length / 6) : 1;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? PAD.left + innerWidth / 2
        : PAD.left + (index / (points.length - 1)) * innerWidth;
    const y = PAD.top + innerHeight - (point.value / scaleMax) * innerHeight;
    return { x, y, point };
  });

  const slot = innerWidth / points.length;
  const barWidth = Math.max(8, slot * 0.58);
  const linePath = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath =
    first && last
      ? `${linePath} L ${last.x.toFixed(1)} ${PAD.top + innerHeight} L ${first.x.toFixed(1)} ${PAD.top + innerHeight} Z`
      : "";

  return (
    <div className={cn("w-full", className)} dir="ltr">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="مخطط بياني"
        className="h-auto w-full"
      >
        {ticks.map((tick) => {
          const y = PAD.top + innerHeight - (tick / scaleMax) * innerHeight;
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y}
                y2={y}
                stroke="#e4e4e7"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-zinc-400"
                fontSize={11}
              >
                {formatCount(Math.round(tick))}
              </text>
            </g>
          );
        })}

        {type === "bar"
          ? points.map((point, index) => {
              const barHeight = (point.value / scaleMax) * innerHeight;
              const x = PAD.left + index * slot + (slot - barWidth) / 2;
              const y = PAD.top + innerHeight - barHeight;
              return (
                <g key={`${point.label}-${index}`}>
                  <title>{`${point.label}: ${formatCount(point.value)}`}</title>
                  <rect
                    x={x}
                    y={maxValue === 0 ? PAD.top + innerHeight - 2 : y}
                    width={barWidth}
                    height={maxValue === 0 ? 2 : Math.max(barHeight, 2)}
                    rx={4}
                    fill={color}
                  />
                </g>
              );
            })
          : null}

        {type === "line" && areaPath ? (
          <>
            <path d={areaPath} fill={color} opacity={0.12} />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
            {coords.map((coord, index) => (
              <g key={`${coord.point.label}-${index}`}>
                <title>{`${coord.point.label}: ${formatCount(coord.point.value)}`}</title>
                <circle cx={coord.x} cy={coord.y} r={3.5} fill={color} />
              </g>
            ))}
          </>
        ) : null}

        {points.map((point, index) => {
          if (index % labelStep !== 0 && index !== points.length - 1) return null;
          const x =
            type === "bar"
              ? PAD.left + index * slot + slot / 2
              : coords[index]?.x ?? PAD.left;
          return (
            <text
              key={`label-${point.label}-${index}`}
              x={x}
              y={HEIGHT - 16}
              textAnchor="middle"
              className="fill-zinc-500"
              fontSize={11}
            >
              {truncateLabel(point.label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
