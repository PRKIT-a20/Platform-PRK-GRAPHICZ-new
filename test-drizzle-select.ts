import { db } from "./src/db";
import * as schema from "./src/db/schema";
async function run() {
  const res = await db.select().from(schema.users).limit(1);
  console.log(res);
}
run();
