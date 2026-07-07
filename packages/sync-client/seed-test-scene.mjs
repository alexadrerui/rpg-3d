// Seed de cena de teste para o game viewer — sala 10×10 com 4 paredes, piso e spawn.
// Fluxo: monta .rpgscene → valida → presign → PUT MinIO → confirm → POST /scenes → scene:load via WS.
import { io } from "socket.io-client"
import { parseSceneFile } from "../rpg-schema/src/index.ts"

const API   = "http://localhost:4000"
const WS    = "http://localhost:4001"
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJiNnBkbTgwMDAwMnVyb2hiYTdwdDZzIiwibmFtZSI6Ik1lc3RyZSBUZXN0ZSIsImVtYWlsIjoibWVzdHJlQHRlc3RlLmNvbSIsImlhdCI6MTc4MzQ2MTEyMiwiZXhwIjoxNzg0MDY1OTIyfQ.vo-ZLK6Y5g3i4hqaDccKqejH2MRZARA7UCMMSlGQp3g"
const CAMPAIGN_ID = "cmrb6prid00042urob6isgbbp"
const SESSION_ID  = "cmrb6qv9l00082uroquwcu3gn"
const MASTER_ID   = "cmrb6pdm800002urohba7pt6s"

// ── 1. Montar o snapshot Pascal: Site → Building → Level → 4 paredes + piso ──

const levelId    = "level_seedtest000001"
const buildingId = "building_seedtest01"
const siteId     = "site_seedtest000001"

const mkWall = (n, start, end) => ({
  object: "node", id: `wall_seedtest0000${n}`, type: "wall",
  name: `Parede ${n}`, parentId: levelId, visible: true, metadata: {},
  children: [], thickness: 0.2, height: 3,
  start, end, frontSide: "unknown", backSide: "unknown",
})

// Sala 10×10 centrada na origem
const walls = [
  mkWall(1, [-5, -5], [ 5, -5]),
  mkWall(2, [ 5, -5], [ 5,  5]),
  mkWall(3, [ 5,  5], [-5,  5]),
  mkWall(4, [-5,  5], [-5, -5]),
]

const slab = {
  object: "node", id: "slab_seedtest000001", type: "slab",
  name: "Piso", parentId: levelId, visible: true, metadata: {},
  polygon: [[-5, -5], [5, -5], [5, 5], [-5, 5]],
  holes: [], holeMetadata: [], elevation: 0.05, autoFromWalls: false,
}

const level = {
  object: "node", id: levelId, type: "level",
  name: "Térreo", parentId: buildingId, visible: true, metadata: {},
  children: [...walls.map(w => w.id), slab.id], level: 0,
}

const building = {
  object: "node", id: buildingId, type: "building",
  name: "Sala de teste", parentId: siteId, visible: true, metadata: {},
  children: [levelId], position: [0, 0, 0], rotation: [0, 0, 0],
}

const site = {
  object: "node", id: siteId, type: "site",
  name: "Site", parentId: null, visible: true, metadata: {},
  polygon: { type: "polygon", points: [[-15, -15], [15, -15], [15, 15], [-15, 15]] },
  children: [building],
}

const nodes = Object.fromEntries(
  [site, building, level, slab, ...walls].map(n => [n.id, n]),
)

// ── 2. Montar o .rpgscene completo ───────────────────────────────────────────

const now = new Date().toISOString()
const sceneFile = {
  $schema: "rpg-scene/v1",
  meta: {
    id: "seed-" + crypto.randomUUID(),
    campaignId: CAMPAIGN_ID,
    name: "Sala de Teste 10x10",
    description: "Cena mínima para teste do game viewer",
    tags: ["teste"],
    createdAt: now, updatedAt: now, createdBy: MASTER_ID, version: 1,
  },
  scene: { nodes, rootNodeIds: [siteId] },
  assets: { models: [], textures: [], audio: [], videos: [] },
  triggers: [
    {
      id: "trigger_spawn_seed01", type: "trigger_spawn", parentId: null, visible: true,
      position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
      shape: { kind: "cylinder", radius: 0.5, height: 2 },
      visibility: "master_only", oneShot: false, cooldownMs: 0,
      label: "Spawn central", forRole: "any", facing: 0,
    },
  ],
  environment: {
    fogOfWar: { enabled: false },
    lighting: {},
    atmosphere: {},
    camera: { mode: "isometric" },
  },
}

const validated = parseSceneFile(sceneFile)
console.log("✓ .rpgscene válido —", Object.keys(validated.scene.nodes).length, "nodes,", validated.triggers.length, "trigger(s)")

// ── 3. Upload: presign → PUT → confirm ───────────────────────────────────────

const authHeaders = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

async function api(path, body) {
  const res = await fetch(API + path, { method: "POST", headers: authHeaders, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json
}

const body = JSON.stringify(validated, null, 2)

const presign = await api("/assets/presign", {
  campaignId: CAMPAIGN_ID,
  fileName: "sala-teste-10x10.rpgscene",
  mimeType: "application/json",
  sizeBytes: Buffer.byteLength(body),
})
console.log("✓ presign ok — assetId", presign.assetId)

const put = await fetch(presign.uploadUrl, {
  method: "PUT", headers: { "Content-Type": "application/json" }, body,
})
if (!put.ok) throw new Error(`PUT storage → ${put.status}: ${await put.text()}`)
console.log("✓ upload para o storage ok")

await api("/assets/confirm", { assetId: presign.assetId })
console.log("✓ asset confirmado")

// ── 4. Registrar a cena na API ───────────────────────────────────────────────

const scene = await api("/scenes", {
  campaignId: CAMPAIGN_ID,
  name: "Sala de Teste 10x10",
  description: "Cena mínima para teste do game viewer",
  fileUrl: presign.publicUrl,
})
console.log("✓ cena registrada — id", scene.id)

// ── 5. WS: room:join → scene:load → aguardar scene:loaded ───────────────────

const s = io(WS, { auth: { token: TOKEN }, transports: ["websocket"] })
const fail = (msg) => { console.error("✗", msg); process.exit(1) }
setTimeout(() => fail("timeout de 10s"), 10_000)

s.on("connect_error", e => fail("connect_error: " + e.message))
s.on("scene:loaded", async (ev) => {
  console.log("✓ scene:loaded broadcast:", JSON.stringify(ev))
  const check = await fetch(ev.sceneUrl)
  if (!check.ok) fail(`fetch do sceneUrl → ${check.status}`)
  const loaded = await check.json()
  console.log("✓ .rpgscene acessível no storage —", Object.keys(loaded.scene.nodes).length, "nodes")
  console.log("\nTUDO OK — sceneId:", scene.id, "\nsceneUrl:", ev.sceneUrl)
  process.exit(0)
})
s.on("connect", () => {
  s.emit("room:join", { sessionId: SESSION_ID, campaignId: CAMPAIGN_ID, token: TOKEN }, (res) => {
    if (!res.ok) fail("room:join: " + JSON.stringify(res))
    console.log("✓ room:join ok")
    s.emit("scene:load", { sceneId: scene.id, transitionFx: "none" }, (res2) => {
      if (!res2?.ok) fail("scene:load: " + JSON.stringify(res2))
      console.log("✓ scene:load ack ok — aguardando broadcast…")
    })
  })
})
