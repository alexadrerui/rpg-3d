"use client"
import { useState } from "react"
import { clsx }     from "clsx"
import { useEnvironmentStore, ENV_PRESETS, DEFAULT_ENVIRONMENT, type EnvPreset } from "../../store/environment-store"
import type { EnvironmentConfig } from "@rpg3d/schema"

// ─────────────────────────────────────────────────────────────────────────────
// EnvironmentSidebarTab — aba de ambiente no Pascal Editor sidebar
// 4 seções: Névoa de guerra · Iluminação · Atmosfera · Câmera
// ─────────────────────────────────────────────────────────────────────────────

type Section = "fog" | "lighting" | "atmosphere" | "camera"

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "fog",        label: "Névoa de guerra", icon: "☁" },
  { key: "lighting",   label: "Iluminação",       icon: "💡" },
  { key: "atmosphere", label: "Atmosfera",        icon: "🌌" },
  { key: "camera",     label: "Câmera",           icon: "🎥" },
]

const PRESETS: { key: EnvPreset; label: string; icon: string; desc: string }[] = [
  { key: "dungeon", label: "Masmorra",   icon: "🏚", desc: "Escuro, nevoa total"    },
  { key: "forest",  label: "Floresta",   icon: "🌲", desc: "Verde, névoa de raycast"},
  { key: "tavern",  label: "Taverna",    icon: "🍺", desc: "Quente, sem névoa"      },
  { key: "daylit",  label: "Dia aberto", icon: "☀",  desc: "Luz solar intensa"      },
  { key: "void",    label: "Vazio",      icon: "◾",  desc: "Escuridão total"        },
]

