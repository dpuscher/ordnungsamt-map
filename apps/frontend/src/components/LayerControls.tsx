import React from "react";
import * as Switch from "@radix-ui/react-switch";

interface LayerControlsProps {
  heatVisible: boolean;
  pointsVisible: boolean;
  onHeatChange: (v: boolean) => void;
  onPointsChange: (v: boolean) => void;
}

interface LayerRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id: string;
}

function LayerRow({ label, checked, onCheckedChange, id }: LayerRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
      }}
    >
      <label htmlFor={id} style={{ fontSize: 13, color: "var(--color-text)", cursor: "pointer" }}>
        {label}
      </label>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        style={{
          width: 36,
          height: 20,
          background: checked ? "var(--color-accent)" : "var(--color-border)",
          borderRadius: 10,
          cursor: "pointer",
          position: "relative",
          border: "none",
          outline: "none",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <Switch.Thumb
          style={{
            display: "block",
            width: 14,
            height: 14,
            background: "#fff",
            borderRadius: "50%",
            position: "absolute",
            top: 3,
            left: checked ? 19 : 3,
            transition: "left 0.2s",
          }}
        />
      </Switch.Root>
    </div>
  );
}

export function LayerControls({
  heatVisible,
  pointsVisible,
  onHeatChange,
  onPointsChange,
}: LayerControlsProps) {
  return (
    <div>
      <LayerRow
        id="heat-toggle"
        label="Heatmap"
        checked={heatVisible}
        onCheckedChange={onHeatChange}
      />
      <LayerRow
        id="points-toggle"
        label="Einzelpunkte"
        checked={pointsVisible}
        onCheckedChange={onPointsChange}
      />
    </div>
  );
}
