export const STATUSES = [
  "applied",
  "phone_screen",
  "recruiter_screen",
  "take_home",
  "technical_screen",
  "onsite",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type Status = (typeof STATUSES)[number];
