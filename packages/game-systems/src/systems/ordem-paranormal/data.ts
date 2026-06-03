// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de regras de Ordem Paranormal (RPG da Jambô Editora).
// Extraído do projeto C.R.I.S. (mirror estático) — src/db.js + agente/ficha.html.
// Fan content não-oficial; usado apenas como sistema de ficha.
// ─────────────────────────────────────────────────────────────────────────────

export type AttrKey = "FOR" | "AGI" | "INT" | "PRE" | "VIG"

export const ATRIBUTOS: { key: AttrKey; label: string }[] = [
  { key: "FOR", label: "Força" },
  { key: "AGI", label: "Agilidade" },
  { key: "INT", label: "Intelecto" },
  { key: "PRE", label: "Presença" },
  { key: "VIG", label: "Vigor" },
]

// flag: "*" = só treinado pode usar · "+" = sofre penalidade de carga
export const PERICIAS: { nome: string; dado: AttrKey; flag: string }[] = [
  { nome: "Acrobacia",     dado: "AGI", flag: "+"  },
  { nome: "Adestramento",  dado: "PRE", flag: "*"  },
  { nome: "Artes",         dado: "PRE", flag: "*"  },
  { nome: "Atletismo",     dado: "FOR", flag: ""   },
  { nome: "Atualidades",   dado: "INT", flag: ""   },
  { nome: "Ciências",      dado: "INT", flag: "*"  },
  { nome: "Crime",         dado: "AGI", flag: "*+" },
  { nome: "Diplomacia",    dado: "PRE", flag: ""   },
  { nome: "Enganação",     dado: "PRE", flag: ""   },
  { nome: "Fortitude",     dado: "VIG", flag: ""   },
  { nome: "Furtividade",   dado: "AGI", flag: "+"  },
  { nome: "Iniciativa",    dado: "AGI", flag: ""   },
  { nome: "Intimidação",   dado: "PRE", flag: ""   },
  { nome: "Intuição",      dado: "PRE", flag: ""   },
  { nome: "Investigação",  dado: "INT", flag: ""   },
  { nome: "Luta",          dado: "FOR", flag: ""   },
  { nome: "Medicina",      dado: "INT", flag: "*"  },
  { nome: "Ocultismo",     dado: "INT", flag: "*"  },
  { nome: "Percepção",     dado: "PRE", flag: ""   },
  { nome: "Pilotagem",     dado: "AGI", flag: "*"  },
  { nome: "Pontaria",      dado: "AGI", flag: ""   },
  { nome: "Profissão",     dado: "INT", flag: "*"  },
  { nome: "Reflexos",      dado: "AGI", flag: ""   },
  { nome: "Religião",      dado: "PRE", flag: "*"  },
  { nome: "Sobrevivência", dado: "INT", flag: ""   },
  { nome: "Tática",        dado: "INT", flag: "*"  },
  { nome: "Tecnologia",    dado: "INT", flag: "*"  },
  { nome: "Vontade",       dado: "PRE", flag: ""   },
]

/** Níveis de treino em perícia (valor somado ao teste). */
export const TREINO = [
  { v: 0,  label: "—"        },
  { v: 5,  label: "Treinado" },
  { v: 10, label: "Veterano" },
  { v: 15, label: "Expert"   },
]

export const CLASSES: Record<string, {
  pvBase: number; peBase: number; sanBase: number; prof: string; periciasFixas: string[]
}> = {
  "Combatente":   { pvBase: 20, peBase: 2, sanBase: 12, prof: "Armas simples, táticas e proteções leves", periciasFixas: [] },
  "Especialista": { pvBase: 16, peBase: 3, sanBase: 16, prof: "Armas simples e proteções leves",          periciasFixas: [] },
  "Ocultista":    { pvBase: 12, peBase: 4, sanBase: 20, prof: "Armas simples",                             periciasFixas: ["Ocultismo", "Vontade"] },
  "Mundano":      { pvBase: 12, peBase: 2, sanBase: 12, prof: "—",                                         periciasFixas: [] },
}

/** PV/PE máximos por classe (base da classe + atributo relevante). */
export function pvMax(classe: string, vig: number): number {
  return (CLASSES[classe]?.pvBase ?? 12) + (vig || 0)
}
export function peMax(classe: string, pre: number): number {
  return (CLASSES[classe]?.peBase ?? 2) + (pre || 0)
}
export function sanMax(classe: string): number {
  return CLASSES[classe]?.sanBase ?? 12
}

