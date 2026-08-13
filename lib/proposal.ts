"use client";

/**
 * The contractor's own details, remembered between visits.
 *
 * A proposal with no company name on it is not a proposal. Asking for the same
 * five fields on every job is the fastest way to make a tool get abandoned, so
 * they persist locally — in the contractor's browser, never sent anywhere.
 * FloorForge has no account system and this tool deliberately requires none.
 */
export interface ContractorProfile {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  license: string;
}

export const EMPTY_PROFILE: ContractorProfile = {
  company: "",
  contactName: "",
  phone: "",
  email: "",
  license: "",
};

const KEY = "floorforge.contractor.v1";

export function loadProfile(): ContractorProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<ContractorProfile>;
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    // Private browsing, disabled storage, corrupt value — all the same to us.
    return EMPTY_PROFILE;
  }
}

export function saveProfile(p: ContractorProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — the tool still works, it just forgets */
  }
}

/** A short, human proposal number. Not an ID: contractors read these aloud. */
export function proposalNumber(seed: string, date: Date): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}${m}-${String(h % 10000).padStart(4, "0")}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
