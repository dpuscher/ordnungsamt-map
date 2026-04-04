import type { MapDisplayMode } from "@ordnungsamt/shared";

interface LayerControlsProps {
  displayMode: MapDisplayMode;
  onModeChange: (mode: MapDisplayMode) => void;
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
        background: active ? "rgba(232,255,60,0.07)" : "var(--color-bg)",
        color: active ? "var(--color-accent)" : "var(--color-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        padding: "10px 12px 9px",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export function LayerControls({ displayMode, onModeChange }: LayerControlsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 1,
        background: "var(--color-border)",
      }}
    >
      <ModeButton
        label="Heatmap"
        active={displayMode === "heatmap"}
        onClick={() => onModeChange("heatmap")}
      />
      <ModeButton
        label="Punkte"
        active={displayMode === "points"}
        onClick={() => onModeChange("points")}
      />
    </div>
  );
}
