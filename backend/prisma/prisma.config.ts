import { defineConfig } from "@prisma/migrate";

export default defineConfig({
  schema: "prisma/schema.prisma",
  database: {
    url: "file:./dev.db",
  },
});