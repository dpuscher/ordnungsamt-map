import React from "react";

interface HeaderProps {
  total: number | null;
  loading: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ total, loading, onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        height: 52,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
        zIndex: 1000,
        position: "relative",
        gap: 16,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: "var(--color-accent)",
        }}
      />

      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="flex md:hidden items-center justify-center p-0 bg-transparent border-none cursor-pointer"
          style={{ color: "var(--color-accent)", flexShrink: 0 }}
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

      <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            letterSpacing: 3,
            color: "var(--color-accent)",
            lineHeight: 1,
          }}
        >
          ORDNUNGSAMT
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--color-muted)",
            margin: "0 8px",
            letterSpacing: 0,
          }}
        >
          ·
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            letterSpacing: 3,
            color: "var(--color-text)",
            opacity: 0.5,
            lineHeight: 1,
          }}
        >
          BERLIN
        </span>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          color: "var(--color-muted)",
          letterSpacing: 0.5,
          display: "none",
          alignItems: "center",
          gap: 4,
        }}
        className="md:flex"
      >
        <span>52.52°N</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>13.40°E</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
        {!loading && total !== null && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-muted)",
              letterSpacing: 0.5,
            }}
            className="hidden md:block"
          >
            {total.toLocaleString("de-DE")}{" "}
            <span style={{ opacity: 0.5 }}>Meldungen</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--color-accent)",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              background: "var(--color-accent)",
              animation: "pulse 2.5s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          Live
        </div>
      </div>
    </header>
  );
}
