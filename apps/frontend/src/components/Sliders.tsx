import React from "react";
import * as Slider from "@radix-ui/react-slider";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, onChange }: SliderRowProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
      <label
        style={{
          fontSize: 12,
          color: "var(--color-muted)",
          whiteSpace: "nowrap",
          minWidth: 60,
        }}
      >
        {label}
      </label>
      <Slider.Root
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
        style={{ flex: 1, display: "flex", alignItems: "center", height: 20 }}
      >
        <Slider.Track
          style={{
            background: "var(--color-border)",
            borderRadius: 2,
            height: 3,
            flex: 1,
            position: "relative",
          }}
        >
          <Slider.Range
            style={{
              background: "var(--color-accent)",
              height: "100%",
              borderRadius: 2,
              position: "absolute",
            }}
          />
        </Slider.Track>
        <Slider.Thumb
          style={{
            display: "block",
            width: 14,
            height: 14,
            background: "var(--color-accent)",
            borderRadius: "50%",
            cursor: "pointer",
            border: "none",
            outline: "none",
          }}
        />
      </Slider.Root>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--color-accent)",
          minWidth: 28,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface SlidersProps {
  radius: number;
  blur: number;
  onRadiusChange: (v: number) => void;
  onBlurChange: (v: number) => void;
}

export function Sliders({ radius, blur, onRadiusChange, onBlurChange }: SlidersProps) {
  return (
    <div>
      <SliderRow label="Radius" value={radius} min={10} max={60} onChange={onRadiusChange} />
      <SliderRow label="Blur" value={blur} min={1} max={10} onChange={onBlurChange} />
    </div>
  );
}
