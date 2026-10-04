/**
 * Utility to extract user initials for avatars.
 * e.g., "Rohit kushwaha" -> "RK", "Alex Jordan" -> "AJ", "john@example.com" -> "JO"
 */
export function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== "string") return "?";
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
