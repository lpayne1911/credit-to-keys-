import React from "react";

/**
 * Driveway Advocate app icon — a gold "protection" shield with a check, on the
 * brand navy. Rendered to PNG at build/runtime via `next/og` (Satori), so we
 * need no image tooling or binary assets. Shared by the favicon, the Apple
 * touch icon, and the PWA manifest icons.
 */
export function brandIcon(size: number): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#14253D",
      }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l7 3v6c0 4.5-3 8.2-7 9-4-0.8-7-4.5-7-9V5l7-3z"
          fill="#C8923A"
        />
        <path
          d="M8.6 12.4l2.2 2.2 4.6-5"
          stroke="#14253D"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
