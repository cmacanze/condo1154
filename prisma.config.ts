import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://condo:condo1154@localhost:5432/condo1154?schema=public",
  },
});
