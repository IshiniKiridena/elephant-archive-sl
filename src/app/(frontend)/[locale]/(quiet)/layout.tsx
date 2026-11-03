import type { ReactNode } from "react";

/**
 * Quiet zone: Deaths, Causes, Court cases, Remembered, Limits of this data.
 * Everything inside renders with no motion (advocacy.css) and should start with the
 * plain Umber band (.band-sensitive) instead of a photo. Keep QUIET_SECTIONS in
 * src/lib/motion-zone.ts in sync with the folders in this group.
 */
export default function QuietLayout({ children }: { children: ReactNode }) {
  return <div data-zone="quiet">{children}</div>;
}
