import { createApp }    from "./app.js"
import { seedSystems } from "./routes/systems.js"

const PORT = Number(process.env.API_SERVER_PORT ?? 4000)
const app  = createApp()

app.listen(PORT, async () => {
  console.log(`[api-server] running on port ${PORT}`)
  await seedSystems().catch(e => console.error("[api-server] seed error:", e))
})