export function EnvironmentSidebarTab() {
  const [activeSection, setActiveSection] = useState<Section>("fog")
  const [showPresets, setShowPresets]     = useState(false)
  const { env, applyPreset, reset }       = useEnvironmentStore()

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-300">

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300">Ambiente da cena</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPresets(s => !s)}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 bg-neutral-800 hover:bg-neutral-700 px-2 py-0.5 rounded transition-colors"
            >
              Presets
            </button>
            <button
              onClick={() => { if (confirm("Redefinir para os padrões?")) reset() }}
              className="text-[10px] text-neutral-600 hover:text-neutral-400 px-1.5 py-0.5 rounded transition-colors"
              title="Redefinir"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Presets dropdown */}
        {showPresets && (
          <div className="grid grid-cols-1 gap-1">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => { applyPreset(p.key); setShowPresets(false) }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-left transition-colors"
              >
                <span className="text-base w-5 text-center">{p.icon}</span>
                <div>
                  <p className="text-xs font-medium text-neutral-200">{p.label}</p>
                  <p className="text-[10px] text-neutral-600">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Section tabs ── */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            title={s.label}
            className={clsx(
              "flex-1 flex flex-col items-center py-2 text-sm transition-colors border-b-2",
              activeSection === s.key
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-neutral-600 hover:text-neutral-400"
            )}
          >
            <span>{s.icon}</span>
            <span className="text-[9px] mt-0.5 hidden lg:block">{s.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* ── Section content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "fog"        && <FogSection env={env} />}
        {activeSection === "lighting"   && <LightingSection env={env} />}
        {activeSection === "atmosphere" && <AtmosphereSection env={env} />}
        {activeSection === "camera"     && <CameraSection env={env} />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NÉVOA DE GUERRA
// ─────────────────────────────────────────────────────────────────────────────

function FogSection({ env }: { env: EnvironmentConfig }) {
  const { setFogOfWar } = useEnvironmentStore()
  const fog = env.fogOfWar

  return (
    <div className="p-4 space-y-5">
      <SectionHeader icon="☁" label="Névoa de guerra" />

      <Toggle
        label="Ativar névoa de guerra"
        checked={fog.enabled}
        onChange={v => setFogOfWar({ enabled: v })}
      />

      {fog.enabled && <>
        <Row>
          <Field label="Cor da névoa">
            <ColorInput value={fog.color} onChange={v => setFogOfWar({ color: v })} />
          </Field>
          <Field label="Opacidade">
            <NumberInput value={fog.opacity} min={0} max={1} step={0.05}
              onChange={v => setFogOfWar({ opacity: v })} />
          </Field>
        </Row>

        <Field label="Raio de revelação">
          <div className="flex items-center gap-2">
            <input type="range" min={1} max={20} step={0.5} value={fog.revealRadius}
              onChange={e => setFogOfWar({ revealRadius: Number(e.target.value) })}
              className="flex-1 accent-purple-500" />
            <span className="text-xs text-neutral-400 w-10 text-right">{fog.revealRadius}u</span>
          </div>
        </Field>

        <Field label="Modo de revelação">
          <Select
            value={fog.revealMode}
            onChange={v => setFogOfWar({ revealMode: v as typeof fog.revealMode })}
            options={[
              { value: "circle",  label: "Círculo (rápido)" },
              { value: "raycast", label: "Linha de visão (preciso)" },
              { value: "room",    label: "Sala inteira" },
            ]}
          />
        </Field>

        <Toggle
          label="Manter área revelada"
          desc="Área já revelada permanece visível ao mover"
          checked={fog.persistRevealed}
          onChange={v => setFogOfWar({ persistRevealed: v })}
        />
      </>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

function LightingSection({ env }: { env: EnvironmentConfig }) {
  const { setLighting } = useEnvironmentStore()
  const { ambient, directional, toneMappingExposure } = env.lighting

  return (
    <div className="p-4 space-y-5">
      <SectionHeader icon="💡" label="Iluminação" />

      {/* Ambient */}
      <Subsection label="Luz ambiente">
        <Row>
          <Field label="Cor">
            <ColorInput value={ambient.color}
              onChange={v => setLighting({ ambient: { ...ambient, color: v } })} />
          </Field>
          <Field label="Intensidade">
            <NumberInput value={ambient.intensity} min={0} max={3} step={0.05}
              onChange={v => setLighting({ ambient: { ...ambient, intensity: v } })} />
          </Field>
        </Row>
        <IntensityBar value={ambient.intensity} max={3} color={ambient.color} />
      </Subsection>

      {/* Directional */}
      <Subsection label="Luz direcional">
        <Toggle
          label="Ativar"
          checked={directional.enabled}
          onChange={v => setLighting({ directional: { ...directional, enabled: v } })}
        />
        {directional.enabled && <>
          <Row>
            <Field label="Cor">
              <ColorInput value={directional.color}
                onChange={v => setLighting({ directional: { ...directional, color: v } })} />
            </Field>
            <Field label="Intensidade">
              <NumberInput value={directional.intensity} min={0} max={5} step={0.1}
                onChange={v => setLighting({ directional: { ...directional, intensity: v } })} />
            </Field>
          </Row>
          <IntensityBar value={directional.intensity} max={5} color={directional.color} />

          <p className="text-[10px] text-neutral-600 mt-1">Posição da fonte</p>
          <div className="grid grid-cols-3 gap-2">
            {(["x","y","z"] as const).map(axis => (
              <Field key={axis} label={axis.toUpperCase()}>
                <NumberInput value={directional.position[axis]} min={-50} max={50} step={1}
                  onChange={v => setLighting({ directional: { ...directional, position: { ...directional.position, [axis]: v } } })} />
              </Field>
            ))}
          </div>

          <Toggle
            label="Sombras"
            checked={directional.castShadow}
            onChange={v => setLighting({ directional: { ...directional, castShadow: v } })}
          />
        </>}
      </Subsection>

      {/* Tone mapping */}
      <Subsection label="Exposição">
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={3} step={0.05} value={toneMappingExposure}
            onChange={e => setLighting({ toneMappingExposure: Number(e.target.value) })}
            className="flex-1 accent-purple-500" />
          <span className="text-xs text-neutral-400 w-10 text-right">
            {toneMappingExposure.toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-neutral-600">
          {toneMappingExposure < 0.6 ? "Escuro" : toneMappingExposure > 1.5 ? "Muito brilhante" : "Normal"}
        </p>
      </Subsection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ATMOSFERA
// ─────────────────────────────────────────────────────────────────────────────

function AtmosphereSection({ env }: { env: EnvironmentConfig }) {
  const { setAtmosphere } = useEnvironmentStore()
  const { skybox, fog, ambientSound } = env.atmosphere

  return (
    <div className="p-4 space-y-5">
      <SectionHeader icon="🌌" label="Atmosfera" />

      {/* Skybox */}
      <Subsection label="Fundo da cena (skybox)">
        <Field label="Tipo">
          <Select
            value={skybox.kind}
            onChange={v => {
              if (v === "color") setAtmosphere({ skybox: { kind: "color", color: "#1a1a2e" } })
              else if (v === "none") setAtmosphere({ skybox: { kind: "none" } })
            }}
            options={[
              { value: "color", label: "Cor sólida" },
              { value: "none",  label: "Transparente" },
            ]}
          />
        </Field>
        {skybox.kind === "color" && (
          <Field label="Cor do fundo">
            <ColorInput
              value={skybox.color}
              onChange={v => setAtmosphere({ skybox: { kind: "color", color: v } })}
            />
          </Field>
        )}
      </Subsection>

      {/* Volumetric fog */}
      <Subsection label="Névoa volumétrica">
        <Toggle
          label="Ativar névoa"
          desc="Neblina de profundidade na cena 3D"
          checked={fog.enabled}
          onChange={v => setAtmosphere({ fog: { ...fog, enabled: v } })}
        />
        {fog.enabled && <>
          <Field label="Cor da névoa">
            <ColorInput value={fog.color}
              onChange={v => setAtmosphere({ fog: { ...fog, color: v } })} />
          </Field>
          <Row>
            <Field label="Início (near)">
              <NumberInput value={fog.near} min={1} max={100} step={1}
                onChange={v => setAtmosphere({ fog: { ...fog, near: v } })} />
            </Field>
            <Field label="Fim (far)">
              <NumberInput value={fog.far} min={1} max={200} step={5}
                onChange={v => setAtmosphere({ fog: { ...fog, far: v } })} />
            </Field>
          </Row>
          <p className="text-[10px] text-neutral-600">
            Objetos além de {fog.far}u ficam totalmente ocultos
          </p>
        </>}
      </Subsection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CÂMERA
// ─────────────────────────────────────────────────────────────────────────────

function CameraSection({ env }: { env: EnvironmentConfig }) {
  const { setCamera } = useEnvironmentStore()
  const cam = env.camera

  const [showBounds, setShowBounds] = useState(!!cam.bounds)

  return (
    <div className="p-4 space-y-5">
      <SectionHeader icon="🎥" label="Câmera padrão" />

      <Field label="Modo de câmera">
        <Select
          value={cam.mode}
          onChange={v => setCamera({ mode: v as typeof cam.mode })}
          options={[
            { value: "isometric",   label: "Isométrico (RPG clássico)" },
            { value: "top_down",    label: "Visão de cima" },
            { value: "free_orbit",  label: "Livre (órbita)" },
            { value: "first_person",label: "Primeira pessoa" },
          ]}
        />
      </Field>

      <Row>
        <Field label="Zoom mínimo">
          <NumberInput value={cam.minZoom} min={1} max={50} step={1}
            onChange={v => setCamera({ minZoom: v })} />
        </Field>
        <Field label="Zoom máximo">
          <NumberInput value={cam.maxZoom} min={5} max={200} step={5}
            onChange={v => setCamera({ maxZoom: v })} />
        </Field>
      </Row>

      <Subsection label="Posição inicial">
        <div className="grid grid-cols-3 gap-2">
          {(["x","y","z"] as const).map(axis => (
            <Field key={axis} label={`Pos ${axis.toUpperCase()}`}>
              <NumberInput value={cam.defaultPosition[axis]} min={-100} max={100} step={1}
                onChange={v => setCamera({ defaultPosition: { ...cam.defaultPosition, [axis]: v } })} />
            </Field>
          ))}
        </div>
        <p className="text-[10px] text-neutral-600 mt-1">Alvo da câmera</p>
        <div className="grid grid-cols-3 gap-2">
          {(["x","y","z"] as const).map(axis => (
            <Field key={axis} label={`Alvo ${axis.toUpperCase()}`}>
              <NumberInput value={cam.defaultTarget[axis]} min={-100} max={100} step={1}
                onChange={v => setCamera({ defaultTarget: { ...cam.defaultTarget, [axis]: v } })} />
            </Field>
          ))}
        </div>
      </Subsection>

      <Subsection label="Limites de pan">
        <Toggle
          label="Restringir área navegável"
          checked={showBounds}
          onChange={v => {
            setShowBounds(v)
            if (!v) setCamera({ bounds: undefined })
            else setCamera({ bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 } })
          }}
        />
        {showBounds && cam.bounds && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(["minX","maxX","minZ","maxZ"] as const).map(k => (
              <Field key={k} label={k}>
                <NumberInput value={cam.bounds![k]} min={-200} max={200} step={1}
                  onChange={v => setCamera({ bounds: { ...cam.bounds!, [k]: v } })} />
              </Field>
            ))}
          </div>
        )}
      </Subsection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Componentes de UI internos
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-neutral-800">
      <span>{icon}</span>
      <span className="text-xs font-semibold text-neutral-200">{label}</span>
    </div>
  )
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">{label}</p>
      <div className="space-y-2 pl-0">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 flex-1">
      <p className="text-[10px] text-neutral-600">{label}</p>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 items-end">{children}</div>
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="sr-only" />
        <div className={clsx(
          "w-8 h-4 rounded-full transition-colors",
          checked ? "bg-purple-600" : "bg-neutral-700"
        )}>
          <div className={clsx(
            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
            checked ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
      </div>
      <div>
        <p className="text-xs text-neutral-300 group-hover:text-neutral-100 transition-colors">{label}</p>
        {desc && <p className="text-[10px] text-neutral-600 mt-0.5">{desc}</p>}
      </div>
    </label>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
      <input
        type="text"
        value={value}
        onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
        className="flex-1 bg-neutral-800 text-neutral-300 text-xs rounded px-2 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 font-mono"
        maxLength={7}
      />
    </div>
  )
}

function NumberInput({ value, min, max, step, onChange }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min} max={max} step={step}
      onChange={e => {
        const v = Number(e.target.value)
        if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
      }}
      className="w-full bg-neutral-800 text-neutral-300 text-xs rounded px-2 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500 text-center"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-neutral-800 text-neutral-300 text-xs rounded px-2 py-1.5 border border-neutral-700/50 outline-none focus:border-neutral-500">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function IntensityBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
      />
    </div>
  )
}

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
