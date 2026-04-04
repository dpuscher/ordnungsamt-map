import React from "react";

interface HeaderProps {
  total: number | null;
  loading: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ total, loading, onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="relative flex items-center gap-4 px-5 h-[52px] bg-surface border-b border-border shrink-0 z-[1000]">
      <div className="absolute inset-y-0 left-0 w-[2px] bg-accent" />

      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="flex md:hidden items-center justify-center p-0 bg-transparent border-none cursor-pointer text-accent"
          aria-label="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </>
            )}
          </svg>
        </button>
      )}

      <div className="flex items-center">
        <span className="font-display text-xl tracking-[3px] text-accent leading-none">
          ORDNUNGSAMT
        </span>
        <span className="font-mono text-[10px] text-muted mx-2">·</span>
        <span className="font-display text-xl tracking-[3px] text-text/50 leading-none">
          BERLIN
        </span>
      </div>

      <div className="hidden md:flex items-center gap-1 font-mono text-[9px] text-muted tracking-[0.5px]">
        <span>52.52°N</span>
        <span className="opacity-40">·</span>
        <span>13.40°E</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {!loading && total !== null && (
          <div className="hidden md:block font-mono text-[11px] text-muted tracking-[0.5px]">
            {total.toLocaleString("de-DE")}{" "}
            <span className="opacity-50">Meldungen</span>
          </div>
        )}

        <div className="flex items-center gap-[7px] font-mono text-[10px] text-accent tracking-[1px] uppercase">
          <span
            className="w-[5px] h-[5px] bg-accent shrink-0"
            style={{ animation: "pulse 2.5s ease-in-out infinite" }}
          />
          Live
        </div>
      </div>
    </header>
  );
}
