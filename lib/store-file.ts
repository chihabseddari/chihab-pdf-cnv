import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Activity, StoredUser } from "./types";
import {
  EmailTakenError,
  countStats,
  toPublic,
  type NewActivity,
  type NewUser,
  type Store,
} from "./store-types";

type Database = {
  users: StoredUser[];
  activities: Activity[];
};

const globalState = globalThis as unknown as { qirtasFileLock?: Promise<unknown> };

function withLock<T>(fn: () => Promise<T>) {
  const previous = globalState.qirtasFileLock ?? Promise.resolve();
  const run = previous.then(fn, fn);
  globalState.qirtasFileLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function createFileStore(): Store {
  const filePath = path.join(process.cwd(), "data", "db.json");

  async function readDb(): Promise<Database> {
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as Database;
      if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.activities)) {
        throw new Error("corrupt");
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { users: [], activities: [] };
      }
      throw error;
    }
  }

  async function writeDb(db: Database) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(db, null, 2), "utf8");
  }

  return {
    storage: "file",
    async stats() {
      const db = await readDb();
      return countStats("file", db.users.length, db.activities);
    },
    async createUser(input: NewUser) {
      return withLock(async () => {
        const db = await readDb();
        if (db.users.some((user) => user.email === input.email)) throw new EmailTakenError();
        const user: StoredUser = {
          id: crypto.randomUUID(),
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        await writeDb(db);
        return toPublic(user);
      });
    },
    async findUserByEmail(email) {
      const db = await readDb();
      return db.users.find((user) => user.email === email) ?? null;
    },
    async findUserById(id) {
      const db = await readDb();
      const user = db.users.find((item) => item.id === id);
      return user ? toPublic(user) : null;
    },
    async updatePassword(id, passwordHash) {
      await withLock(async () => {
        const db = await readDb();
        const user = db.users.find((item) => item.id === id);
        if (!user) throw new Error("missing");
        user.passwordHash = passwordHash;
        await writeDb(db);
      });
    },
    async deleteUser(id) {
      await withLock(async () => {
        const db = await readDb();
        db.users = db.users.filter((user) => user.id !== id);
        db.activities = db.activities.filter((item) => item.userId !== id);
        await writeDb(db);
      });
    },
    async addActivity(input: NewActivity) {
      return withLock(async () => {
        const db = await readDb();
        const activity: Activity = {
          id: crypto.randomUUID(),
          ...input,
          createdAt: new Date().toISOString(),
        };
        db.activities.push(activity);
        await writeDb(db);
        return activity;
      });
    },
    async listActivities(userId, limit) {
      const db = await readDb();
      return db.activities
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit);
    },
    async countForUser(userId) {
      const db = await readDb();
      const mine = db.activities.filter((item) => item.userId === userId);
      return {
        conversions: mine.filter((item) => item.kind !== "lottery").length,
        checks: mine.filter((item) => item.kind === "lottery").length,
      };
    },
  };
}
