import { db } from "./src/db";
import * as schema from "./src/db/schema";
async function run() {
  try {
    const res = await db.insert(schema.requests).values({ user_id: '123', title: 'Test' } as any).returning();
    console.log("Success:", res);
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