/** DT padrão de habilidades/rituais = 10 + Presença. */
export function dtPadrao(pre: number): number {
  return 10 + (pre || 0)
}

export type Origem = { pericias: string[]; poder: { titulo: string; desc: string } }

export const ORIGENS: Record<string, Origem> = {
  "Acadêmico":              { pericias: ["Ciências", "Investigação"],     poder: { titulo: "Saber é Poder",           desc: "Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste." } },
  "Agente de Saúde":        { pericias: ["Intuição", "Medicina"],         poder: { titulo: "Técnica Medicinal",       desc: "Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados." } },
  "Amnésico":               { pericias: [],                               poder: { titulo: "Vislumbres do Passado",   desc: "Uma vez por sessão, você pode fazer um teste de Intelecto (DT 10) para reconhecer pessoas ou lugares familiares. Se passar, recebe 1d4 PE temporários e uma informação útil (a critério do mestre)." } },
  "Artista":                { pericias: ["Artes", "Enganação"],           poder: { titulo: "Magnum Opus",             desc: "Você é famoso por uma de suas obras. Uma vez por missão, pode determinar que um personagem o reconheça e recebe +5 em testes de Presença contra ele." } },
  "Atleta":                 { pericias: ["Acrobacia", "Atletismo"],       poder: { titulo: "110%",                    desc: "Quando faz um teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria) você pode gastar 2 PE para receber +5 nesse teste." } },
  "Chef":                   { pericias: ["Fortitude", "Profissão"],       poder: { titulo: "Ingrediente Secreto",     desc: "Em interlúdios, pode cozinhar um prato especial: você e aliados que se alimentarem recebem o benefício de dois pratos." } },
  "Cientista Forense":      { pericias: ["Ciências", "Investigação"],     poder: { titulo: "Investigação Científica", desc: "Uma vez por cena de investigação, pode gastar uma ação livre para procurar pistas usando Ciências no lugar da perícia normal." } },
  "Criminoso":              { pericias: ["Crime", "Furtividade"],         poder: { titulo: "O Crime Compensa",        desc: "No fim de uma missão, escolha um item encontrado; na próxima missão pode incluí-lo sem contar no limite por patente." } },
  "Cultista Arrependido":   { pericias: ["Ocultismo", "Religião"],        poder: { titulo: "Traços do Outro Lado",    desc: "Você possui um poder paranormal à sua escolha. Porém, começa com metade da Sanidade normal da sua classe." } },
  "Desgarrado":             { pericias: ["Fortitude", "Sobrevivência"],   poder: { titulo: "Calejado",                desc: "Você recebe +1 PV para cada 5% de NEX." } },
  "Dublê":                  { pericias: ["Pilotagem", "Reflexos"],        poder: { titulo: "Destemido",               desc: "Quando faz um teste cuja falha causa dano ou condição negativa, recebe +5 nesse teste." } },
  "Engenheiro":             { pericias: ["Profissão", "Tecnologia"],      poder: { titulo: "Ferramentas Favoritas",   desc: "Um item à sua escolha (exceto armas) conta como uma categoria abaixo." } },
  "Escritor":               { pericias: ["Artes", "Atualidades"],         poder: { titulo: "Bagagem de Leitura",      desc: "Uma vez por cena, pode gastar 2 PE para se tornar treinado em uma perícia qualquer até o fim da cena." } },
  "Executivo":              { pericias: ["Diplomacia", "Profissão"],      poder: { titulo: "Processo Otimizado",      desc: "Em testes estendidos ou ao revisar documentos, pode pagar 2 PE para receber +5 nesse teste." } },
  "Gaudério Abutre":        { pericias: ["Luta", "Pilotagem"],            poder: { titulo: "Fraternidade Gaudéria",   desc: "Uma vez por rodada, pode gastar 1 PE para trocar de lugar com um aliado adjacente alvo de ataque e tornar-se o alvo; depois recebe +2 em ataques contra o agressor." } },
  "Ginasta":                { pericias: ["Acrobacia", "Reflexos"],        poder: { titulo: "Mobilidade Acrobática",   desc: "Você recebe +2 na Defesa e seu deslocamento aumenta em +3m." } },
  "Investigador":           { pericias: ["Investigação", "Percepção"],    poder: { titulo: "Faro para Pistas",        desc: "Uma vez por cena, ao procurar pistas, pode gastar 1 PE para receber +5 nesse teste." } },
  "Jornalista":             { pericias: ["Atualidades", "Investigação"],  poder: { titulo: "Fontes Confiáveis",       desc: "Uma vez por sessão, pode gastar 1 PE para contatar fontes e rolar novamente um teste de pista com +5, ou receber outra informação." } },
  "Lutador":                { pericias: ["Luta", "Reflexos"],             poder: { titulo: "Mão Pesada",              desc: "Você recebe +2 em rolagens de dano com ataques corpo a corpo." } },
  "Magnata":                { pericias: ["Diplomacia", "Pilotagem"],      poder: { titulo: "Patrocinador da Ordem",   desc: "Seu limite de crédito é sempre considerado um acima do atual." } },
  "Mercenário":             { pericias: ["Iniciativa", "Intimidação"],    poder: { titulo: "Posição de Combate",      desc: "No primeiro turno de cada cena de ação, pode gastar 2 PE para receber uma ação de movimento adicional." } },
  "Militar":                { pericias: ["Pontaria", "Tática"],           poder: { titulo: "Para Bellum",             desc: "Você recebe +2 em rolagens de dano com armas de fogo." } },
  "Operário":               { pericias: ["Fortitude", "Profissão"],       poder: { titulo: "Ferramenta de Trabalho",  desc: "Escolha uma arma simples/tática usável como ferramenta na sua profissão; você sabe usá-la e recebe +1 em ataque, dano e margem de ameaça com ela." } },
  "Policial":               { pericias: ["Percepção", "Pontaria"],        poder: { titulo: "Patrulha",                desc: "Você recebe +2 em Defesa." } },
  "Professor":              { pericias: ["Ciências", "Intuição"],         poder: { titulo: "Aula de Campo",           desc: "Uma vez por cena, pode gastar uma ação padrão e 2 PE para fornecer +1 em um atributo de outro personagem em alcance curto até o fim da cena." } },
  "Religioso":              { pericias: ["Religião", "Vontade"],          poder: { titulo: "Acalentar",               desc: "Você recebe +5 em testes de Religião para acalmar; ao acalmar uma pessoa ela recebe 1d6 + sua Presença de Sanidade." } },
  "Revoltado":              { pericias: ["Furtividade", "Vontade"],       poder: { titulo: "Antes Só",                desc: "Recebe +1 na Defesa, em testes de perícia e no limite de PE por turno se estiver sem aliados em alcance curto." } },
  "Servidor Público":       { pericias: ["Intuição", "Vontade"],          poder: { titulo: "Espírito Cívico",         desc: "Sempre que faz um teste para ajudar, pode gastar 1 PE para aumentar o bônus concedido em +2." } },
  "Teórico da Conspiração": { pericias: ["Investigação", "Ocultismo"],    poder: { titulo: "Eu Já Sabia",             desc: "Você recebe resistência a dano mental igual ao seu Intelecto." } },
  "T.I.":                   { pericias: ["Investigação", "Tecnologia"],   poder: { titulo: "Motor de Busca",          desc: "Com acesso à internet, pode gastar 2 PE para substituir um teste de perícia por um teste de Tecnologia (a critério do mestre)." } },
  "Trabalhador Rural":      { pericias: ["Adestramento", "Sobrevivência"],poder: { titulo: "Desbravador",             desc: "Em testes de Adestramento ou Sobrevivência, pode gastar 2 PE para +5; não sofre penalidade de deslocamento por terreno difícil." } },
  "Trambiqueiro":           { pericias: ["Crime", "Enganação"],           poder: { titulo: "Impostor",                desc: "Uma vez por cena, pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação." } },
  "Universitário":          { pericias: ["Atualidades", "Investigação"],  poder: { titulo: "Dedicação",               desc: "Recebe +1 PE e mais 1 PE a cada NEX ímpar; seu limite de PE por turno aumenta em 1." } },
  "Vítima":                 { pericias: ["Reflexos", "Vontade"],          poder: { titulo: "Cicatrizes Psicológicas", desc: "Você recebe +1 de Sanidade para cada 5% de NEX." } },
}

export const CLASSE_LIST = Object.keys(CLASSES)
export const ORIGEM_LIST = Object.keys(ORIGENS)

/** Perícias concedidas automaticamente por classe + origem. */
export function periciasConcedidas(classe: string, origem: string): Set<string> {
  const fixas  = CLASSES[classe]?.periciasFixas ?? []
  const daOrig = ORIGENS[origem]?.pericias ?? []
  return new Set([...fixas, ...daOrig])
}
