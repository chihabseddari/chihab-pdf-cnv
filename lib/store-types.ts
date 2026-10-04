import type { Activity, ActivityKind, PublicUser, Stats, StoredUser } from "./types";

export class EmailTakenError extends Error {
  constructor() {
    super("email");
  }
}

export class StorageUnavailableError extends Error {
  constructor() {
    super("storage");
  }
}

export type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
};

export type NewActivity = {
  userId: string;
  kind: ActivityKind;
  title: string;
  detail: string;
};

export interface Store {
  readonly storage: Stats["storage"];
  stats(): Promise<Stats>;
  createUser(input: NewUser): Promise<PublicUser>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserById(id: string): Promise<PublicUser | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  addActivity(input: NewActivity): Promise<Activity>;
  listActivities(userId: string, limit: number): Promise<Activity[]>;
  countForUser(userId: string): Promise<{ conversions: number; checks: number }>;
}

export function toPublic(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function countStats(
  storage: Stats["storage"],
  users: number,
  activities: { kind: ActivityKind }[],
): Stats {
  return {
    storage,
    users,
    conversions: activities.filter((item) => item.kind !== "lottery").length,
    checks: activities.filter((item) => item.kind === "lottery").length,
  };
}
