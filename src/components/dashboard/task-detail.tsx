"use client";

interface TaskDetailsProps {
  taskId: string;
  taskCode: string;
  taskBadge: string;
  moduleName: string;
  moduleInitials: string;
  lecturerName: string;
  lecturerRole: string;
  lecturerInitials: string;
  stats: Array<{
    value: string;
    trend: "up" | "down";
    label: string;
  }>;
  totals: Array<{
    label: string;
    value: string;
  }>;
}

export function TaskDetail({
  taskId,
  taskCode,
  taskBadge,
  moduleName,
  moduleInitials,
  lecturerName,
  lecturerRole,
  lecturerInitials,
  stats,
  totals,
}: TaskDetailsProps) {
  return (
    <div
      style={{
        background: "#1c1c24",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid #23232e",
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              fontSize: "9.5px",
              color: "#444",
              marginBottom: "5px",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Task Details
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            {taskCode}
            <span
              style={{
                fontSize: "9px",
                padding: "2px 7px",
                borderRadius: "7px",
                background: "#1e2a14",
                color: "#6fcf2e",
                fontWeight: "600",
              }}
            >
              {taskBadge}
            </span>
          </div>
        </div>

        {/* Center */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "9.5px",
              color: "#444",
              marginBottom: "5px",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Module
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "5px",
                background: "#6fcf2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: "700",
                color: "#0d2200",
                flexShrink: 0,
              }}
            >
              {moduleInitials}
            </div>
            {moduleName}
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "9.5px",
              color: "#444",
              marginBottom: "5px",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Lecturer
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#2a2440",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "600",
                color: "#a78bfa",
                flexShrink: 0,
              }}
            >
              {lecturerInitials}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#fff" }}>
                {lecturerName}
              </div>
              <div style={{ fontSize: "9.5px", color: "#444" }}>
                {lecturerRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: "#111116",
              borderRadius: "10px",
              padding: "13px 12px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {stat.value}
              <span
                style={{
                  fontSize: "10px",
                  color: stat.trend === "up" ? "#6fcf2e" : "#e87070",
                }}
              >
                {stat.trend === "up" ? "↑" : "↓"}
              </span>
            </div>
            <div style={{ fontSize: "9.5px", color: "#444", marginTop: "4px" }}>
              {stat.label}
            </div>
            <div
              style={{
                position: "absolute",
                right: "9px",
                top: "9px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#1e1e2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="9"
                height="9"
                stroke="#555"
                fill="none"
                strokeLinecap="round"
                strokeWidth="2.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderTop: "1px solid #23232e",
          paddingTop: "12px",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: "16px", flex: 1 }}>
          {totals.map((total, idx) => (
            <div key={idx}>
              <div
                style={{
                  fontSize: "9.5px",
                  color: "#444",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                  letterSpacing: ".03em",
                }}
              >
                {total.label}
              </div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}>
                {total.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "#23232e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2e2e3c";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#23232e";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              stroke="#555"
              fill="none"
              strokeLinecap="round"
              strokeWidth="1.8"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
          </div>

          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "#23232e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2e2e3c";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#23232e";
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              stroke="#555"
              fill="none"
              strokeLinecap="round"
              strokeWidth="1.8"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v3M16 2v3M3 9h18" />
            </svg>
          </div>

          <button
            style={{
              background: "#6fcf2e",
              color: "#0d2200",
              border: "none",
              padding: "8px 14px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Open folder →
          </button>
        </div>
      </div>
    </div>
  );
}
