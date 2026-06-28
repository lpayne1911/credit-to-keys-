/**
 * Lightweight inline icon set for the Red Flag Matrix. Stroke icons keyed by
 * name so the page can pass a string from a data array. 1.7px stroke,
 * currentColor — they inherit the card's gold-dark accent.
 */
export type IconName =
  | "tag"
  | "receipt"
  | "percent"
  | "swap"
  | "shield"
  | "car"
  | "doc"
  | "bolt";

const PATHS: Record<IconName, JSX.Element> = {
  tag: (
    <>
      <path d="M3 7.5V4.5A1.5 1.5 0 0 1 4.5 3h3l9.5 9.5a1.5 1.5 0 0 1 0 2.1l-3.4 3.4a1.5 1.5 0 0 1-2.1 0L3 8.5Z" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 3h10a1 1 0 0 1 1 1v16l-2.2-1.4L11.6 20 9.4 18.6 7.2 20 5 18.6V4a1 1 0 0 1 0-1Z" />
      <path d="M8 8h6M8 11.5h6M8 15h4" />
    </>
  ),
  percent: (
    <>
      <path d="M6 18 18 6" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8h12l-3-3M20 16H8l3 3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5V11c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V5.5L12 3Z" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
  car: (
    <>
      <path d="M4 13l1.6-4.2A2 2 0 0 1 7.5 7.5h9a2 2 0 0 1 1.9 1.3L20 13v4.5h-2.5M4 17.5V13m0 4.5h2.5M4 13h16" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9 12h6M9 15.5h6" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
    </>
  ),
};

export function MatrixIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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
