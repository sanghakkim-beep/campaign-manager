import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis._pgClient ??
  (globalThis._pgClient = postgres(process.env.DATABASE_URL!, { prepare: false }));

export const db = drizzle(client, { schema });
