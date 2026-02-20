import { useEffect } from "react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
  confirmText = "Kinnita",
  cancelText = "Tühista",
}) {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const icons = {
    danger: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    warning: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  const colors = {
    danger: {
      bg: "var(--danger-light)",
      color: "var(--danger)",
      btnBg: "var(--danger)",
    },
    warning: {
      bg: "var(--accent-light)",
      color: "var(--warning)",
      btnBg: "var(--warning)",
    },
    info: {
      bg: "var(--info-light)",
      color: "var(--info)",
      btnBg: "var(--info)",
    },
  };

  const theme = colors[type] || colors.danger;

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dialog-card animate-scale">
        <div style={{ display: "flex", gap: "1.25rem", marginBottom: "2rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              flexShrink: 0,
              background: theme.bg,
              color: theme.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icons[type]}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                marginBottom: "0.5rem",
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9375rem",
                lineHeight: "1.6",
                fontWeight: "500",
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button onClick={onClose} className="btn btn-secondary">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn"
            style={{
              background: `linear-gradient(135deg, ${theme.btnBg}, ${theme.color})`,
              color: "#fff",
              boxShadow: `0 2px 8px ${theme.color}40`,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
