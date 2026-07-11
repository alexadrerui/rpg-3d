# RPG 3D — Contexto para Claude Code

Este documento descreve o estado atual do projeto, o que já foi implementado,
o que ainda está pendente e as convenções que devem ser seguidas.
Leia este arquivo inteiro antes de modificar qualquer código.

---

## O que é este projeto

Plataforma open-source de RPG de mesa com cenários 3D em tempo real.
Fork do [Pascal Editor](https://github.com/pascalorg/editor) (MIT) estendido
com uma camada RPG completa.

**Três pilares:**
1. **Campanha** — mestre cria campanha, gera convites, jogadores preenchem fichas
2. **Editor de cenário** — editor 3D com tools RPG (triggers, armadilhas, notas, etc.)
3. **Sessão ao vivo** — mapa 3D isométrico, tokens, chat, dados, fog of war em tempo real

---

## Stack e versões

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Runtime | Bun | 1.3.0 |
| Frontend | React | 19.2.4 |
| 3D | Three.js (WebGPU) + React Three Fiber | 0.184 / 9.x |
| Editor base | Pascal Editor (fork) | — |
| Estado | Zustand | 5.x |
| Schema | Zod | v4.3.x |
| Language | TypeScript | 6.0 |
| Bundler apps | Vite (game/dashboard) + Next.js 16 (editor) | — |
| Monorepo | Turborepo | 2.x |
| Linter/formatter | Biome | 2.x |
| Backend | Node.js + Express | LTS |
| WebSocket | Socket.io | 4.8 |
| ORM | Prisma | 6.x |
| Banco | PostgreSQL | 15+ |
| Cache | Redis | opcional |

---

## Estrutura do monorepo

```
rpg-3d/
│
├── apps/
│   ├── editor/          Next.js 16 · porta 3001
│   │   ├── app/         layout.tsx, page.tsx, globals.css
│   │   ├── components/
│   │   │   ├── editor-root.tsx          ← ponto de entrada principal
│   │   │   ├── environment/
│   │   │   │   └── environment-sidebar-tab.tsx
│   │   │   ├── toolbar/
│   │   │   │   ├── rpg-toolbar.tsx
│   │   │   │   └── rpg-toolbar-slot.tsx ← injetado no slot do Pascal Editor
│   │   │   └── triggers/
│   │   │       ├── trigger-panel.tsx
│   │   │       └── trigger-sidebar-tab.tsx
│   │   ├── lib/
│   │   │   └── export-scene.ts          ← gera download do .rpgscene
│   │   └── store/
│   │       ├── environment-store.ts     ← Zustand do EnvironmentConfig
│   │       └── trigger-store.ts         ← Zustand dos triggers da cena
│   │
│   ├── game/            Vite + React · porta 3002
│   │   └── src/
│   │       ├── components/
│   │       │   ├── canvas/
│   │       │   │   ├── game-canvas.tsx  ← Pascal Viewer + R3F overlay
│   │       │   │   ├── iso-camera.tsx   ← câmera isométrica 45°
│   │       │   │   └── fog-of-war.tsx   ← shader de névoa sobre a cena
│   │       │   ├── chat/
│   │       │   │   └── chat-panel.tsx   ← 4 canais: geral/mestre/whisper/log
│   │       │   ├── dice/
│   │       │   │   └── dice-panel.tsx   ← d4–d% com histórico
│   │       │   ├── hud/
│   │       │   │   ├── master-controls.tsx      ← troca de cena (busca API)
│   │       │   │   ├── participants-panel.tsx
│   │       │   │   └── trigger-notifications.tsx
│   │       │   └── tokens/
│   │       │       └── token-mesh.tsx   ← disco 3D arrastável
│   │       ├── lib/
│   │       │   ├── api-client.ts        ← fetch tipado para api-server
│   │       │   └── pascal-bridge.ts     ← injeta nodes no useScene do Pascal
│   │       ├── pages/
│   │       │   ├── lobby-page.tsx       ← login + seleção de campanha
│   │       │   └── session-page.tsx     ← ambiente ao vivo completo
│   │       └── store/
│   │           ├── auth-store.ts        ← JWT + dados do usuário
│   │           └── scene-store.ts       ← estado do .rpgscene carregado
│   │
│   └── dashboard/       Vite + React · porta 3003
│       └── src/
│           ├── lib/
│           │   └── api-client.ts        ← mesma lógica do game/api-client
│           ├── pages/
│           │   ├── campaigns-page.tsx   ← lista campanhas + login + criar
│           │   ├── invite-page.tsx      ← aceitar convite via token
│           │   └── character-page.tsx   ← wizard 4 etapas da ficha
│           └── store/
│               └── auth-store.ts
│
├── packages/
│   │
│   │  ── Pascal (fork — NÃO modificar diretamente) ──────────────────────────
│   ├── pascal-core/     Schema + store (useScene) + systems do Pascal
│   ├── pascal-viewer/   React Three Fiber renderer do Pascal
│   ├── pascal-editor/   Tools de edição (wall, door, item, etc.)
│   │
│   │  ── RPG 3D (nossos packages) ──────────────────────────────────────────
│   ├── rpg-schema/      ← CONTRATO CENTRAL — importado por tudo
│   │   └── src/
│   │       ├── base.ts          Vec2, Vec3, ColorHex, AssetRef, BaseRpgNode
│   │       ├── triggers.ts      NoteNode, TrapNode, SpawnNode, TransitionNode,
│   │       │                    AmbientAudioNode, AnyTriggerNode
│   │       ├── environment.ts   FogOfWarConfig, LightingConfig, AtmosphereConfig,
│   │       │                    CameraConfig, EnvironmentConfig
│   │       ├── scene.ts         RpgSceneFile ($schema:"rpg-scene/v1"), helpers
│   │       ├── events.ts        Todos os eventos WebSocket (EvJoinRoom, EvRollDice…)
│   │       ├── socket-types.ts  ServerToClientMap, ClientToServerMap, AckFn
│   │       └── index.ts         Re-exporta tudo
│   │
│   ├── sync-client/     ← Hooks WebSocket para os apps
│   │   └── src/
│   │       ├── socket.ts        Singleton Socket.io + setAuthToken
│   │       ├── use-game-room.ts useGameRoom (hook principal) + useRoomStore
│   │       ├── use-chat.ts      useChat (buffer 200 msgs, byChannel)
│   │       └── use-dice.ts      useDice (histórico 50 rolls, isRolling)
│   │
│   ├── dice-engine/     ← Lógica de rolagem (server e client)
│   │   └── src/
│   │       └── roll.ts          rollDice(count, faces, modifier) → {rolls, total}
│   │
│   ├── rpg-viewer/      ← STUB — pendente implementação completa
│   │   └── src/
│   │       ├── index.ts         Re-exporta types
│   │       └── types.ts         ViewerMode, RpgViewerProps
│   │
│   └── ui/              Componentes compartilhados (Button)
│
└── server/
    ├── api-server/      Express · Prisma · porta 4000
    │   ├── prisma/
    │   │   └── schema.prisma    User, Campaign, Scene, Character,
    │   │                        CampaignInvite, Session
    │   └── src/
    │       ├── index.ts         Bootstrap + rotas
    │       ├── lib/
    │       │   ├── jwt.ts       signToken, verifyToken
    │       │   └── prisma.ts    Singleton PrismaClient
    │       ├── middleware/
    │       │   └── auth.ts      requireAuth, requireMaster
    │       └── routes/
    │           ├── auth.ts      POST /auth/register, /login · GET /auth/me
    │           ├── campaigns.ts GET/POST /campaigns · POST /invite · /session
    │           ├── scenes.ts    CRUD /scenes · GET /scenes/:id/url (server-to-server)
    │           └── characters.ts CRUD /characters · PATCH /sheet · /approve
    │                             + inviteRouter: POST /invites/:token/accept
    │
    └── game-server/     Express + Socket.io · porta 4001
        └── src/
            ├── index.ts         Bootstrap + Redis opcional
            ├── auth.ts          JWT middleware para Socket.io handshake
            ├── session-manager.ts RoomState em memória + persist Redis
            ├── collision.ts     isInsideTrigger, computeRevealedCells
            └── handlers.ts      Todos os eventos WS:
                                 room:join · scene:load · token:move
                                 chat:send · dice:roll · note:reveal
                                 trap:disarm · fog:clear · disconnect
```

---

## O contrato central: `.rpgscene`

Todo o projeto gira em torno deste arquivo JSON.
O editor **produz**, o game **consome**.

```
Editor → publica .rpgscene → API salva no storage
                                    ↓
                         game-server recebe sceneId
                                    ↓
                    Busca fileUrl via GET /scenes/:id/url
                                    ↓
                    Broadcast "scene:loaded" para toda a room
                                    ↓
              game app faz fetch do .rpgscene e renderiza
```

**Estrutura do arquivo:**

```ts
{
  $schema:  "rpg-scene/v1",
  meta:     SceneMeta,           // id, campaignId, name, version, tags…
  scene:    PascalNodeSnapshot,  // nodes + rootNodeIds (snapshot do Pascal)
  assets:   AssetManifest,       // models[], textures[], audio[]
  triggers: AnyTriggerNode[],    // notas, armadilhas, spawns, transições, áudio
  environment: EnvironmentConfig // névoa, luz, atmosfera, câmera
}
```

**Tipos de trigger implementados (`rpg-schema/src/triggers.ts`):**

| Tipo | Uso |
|------|-----|
| `trigger_note` | Anotação do mestre; pode revelar ao entrar na zona ou manualmente |
| `trigger_trap` | Armadilha com até 8 efeitos (damage, condition, sound, animation, custom) + saving throw |
| `trigger_spawn` | Ponto de início de personagem (player/npc/enemy/any) |
| `trigger_transition` | Porta para outra cena com efeito de transição |
| `trigger_ambient_audio` | Zona que muda o áudio ambiente ao entrar |

---

## Portas e variáveis de ambiente

| Serviço | Porta | Env var |
|---------|-------|---------|
| editor | 3001 | — |
| game | 3002 | `VITE_GAME_SERVER_URL`, `VITE_API_URL` |
| dashboard | 3003 | `VITE_API_URL`, `VITE_EDITOR_URL`, `VITE_GAME_URL` |
| api-server | 4000 | `API_SERVER_PORT`, `DATABASE_URL`, `JWT_SECRET` |
| game-server | 4001 | `GAME_SERVER_PORT`, `REDIS_URL`, `API_URL`, `SERVER_SECRET` |

Variáveis obrigatórias para rodar:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/rpg3d"
JWT_SECRET="string-longa-e-secreta"
SERVER_SECRET="secret-entre-game-server-e-api"
```

---

## Comandos principais

```bash
# Instalação
bun install

# Setup do banco (primeira vez)
cd server/api-server && bun db:push && bun db:generate && cd ../..

# Dev
bun dev                  # tudo junto (Turborepo)
bun dev:editor           # só editor  :3001
bun dev:game             # só game    :3002
bun dev:dashboard        # só dashboard :3003
bun dev:servers          # api :4000 + game-server :4001
bun dev:game-server      # só game-server
bun dev:api-server       # só api-server

# Qualidade
bun check-types          # TypeScript em todos os packages
bun lint                 # Biome lint
bun build                # build completo
```

---

## Convenções de código

### Nomes de packages

Todos os packages RPG usam `@rpg3d/*`:
- `@rpg3d/schema` — contrato central
- `@rpg3d/sync-client` — hooks WebSocket
- `@rpg3d/dice-engine` — lógica de dados
- `@rpg3d/viewer` — viewer com modos RPG (stub)
- `@rpg3d/ui` — componentes compartilhados

Os packages Pascal usam `@pascal-app/*` (importados como dependência, não modificar):
- `@pascal-app/core`
- `@pascal-app/viewer`
- `@pascal-app/editor`

### Estilo

- **Tailwind 4** para estilos — sem CSS modules, sem styled-components
- **Zustand** para estado global — sem Redux, sem Context para dados
- Componentes em `.tsx`, utilitários em `.ts`
- `"use client"` obrigatório em components do Next.js que usam hooks
- Imports com path aliases: `@/*` → `src/*` nos apps Vite; `@/*` → `./` no editor Next.js

### Zod

O projeto usa **Zod v4** (breaking changes em relação ao v3):
- `z.record()` exige dois parâmetros: `z.record(z.string(), z.unknown())`
- Importar como `import { z } from "zod"` em todos os schemas

### TypeScript

- **TypeScript 6** — strict mode ativado em todos os packages
- `tsconfig.json` do servidor: `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- `tsconfig.json` dos apps Vite: estende `@pascal/typescript-config/react-library.json`
- `tsconfig.json` do editor Next.js: estende `@pascal/typescript-config/nextjs.json`

---

## Estado de implementação

### ✅ Completo e funcional

| Módulo | Localização |
|--------|-------------|
| Schema Zod completo (.rpgscene, triggers, events, socket-types) | `packages/rpg-schema/` |
| Store de triggers do editor (CRUD + factory functions) | `apps/editor/store/trigger-store.ts` |
| Store de environment com 5 presets | `apps/editor/store/environment-store.ts` |
| Aba de ambiente no editor (névoa, luz, atmosfera, câmera) | `apps/editor/components/environment/` |
| Aba de triggers no editor (lista + painel de edição por tipo) | `apps/editor/components/triggers/` |
| Toolbar RPG no slot do Pascal Editor | `apps/editor/components/toolbar/rpg-toolbar-slot.tsx` |
| Exportação de .rpgscene (download) | `apps/editor/lib/export-scene.ts` |
| Câmera isométrica 45° com pan/zoom/touch | `apps/game/src/components/canvas/iso-camera.tsx` |
| Fog of war com DataTexture shader | `apps/game/src/components/canvas/fog-of-war.tsx` |
| Token 3D arrastável com pointer capture | `apps/game/src/components/tokens/token-mesh.tsx` |
| Chat com 4 canais + mini-markdown | `apps/game/src/components/chat/chat-panel.tsx` |
| Painel de dados d4–d% com histórico + toggle 3D | `apps/game/src/components/dice/dice-panel.tsx` |
| Física de dados 3D (Rapier) — geometrias (d10 trapezoedro real), faces numeradas, troca de face para o resultado do servidor (esquema Dice So Nice), assentamento, temas, materiais PBR | `apps/game/src/components/dice/`, `apps/game/src/store/dice-settings-store.ts` |
| Tokens NPC/enemy — spawn via popup, arrastar (mestre), despawn com duplo-clique, broadcast WS | `apps/game/src/components/canvas/game-canvas.tsx`, `packages/sync-client/src/use-game-room.ts` |
| Notificações de triggers com detalhes de armadilha | `apps/game/src/components/hud/trigger-notifications.tsx` |
| Controles do mestre com lista de cenas da API | `apps/game/src/components/hud/master-controls.tsx` |
| Session page completa (HUD + canvas + WebSocket) | `apps/game/src/pages/session-page.tsx` |
| Lobby com login e seleção de campanha | `apps/game/src/pages/lobby-page.tsx` |
| API client tipado (auth, campaigns, scenes, characters, invites) | `apps/game/src/lib/api-client.ts` |
| Zustand + Socket.io: useGameRoom, useChat, useDice | `packages/sync-client/src/` |
| game-server: rooms, session state, Redis opcional | `server/game-server/src/session-manager.ts` |
| game-server: todos os handlers WS implementados | `server/game-server/src/handlers.ts` |
| game-server: detecção de colisão com triggers | `server/game-server/src/collision.ts` |
| game-server: fog modes circle/raycast/room + extração de paredes Pascal | `server/game-server/src/collision.ts` |
| api-server: auth JWT + bcrypt | `server/api-server/src/routes/auth.ts` |
| api-server: CRUD campanhas + convites + session token | `server/api-server/src/routes/campaigns.ts` |
| api-server: CRUD cenas + endpoint /url server-to-server | `server/api-server/src/routes/scenes.ts` |
| api-server: CRUD personagens + wizard de ficha + aprovação | `server/api-server/src/routes/characters.ts` |
| Dashboard: login + lista de campanhas + convites | `apps/dashboard/src/pages/campaigns-page.tsx` |
| Dashboard: aceitar convite | `apps/dashboard/src/pages/invite-page.tsx` |
| Dashboard: wizard de ficha 4 etapas | `apps/dashboard/src/pages/character-page.tsx` |
| Prisma schema completo | `server/api-server/prisma/schema.prisma` |

### 🔶 Parcialmente implementado

| Módulo | Status | Próximos passos |
|--------|--------|-----------------|
| `packages/rpg-viewer/` | Stub — só exporta tipos | Implementar modos mestre/jogador, câmera isométrica própria, fog shader integrado |
| `game-canvas.tsx` — integração Pascal Viewer | Lazy import do `@pascal-app/viewer` configurado, mas o `PascalViewer` pode não receber `children` R3F diretamente | Testar integração real; fallback para Canvas R3F próprio já existe |
| `pascal-bridge.ts` | Chama `useScene.getState().setScene()` via dynamic import | Verificar se a API `setScene` existe ou se é `setState`; ajustar conforme a versão do pascal-core |
| `apps/game/src/components/canvas/game-canvas.tsx` | Layer 2 (R3F fallback) funcional; Layer 1 (Pascal Viewer) precisa de teste real | Testar com `bun dev:game` e verificar console errors |
| Editor — posicionamento de triggers | Usa coordenada 2D aproximada (tela → world linear) | Implementar raycasting real contra o plano Y=0 usando Three.js |

### ❌ Pendente / próximas features

| Feature | Contexto |
|---------|----------|
| `rpg-viewer` package completo | Viewer com câmera isométrica RPG própria, fog of war integrado, modo mestre vs jogador |
| Upload de assets para object storage | Editor precisa de upload de .glb e áudio; hoje só aceita URLs externas |
| Sistema de jogo custom | `campaign.systemId` existe no schema mas só D&D 5e está mapeado na ficha |
| Gerenciamento de campanha no dashboard | `GET /campaigns/:id` retorna dados mas a página `/campaign/:id` só redireciona para campaigns |
| Sessão salva / log de sessão | `Session` model existe no Prisma mas não há endpoint de log |
| Modo first_person | `CameraConfig.mode = "first_person"` está no schema mas não na câmera |

---

## Fluxo de dados em tempo real

```
Jogador move token
        │
        ▼
game (token:move) ──WebSocket──► game-server
                                      │
                          isInsideTrigger() para cada trigger da cena
                                      │
                          computeRevealedCells() para fog of war
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
             token:moved        trigger:activated    fog:revealed
                    │                 │                  │
            todos na room      todos na room       todos na room
                    │                 │                  │
          atualiza posição   TriggerNotification    atualiza shader
          de outros tokens     aparece na UI       DataTexture do fog
```

---

## Pascal Editor — como a integração funciona

O `apps/editor` usa o Pascal Editor via API oficial do package `@pascal-app/editor`:

```tsx
// editor-root.tsx
<Editor
  layoutVersion="v2"
  projectId="rpg3d-local"
  sidebarTabs={[
    { id: "site",        component: () => null },    // padrão Pascal
    { id: "items",       component: ItemsPanel },    // padrão Pascal
    { id: "triggers",    component: TriggerSidebarTab },  // ← nosso
    { id: "environment", component: EnvironmentSidebarTab }, // ← nosso
  ]}
  viewerToolbarRight={<RpgToolbarSlot onPublish={handlePublish} />} // ← nosso
  onLoad={onLoad}   // ← lê do localStorage
  onSave={onSave}   // ← salva no localStorage
/>
```

O Pascal salva automaticamente a cena via `useAutoSave` (debounced 1s).
Nós salvamos os triggers e environment separadamente em chaves distintas do localStorage.

O `handlePublish` captura o state atual via `useScene.getState()` e mescla com
triggers + environment para gerar o `.rpgscene` completo.

**IMPORTANTE:** os packages `packages/pascal-*` são forks do código-fonte do Pascal.
Não modifique esses arquivos diretamente — use a API pública (`@pascal-app/editor`,
`@pascal-app/core`, `@pascal-app/viewer`) nos apps e nos packages RPG.

---

## Adicionar uma nova feature — checklist

1. **Schema primeiro** — se envolve dados novos, adicionar em `packages/rpg-schema/src/`
2. **Evento WS** — se envolve comunicação em tempo real, adicionar em `events.ts` e `socket-types.ts`
3. **Handler no game-server** — registrar em `handlers.ts` e `SessionManager` se tiver estado
4. **Hook no sync-client** — expor via `use-game-room.ts`, `use-chat.ts` ou novo hook
5. **UI** — implementar no app correto (editor/game/dashboard)
6. **Rota na API** — se precisa de persistência, adicionar em `api-server/src/routes/`
7. **Prisma schema** — se precisa de nova tabela, adicionar em `schema.prisma` e rodar `bun db:push`

---

## Problemas conhecidos e workarounds

**`z.record()` no Zod v4**
Sempre usar dois parâmetros: `z.record(z.string(), z.unknown())`.
O Zod v4 quebrou a API do v3 aqui.

**Pascal Viewer como children R3F**
O `Viewer` do Pascal cria seu próprio `<Canvas>` internamente.
Passar elements R3F como `children` pode não funcionar dependendo da versão.
Se o Layer 1 (Pascal) não renderizar, usar o Layer 2 (Canvas R3F próprio) como fallback —
ele já está implementado em `game-canvas.tsx` e aparece automaticamente quando `pascalReady = false`.

**`useScene` do pascal-core**
A API pode ser `setScene(nodes, rootNodeIds)` ou `setState({ nodes, rootNodeIds })`.
Verificar a versão atual em `packages/pascal-core/src/store/use-scene.ts` antes de usar.
O `pascal-bridge.ts` faz o dynamic import para não quebrar SSR.

**Tokens JWT de sessão vs de usuário**
O api-server emite dois tipos de JWT:
- **Token de usuário** (login): payload `{ sub, name, email }`
- **Token de sessão** (POST /campaigns/:id/session): payload `{ sub, name, email, isMaster, campaignId, characterId? }`

O game-server usa o token de sessão. O auth middleware do game-server
aceita tokens dev sem validação quando `NODE_ENV !== "production"`.

---

## Testes

O `api-server` tem suite de integração completa em `server/api-server/src/test/`:
- `auth.test.ts` — 15 testes (register, login, /me, refresh, logout)
- `systems.test.ts` — 8 testes (listagem, purchase, créditos)
- `internal.test.ts` — 11 testes (session-log, session-end, GET /sessions/:id/log)

```bash
# SEMPRE usar bun run test — não usar bun test (roda o runner nativo do Bun,
# que ignora vitest globalSetup/setupFiles e causa falhas espúrias)
cd server/api-server && bun run test
```

Requer PostgreSQL rodando localmente. O `global-setup.ts` cria o banco `rpg3d_test`
via Docker (`rpg3d-postgres`) e roda `prisma db push`. O `setup.ts` limpa todas as
tabelas em ordem de FK antes de cada teste.

O Pascal tem alguns `.test.ts` nos seus packages (`pascal-core`, `pascal-editor`) que
foram herdados — não os quebrar.

Para validação manual:
```bash
bun check-types   # verifica todos os tipos
bun lint          # biome lint
```
