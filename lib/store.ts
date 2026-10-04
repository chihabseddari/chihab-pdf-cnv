import { connection } from "next/server";
import { createFileStore } from "./store-file";
import { createPostgresStore } from "./store-postgres";
import { StorageUnavailableError, type Store } from "./store-types";

let storePromise: Promise<Store> | null = null;

async function initStore() {
  await connection();
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return createPostgresStore(databaseUrl);
  if (process.env.VERCEL) throw new StorageUnavailableError();
  return createFileStore();
}

export function getStore() {
  storePromise ??= initStore().catch((error) => {
    storePromise = null;
    throw error;
  });
  return storePromise;
}

export { EmailTakenError, StorageUnavailableError } from "./store-types";
