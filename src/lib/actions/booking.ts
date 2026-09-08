"use server";

/**
 * The external booking URL used by the application flow.
 *
 * The one genuinely functional integration in v1: it requires no credentials,
 * so Threadline can honestly say it works. Configured per workspace in Settings,
 * with an environment-level fallback for the public marketing site.
 */
export async function publicBookingUrl(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
