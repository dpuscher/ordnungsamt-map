import React from "react";

export function Legend() {
  return (
    <div className="absolute bottom-5 right-5 z-[1000] bg-bg/[0.95] border border-border border-l-[2px] border-l-accent p-3 px-[14px] backdrop-blur-md">
      <div className="font-mono text-[8px] tracking-[2px] text-muted uppercase mb-2">
        Intensität
      </div>
      <div
        className="w-[140px] h-[6px] mb-[5px]"
        style={{ background: "linear-gradient(to right, #00d4ff, #e8ff3c, #ff4c38)" }}
      />
      <div className="flex justify-between font-mono text-[8px] text-muted tracking-[0.5px]">
        <span>Niedrig</span>
        <span>Mittel</span>
        <span>Hoch</span>
      </div>
    </div>
  );
}
