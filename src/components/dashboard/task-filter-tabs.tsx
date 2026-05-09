"use client";

interface TaskFilterTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TaskFilterTabs({ activeTab, onTabChange }: TaskFilterTabsProps) {
  const tabs = [
    { id: "all", label: "All Tasks", count: "8" },
    { id: "upcoming", label: "Upcoming", count: "3" },
    { id: "urgent", label: "Urgent", count: "2" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3px",
        position: "absolute",
        top: "-15px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0d0d12",
        borderRadius: "18px",
        padding: "3px",
        zIndex: 5,
        boxShadow: "0 0 0 1px #2a2a36",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: "5px 13px",
            borderRadius: "14px",
            fontSize: "11px",
            color: activeTab === tab.id ? "#0d2200" : "#555",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all .15s",
            background: activeTab === tab.id ? "#6fcf2e" : "transparent",
            border: "none",
            fontWeight: activeTab === tab.id ? "600" : "400",
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              (e.currentTarget as HTMLElement).style.color = "#888";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              (e.currentTarget as HTMLElement).style.color = "#555";
            }
          }}
        >
          {tab.label}
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              background:
                activeTab === tab.id
                  ? "rgba(0,0,0,.2)"
                  : "rgba(255,255,255,.15)",
              borderRadius: "8px",
              padding: "0px 5px",
              color: activeTab === tab.id ? "#0d2200" : "#fff",
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
