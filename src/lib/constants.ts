export const ROLES = {
  SUPER_ADMIN: "super_admin",
  EVENT_ADMIN: "event_admin",
  JUDGE: "judge",
  STUDENT: "student",
  PUBLIC: "public",
} as const;

export const EVENT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const GENDERS = ["male", "female", "other"] as const;

export const COMPETITION_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
} as const;

export const CERTIFICATE_TYPES = {
  WINNER: "winner",
  RUNNER_UP: "runner_up",
  PARTICIPATION: "participation",
  MERIT: "merit",
} as const;

export const DEFAULT_POINT_SYSTEM = {
  first: 10,
  second: 7,
  third: 5,
  participation: 1,
};

export const LANGUAGES = {
  en: { name: "English", dir: "ltr" },
  ml: { name: "മലയാളം", dir: "ltr" },
  ar: { name: "العربية", dir: "rtl" },
} as const;

export const THEME = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

export const APP_NAME = "FestBoard";
export const APP_DESCRIPTION = "Multi-Event Competition & Score Management Platform";
