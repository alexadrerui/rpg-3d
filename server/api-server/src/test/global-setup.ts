import { execSync } from "child_process"
import { fileURLToPath } from "url"
import path from "path"

const TEST_DB_URL = "postgresql://rpg3d:rpg3d@localhost:5432/rpg3d_test"
const apiDir      = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

export default function setup(): void {
  // Cria o banco de testes (ignora erro se já existe)
  try {
    execSync(
      `docker exec rpg3d-postgres psql -U rpg3d -c "CREATE DATABASE rpg3d_test" postgres`,
      { stdio: "pipe" },
    )
  } catch { /* já existe — OK */ }

  // Sincroniza o schema Prisma com o banco de testes
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: apiDir,
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "pipe",
  })
}
