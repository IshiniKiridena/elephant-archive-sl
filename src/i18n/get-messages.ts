import type { Locale } from "./config";
import { en, type Messages } from "./messages/en";
import { si } from "./messages/si";
import { ta } from "./messages/ta";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { si, ta, en };

/**
 * UI strings for a locale. Call it in server components and generateMetadata; pass the slice a
 * client component needs as props (e.g. `t.evidence`) so the message files stay off the client.
 */
export const getMessages = (locale: Locale): Messages => MESSAGES[locale];
