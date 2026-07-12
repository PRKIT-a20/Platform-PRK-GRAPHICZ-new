import { db } from "./src/db";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";
async function run() {
  await db.delete(schema.users).where(eq(schema.users.email, 'prkgraphicz@gmail.com'));
  console.log("Deleted");
}
run();
