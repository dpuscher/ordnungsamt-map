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
        border: "1px solid var(--color-border)",
        background: active ? "var(--color-accent)" : "rgba(255,255,255,0.02)",
        color: active ? "#0a0c10" : "var(--color-text)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        padding: "10px 12px",
        cursor: "pointer",
        transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

export function LayerControls({ displayMode, onModeChange }: LayerControlsProps) {
  return (
      <div style={{ display: "flex", gap: 8 }}>
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
