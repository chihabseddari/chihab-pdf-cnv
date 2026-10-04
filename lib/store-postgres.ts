import postgres from "postgres";
import type { Activity, ActivityKind, StoredUser } from "./types";
import {
  EmailTakenError,
  toPublic,
  type NewActivity,
  type NewUser,
  type Store,
} from "./store-types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date | string;
};

type ActivityRow = {
  id: string;
  user_id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  created_at: Date | string;
};

const globalSql = globalThis as unknown as {
  qirtasSql?: ReturnType<typeof postgres>;
  qirtasSqlReady?: Promise<void>;
};

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: iso(row.created_at),
  };
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    detail: row.detail,
    createdAt: iso(row.created_at),
  };
}

export function createPostgresStore(databaseUrl: string): Store {
  if (!globalSql.qirtasSql) {
    globalSql.qirtasSql = postgres(databaseUrl, {
      max: 1,
      prepare: false,
      ssl: /localhost|127\.0\.0\.1/.test(databaseUrl) ? false : "require",
      idle_timeout: 20,
      connect_timeout: 30,
    });
  }
  const sql = globalSql.qirtasSql;

  async function ready() {
    globalSql.qirtasSqlReady ??= (async () => {
      await sql`
        create table if not exists users (
          id text primary key,
          name text not null,
          email text not null unique,
          password_hash text not null,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists activities (
          id text primary key,
          user_id text not null references users(id) on delete cascade,
          kind text not null,
          title text not null,
          detail text not null default '',
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create index if not exists activities_user_idx
        on activities (user_id, created_at desc)
      `;
    })();
    return globalSql.qirtasSqlReady;
  }

  return {
    storage: "postgres",
    async stats() {
      await ready();
      const [users] = await sql`select count(*)::int as count from users`;
      const [conversions] = await sql`
        select count(*)::int as count from activities where kind <> 'lottery'
      `;
      const [checks] = await sql`
        select count(*)::int as count from activities where kind = 'lottery'
      `;
      return {
        storage: "postgres" as const,
        users: Number(users?.count ?? 0),
        conversions: Number(conversions?.count ?? 0),
        checks: Number(checks?.count ?? 0),
      };
    },
    async createUser(input: NewUser) {
      await ready();
      try {
        const [row] = await sql<UserRow[]>`
          insert into users (id, name, email, password_hash)
          values (${crypto.randomUUID()}, ${input.name}, ${input.email}, ${input.passwordHash})
          returning id, name, email, password_hash, created_at
        `;
        return toPublic(mapUser(row));
      } catch (error) {
        if ((error as { code?: string }).code === "23505") throw new EmailTakenError();
        throw error;
      }
    },
    async findUserByEmail(email) {
      await ready();
      const [row] = await sql<UserRow[]>`
        select id, name, email, password_hash, created_at from users where email = ${email}
      `;
      return row ? mapUser(row) : null;
    },
    async findUserById(id) {
      await ready();
      const [row] = await sql<UserRow[]>`
        select id, name, email, password_hash, created_at from users where id = ${id}
      `;
      return row ? toPublic(mapUser(row)) : null;
    },
    async updatePassword(id, passwordHash) {
      await ready();
      await sql`update users set password_hash = ${passwordHash} where id = ${id}`;
    },
    async deleteUser(id) {
      await ready();
      await sql`delete from users where id = ${id}`;
    },
    async addActivity(input: NewActivity) {
      await ready();
      const [row] = await sql<ActivityRow[]>`
        insert into activities (id, user_id, kind, title, detail)
        values (
          ${crypto.randomUUID()},
          ${input.userId},
          ${input.kind},
          ${input.title},
          ${input.detail}
        )
        returning id, user_id, kind, title, detail, created_at
      `;
      return mapActivity(row);
    },
    async listActivities(userId, limit) {
      await ready();
      const rows = await sql<ActivityRow[]>`
        select id, user_id, kind, title, detail, created_at
        from activities
        where user_id = ${userId}
        order by created_at desc
        limit ${limit}
      `;
      return rows.map(mapActivity);
    },
    async countForUser(userId) {
      await ready();
      const [conversions] = await sql`
        select count(*)::int as count
        from activities
        where user_id = ${userId} and kind <> 'lottery'
      `;
      const [checks] = await sql`
        select count(*)::int as count
        from activities
        where user_id = ${userId} and kind = 'lottery'
      `;
      return {
        conversions: Number(conversions?.count ?? 0),
        checks: Number(checks?.count ?? 0),
      };
    },
  };
}
