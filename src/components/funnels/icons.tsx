/**
 * Compact line-icon set for the funnel pages and homepage path board. Stroke
 * icons keyed by name, inheriting the accent color via currentColor.
 */
export type FunnelIconName =
  | "doc"
  | "summary"
  | "upload"
  | "clipboard"
  | "cpu"
  | "chat"
  | "user"
  | "target"
  | "listCheck"
  | "chart"
  | "car"
  | "headset"
  | "key"
  | "phone"
  | "search"
  | "handshake"
  | "shieldAlert"
  | "alert"
  | "xCircle"
  | "map";

const PATHS: Record<FunnelIconName, JSX.Element> = {
  doc: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 12h6M9 15.5h6" />
    </>
  ),
  summary: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 16v-2M12 16v-4M15 16v-3" />
    </>
  ),
  upload: (
    <>
      <path d="M7 18a4 4 0 0 1-.5-7.97 5 5 0 0 1 9.6-1.2A3.5 3.5 0 0 1 17 18" />
      <path d="M12 13v6M9.5 15.5 12 13l2.5 2.5" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1Z" />
      <path d="M8 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2" />
      <path d="M9 11h6M9 14.5h6" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 10h4v4h-4zM12 3v2M12 19v2M3 12h2M19 12h2M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
    </>
  ),
  chat: (
    <>
      <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  listCheck: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 5.5 5 6.5 6.8 4.6M4 11.5l1 1 1.8-1.9M4 17.5l1 1 1.8-1.9" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 20v-5M12 20v-9M16 20v-6M20 20V8" />
    </>
  ),
  car: (
    <>
      <path d="M4 13l1.6-4.2A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.9 1.3L20 13v4.5h-2.5M4 17.5V13m0 4.5h2.5M4 13h16" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  headset: (
    <>
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" />
      <path d="M5 13h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1ZM19 13h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1Z" />
      <path d="M19 17v1a3 3 0 0 1-3 3h-3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H20l-2 2 2 2M16 12v3" />
    </>
  ),
  phone: (
    <path d="M7 3.5c.5 0 .9.3 1.1.8l1.2 3a1.2 1.2 0 0 1-.3 1.3L7.8 9.7a12 12 0 0 0 5.5 5.5l1.1-1.2a1.2 1.2 0 0 1 1.3-.3l3 1.2c.5.2.8.6.8 1.1V19a2 2 0 0 1-2 2A14 14 0 0 1 5 6.5a2 2 0 0 1 2-2Z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  handshake: (
    <>
      <path d="m3 11 3-3 5 4 2-1.5L21 11" />
      <path d="M3 11v4l5 4 2-2 2 2 3-2 2 2 1-1v-7" />
      <path d="m11 12 2 2" />
    </>
  ),
  shieldAlert: (
    <>
      <path d="M12 3 5 5.5V11c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V5.5L12 3Z" />
      <path d="M12 8.5v4M12 15.2v.1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 3 19h18L12 4Z" />
      <path d="M12 10v4M12 16.5v.1" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
};

export function FunnelIcon({
  name,
  className = "h-5 w-5",
}: {
  name: FunnelIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
