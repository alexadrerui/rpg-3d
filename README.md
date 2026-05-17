# RPG 3D

Plataforma open-source de RPG de mesa com cenários 3D em tempo real.

Construída com React Three Fiber + WebGPU, rodando no navegador sem plugins.
Fork do [Pascal Editor](https://github.com/pascalorg/editor) (MIT) estendido com camada RPG completa.

---

## Funcionalidades

**Pilar 1 — Campanha**
- Criação de campanha pelo mestre com sistema de jogo (D&D 5e, Pathfinder, custom)
- Convites via link com expiração
- Ficha de personagem por etapas (raça, classe, atributos, história, aparência)
- Aprovação de ficha pelo mestre

**Pilar 2 — Editor de cenário**
- Editor 3D completo baseado no Pascal Editor (WebGPU)
- Ferramentas RPG: notas, armadilhas, spawn points, transições de cena, áudio ambiente
- Configuração de ambiente (névoa de guerra, iluminação, atmosfera, câmera)
- 5 presets rápidos (Masmorra, Floresta, Taverna, Dia aberto, Vazio)
- Exporta `.rpgscene` (JSON validado por Zod)

**Pilar 3 — Sessão ao vivo**
- Câmera isométrica RPG com pan e zoom
- Tokens de personagem arrastáveis no mapa
- Névoa de guerra com shader (círculo, raycast, sala)
- Chat com 4 canais (geral, mestre, sussurro, log de jogo)
- Rolagem de dados d4–d% com modificadores e histórico
- Notificações de triggers em tempo real (notas, armadilhas, transições)
- Sincronização via WebSocket (Socket.io)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 · Vite · Next.js 16 |
| 3D | Three.js (WebGPU) · React Three Fiber · Rapier physics |
| Estado | Zustand · Zundo |
| Estilo | Tailwind CSS 4 |
| Schema | Zod v4 · TypeScript 6 |
| Backend | Node.js · Express · Socket.io |
| Banco | PostgreSQL · Prisma ORM |
| Cache | Redis (opcional) |

---

## Estrutura

```
rpg-3d/
├── apps/
│   ├── editor/       → Editor de cenário (Next.js · porta 3001)
│   ├── game/         → Sessão ao vivo   (Vite   · porta 3002)
│   └── dashboard/    → Campanhas/fichas (Vite   · porta 3003)
├── packages/
│   ├── pascal-core/  → Fork @pascal-app/core
│   ├── pascal-viewer/→ Fork @pascal-app/viewer
│   ├── pascal-editor/→ Fork @pascal-app/editor
│   ├── rpg-schema/   → Contrato central (.rpgscene · triggers · WS events)
│   ├── rpg-viewer/   → Viewer com modos mestre/jogador e câmera RPG
│   ├── sync-client/  → useGameRoom · useChat · useDice
│   ├── dice-engine/  → Física de dados + lógica de rolagem
│   └── ui/           → Componentes compartilhados
└── server/
    ├── api-server/   → REST API (Express · Prisma · porta 4000)
    └── game-server/  → WebSocket (Socket.io · Redis · porta 4001)
```

---

## Início rápido

### Pré-requisitos
- Node.js 18+
- Bun 1.3+
- PostgreSQL 15+
- Redis (opcional)

### Instalação

```bash
git clone https://github.com/seu-usuario/rpg-3d.git
cd rpg-3d

cp .env.example .env.local
# Edite DATABASE_URL, JWT_SECRET, SERVER_SECRET

bun install

# Setup do banco de dados
cd server/api-server
bun db:push        # cria as tabelas
bun db:generate    # gera o Prisma Client
cd ../..
```

### Desenvolvimento

```bash
# Tudo junto
bun dev

# Separado
bun dev:editor      # http://localhost:3001
bun dev:game        # http://localhost:3002
bun dev:dashboard   # http://localhost:3003
bun dev:servers     # api :4000 + game-server :4001
```

### Fluxo de uso

```
1. Dashboard (:3003) → criar conta → criar campanha → enviar convite
2. Jogadores aceitam o convite → preenchem a ficha
3. Mestre aprova as fichas no dashboard
4. Mestre abre o Editor (:3001) → cria o cenário → adiciona triggers → publica .rpgscene
5. Mestre entra na sessão (:3002) → carrega o cenário → mestre e jogadores jogam
```

---

## Checklist de produção

### Variáveis de ambiente obrigatórias

```bash
# server/api-server/.env
DATABASE_URL="postgresql://user:pass@host:5432/rpg3d"
JWT_SECRET="string-longa-e-aleatoria"          # min. 32 chars
SERVER_SECRET="string-longa-e-aleatoria"        # min. 32 chars
IP_HASH_SALT="string-longa-e-aleatoria"         # ⚠️ não alterar após primeiro cadastro

# apps/dashboard/.env
VITE_GA_MEASUREMENT_ID="G-XXXXXXXXXX"           # Google Analytics 4
```

> **`IP_HASH_SALT`** — usado para anonimizar o IP de cadastro (LGPD art. 12).
> Gere com `openssl rand -hex 32`. **Nunca altere após usuários já cadastrados**,
> pois os hashes existentes ficam incomparáveis.
>
> **`VITE_GA_MEASUREMENT_ID`** — o banner de consentimento no dashboard
> só carrega o script do GA4 após aceite explícito do usuário.

### Após subir o banco pela primeira vez

```bash
cd server/api-server
bun db:push        # aplica o schema (inclui registrationIpHash e créditos)
bun db:generate    # regenera o Prisma Client
```

---

## Contribuindo

Issues e PRs são bem-vindos. Veja os templates em `.github/`.

```bash
# Antes de abrir PR
bun check-types
bun lint
```

---

## Licença

MIT — baseado no [Pascal Editor](https://github.com/pascalorg/editor) (MIT).
