export type ActivityKind = "images-to-pdf" | "merge-pdf" | "split-pdf" | "lottery";

export const KIND_LABEL: Record<ActivityKind, string> = {
  "images-to-pdf": "تحويل صور",
  "merge-pdf": "دمج",
  "split-pdf": "تقسيم",
  lottery: "يانصيب",
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
};

export type Activity = {
  id: string;
  userId: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  createdAt: string;
};

export type Stats = {
  storage: "postgres" | "file";
  users: number;
  conversions: number;
  checks: number;
};

export type PublicStats =
  | (Stats & { available: true; asOf: string })
  | { available: false; reason: string; asOf: string };
