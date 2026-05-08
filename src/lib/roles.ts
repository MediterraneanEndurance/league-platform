import type { UserRole } from "@/types/league";

export function canAccessAdmin(role: UserRole) {
  return role === "admin";
}

export function canAccessSteward(role: UserRole) {
  return role === "admin" || role === "steward";
}
