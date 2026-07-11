import { getTableColumns } from "drizzle-orm";
import * as schema from "./src/db/schema";

const cols = schema.requests;
console.log(Object.keys(cols));
console.log(cols.userId.name); // Should be 'user_id'
