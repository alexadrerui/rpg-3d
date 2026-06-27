// Catálogo de rituais de Ordem Paranormal — extraído do projeto C.R.I.S. (mirror estático).
// Fan content não-oficial; usado apenas como sistema de ficha.

export type RitualMelhoria = {
  tipo: string
  custo: string
  texto: string
}

export type Ritual = {
  nome: string
  circulo: 1 | 2 | 3 | 4
  elementos: string[]
  execucao: string
  alcance: string
  alvo: string
  area: string
  efeito: string
  duracao: string
  resistencia: string
  descricao: string
  melhorias: RitualMelhoria[]
}

export const RITUAIS: Ritual[] = [
  {
    "nome": "Amaldiçoar Arma",
    "circulo": 1,
    "elementos": [
      "Conhecimento",
      "Energia",
      "Morte",
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo ou pacote de munição",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o bônus de dano para +2d6. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o bônus de dano para +4d6. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Amaldiçoar Tecnologia",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 acessório ou arma de fogo",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você imbui o alvo com Energia, fazendo-o funcionar acima de sua capacidade. O item recebe uma modificação a sua escolha.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda para duas modificações. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda para três modificações. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Arma Atroz",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 arma corpo a corpo",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "",
    "descricao": "A arma é recoberta por veias carmesim e passa a exalar uma aura de violência. Ela fornece +2 em testes de ataque e +1 na margem de ameaça.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o bônus para +5 em testes de ataque. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o bônus para +5 em testes de ataque e +2 na margem de ameaça e no multiplicador de crítico. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Armadura de Sangue",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Seu sangue escorre para fora do corpo, cobrindo-o sob a forma de uma carapaça que fornece +5 em Defesa. Esse bônus é cumulativo com outros rituais, mas não com bônus fornecido por equipamento.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+5 PE",
        "texto": "muda o efeito para “fornece +10 na Defesa e resistência a balístico, corte, impacto e perfuração 5”. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "muda o efeito para “fornece +15 na Defesa e resistência a balístico, corte, impacto e perfuração 10”. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Cicatrização",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Você acelera o tempo ao redor das feridas do alvo, que cicatrizam instantaneamente. O alvo recupera 3d8+3 PV, mas envelhece 1 ano automaticamente.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "aumenta a cura para 5d8+5 PV. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "muda o alcance para “curto”, o alvo para “seres escolhidos” e aumenta a cura para 7d8+7 PV. Requer 4º círculo e afinidade com Morte."
      }
    ]
  },
  {
    "nome": "Cinerária",
    "circulo": 1,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "",
    "area": "nuvem de 6m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você manifesta uma névoa carregada de essência paranormal. Rituais conjurados dentro da névoa têm sua DT aumentada em +5.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "além do normal, rituais conjurados dentro da névoa custam –2 PE."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "além do normal, rituais conjurados dentro da névoa causam dano maximizado."
      }
    ]
  },
  {
    "nome": "Coincidência Forçada",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "curto Alvos: 1 ser",
    "alvo": "",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você manipula os caminhos do caos para que o alvo tenha mais sorte. O alvo recebe +2 em testes de perícias.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alvo para aliados à sua escolha. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alvo para aliados à sua escolha e o bônus para +5. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Compreensão Paranormal",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser ou objeto",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade anula",
    "descricao": "(veja texto) O ritual confere a você compreensão sobrenatural da linguagem. Se tocar um objeto contendo informação (ou livro, um dispositivo com uma gravação…), você entende as palavras mesmo que não conheça seu idioma, contanto que se trate de um idioma humano (não funciona com símbolos ou sigilos paranormais). Se tocar uma pessoa, pode se comunicar com ela como se falassem um idioma em comum. Se tocar um ser não inteligente, como um animal, pode perceber seus sentimentos básicos, como medo ou felicidade. Um alvo involuntário tem direito a um teste de Vontade.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alcance para “curto” e o alvo para “alvos escolhidos”. Você pode entender todos os alvos afetados. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alcance para “pessoal” e o alvo para “você”. Em vez do normal, você pode falar, entender e escrever qualquer idioma humano. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Consumir Manancial",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Você suga uma pequena porção do tempo de vida de plantas, insetos e até mesmo do solo ao redor, gerando Lodo e recebendo 3d6 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda os PV temporários recebidos para 6d6. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alvo para “área: esfera com 6m de raio centrada em você” e a resistência para “Fortitude reduz à metade”. Em vez do normal, você suga energia de todos os seres vivos na área, causando 3d6 pontos de dano de Morte em cada um e recebendo PV temporários iguais ao dano total causado até o final da cena. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Corpo Adaptado",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa ou animal",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Este ritual modifica a biologia do alvo para permitir a sobrevivência em ambientes hostis. O alvo fica imune a calor e frio extremos, pode respirar na água se respi rar ar (ou vice-versa) e não sufoca em fumaça densa.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a duração para 1 dia."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alcance para “curto” e o alvo para “pessoas ou animais escolhidos”."
      }
    ]
  },
  {
    "nome": "Decadência",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude reduz",
    "descricao": "à metade Espirais de trevas envolvem sua mão e definham o alvo, que sofre 2d8+2 pontos de dano de Morte.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a resistência para “nenhuma” e o dano para 3d8+3. Como parte da execução do ritual, você transfere as espirais para uma arma e faz um ataque corpo a corpo contra o alvo com esta arma. Se acertar, causa o dano da arma e do ritual, somados."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alcance para “pessoal” o alvo para “área: explosão com 6m de raio” e o dano para 8d8+8. As espirais afetam todos os seres na área. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Definhar",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Fortitude parcial",
    "descricao": "Você dispara uma lufada de cinzas que drena as forças do alvo. O alvo fica fatigado. Se passar no teste de resistência, em vez disso fica vulnerável.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "em vez do normal, o alvo fica exausto. Se passar na resistência, fica fatigado. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "como discente, mas muda o alvo para “até 5 seres”. Requer 3º círculo e afinidade com Morte."
      }
    ]
  },
  {
    "nome": "Distorcer Aparência",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade desacredita",
    "descricao": "Você modifica sua aparência de modo a parecer outra pessoa. Isso inclui altura, peso, tom de pele, cor de cabelo, timbre de voz, impressão digital, córnea etc. Você recebe +10 em testes de Enganação para disfarce, mas não recebe habilidades da nova forma nem modifica suas demais estatísticas.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alcance para “curto” e o alvo para “1 ser”. Um alvo involuntária pode anular o efeito com um teste de Vontade."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "como em Discente, mas muda o alvo para “seres escolhidos”. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Eletrocussão",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser ou objeto",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você manifesta e dispara uma corrente elétrica contra o alvo, que sofre 3d6 pontos de dano de eletricidade e fica vulnerável por uma rodada. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição. Se usado contra objetos eletrônicos, este ritual causa o dobro de dano e ignora resistência.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alvo para “área: linha de 30m”. Você dispara um poderoso raio que causa 6d6 pontos de dano de Energia em todos os seres e objetos livres na área. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda a área para “alvos escolhidos”. Em vez do normal, você dispara vários relâmpagos, um para cada alvo escolhido, causando 8d6 pontos de dano de Energia em cada. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Embaralhar",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você cria três cópias ilusórias suas, como hologramas extremamente realistas. As cópias ficam ao seu redor e imitam suas ações, tornando difícil para um inimigo saber quem é o verdadeiro. Você recebe +6 na Defesa. Cada vez que um ataque contra você erra, uma das imagens desaparece e o bônus na Defesa diminui em 2. Um oponente deve ver as cópias para ser confundido. Se você estiver invisível, ou o atacante fechar os olhos, você não recebe o bônus (mas o atacante sofre as penalidades normais por não enxergar).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o número de cópias para 5 (e o bônus na Defesa para +10). Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o número de cópias para 8 (e o bônus na Defesa para +16). Além do normal, toda vez que uma cópia é destruída, emite um clarão de luz. O ser que destruiu a cópia fica ofuscado por uma rodada. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Enfeitiçar",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade anula",
    "descricao": "Este ritual torna o alvo prestativo (veja a página 45). Ele não fica sob seu controle, mas percebe suas palavras e ações da maneira mais favorável possível. Você recebe um bônus de +10 em testes de Diplomacia com ele. Um alvo hostil ou que esteja envolvido em combate recebe +5 em seu teste de resistência. Se você ou seus aliados tomarem qualquer ação hostil contra o alvo, o efeito é dissipado e o alvo retorna à atitude que tinha antes (ou piorada, de acordo com o mestre).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "em vez do normal, você sugere uma ação para o alvo e ele obedece. A sugestão deve ser feita de modo que pareça aceitável, a critério do mestre. Pedir que o alvo atire em seu companheiro, por exemplo, dissipa o efeito. Já sugerir a um guarda que descanse um pouco, de modo que você e seus aliados passem por ele, é aceitável. Quando o alvo executa a ação, o efeito termina. Você pode determinar uma condição específica para a sugestão: por exemplo, que o policial prenda a próxima pessoa de casaco verde que ele encontrar. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "afeta todos os alvos dentro do alcance. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Espirais da Perdição",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Espirais surgem no corpo do alvo, tornando seus movimentos lentos. O alvo sofre –1d20 em testes de ataque.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a penalidade para –2d20. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+8 PE",
        "texto": "muda a penalidade para –2d20. e o alvo para “seres escolhidos”. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Fortalecimento Sensorial",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você potencializa seus sentidos, recebendo +1d20 em Investigação, Luta, Percepção e Pontaria.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "além do normal, seus inimigos sofrem –1d20 em testes de ataque contra você. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "além do normal, você apura seus sentidos para perceber perigo. Você fica imune às condições surpreendido e desprevenido e recebe +10 em Defesa e Reflexos. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Luz",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 objeto",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade anula",
    "descricao": "(veja texto) O alvo emite luz de cores alternadas e brilhantes (mas não produz calor) em uma área com 9m de raio. O objeto pode ser guardado (em um bolso, por exemplo) para interromper a luz, que voltará a funcionar caso o objeto seja revelado. Se o alvo for um objeto em posse de uma pessoa involuntária, ela tem direito a um teste de Vontade para anular o efeito.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alcance para longo e o efeito para 4 esferas brilhantes. Cria esferas flutuan tes de pura luz com 10cm de diâmetro, que você pode posicionar onde quiser dentro do alcance. Você pode enviar uma esfera à frente, outra para trás, outra para cima e manter uma perto de você, por exemplo. Uma vez por rodada, você pode mover as esferas com uma ação livre. Cada esfera ilumina uma área de 6m de raio, mas não produz calor. Se uma esfera ocupar o espaço de um ser, ele fica ofuscada e sua silhueta pode ser vista claramente (ela não recebe camuflagem por escuridão ou invisibilidade). Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "a luz é cálida como a do sol. Dentro da área seus aliados recebem +1d20 em testes de Vontade, e seus inimigos ficam ofuscados. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Nuvem de Cinzas",
    "circulo": 1,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "",
    "area": "",
    "efeito": "nuvem com 6m de raio e 6m de altura",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Uma nuvem de fuligem espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — seres a até 1,5m têm camuflagem e seres a partir de 3m têm camuflagem total. Um vento forte dispersa a nuvem em 4 rodadas e um vendaval a dispersa em 1 rodada. A nuvem não funciona sob a água.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "você pode escolher seres no alcance ao conjurar o ritual; eles enxergam através do efeito. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "além do normal, a nuvem fica espessa, quase sólida. Qualquer ser dentro dela tem seu deslocamento reduzido para 3m (independente de seu deslocamento normal) e sofre –2 em testes de ataque. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Ódio Incontrolável",
    "circulo": 1,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "O alvo entra em um frenesi, aumentando sua agressividade e capacidade de luta. Ele recebe +2 em testes de ataque e rolagens de dano corpo a corpo e resistência a balístico, corte, impacto e perfuração 5. Enquanto o efeito durar, o alvo não pode fazer nenhuma ação que exige calma e concentração (como usar a perícia Furtividade ou conjurar rituais), e deve sempre atacar um alvo em sua rodada, mesmo que seja um aliado se ele for o único a seu alcance.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "além do normal, sempre que o alvo usar a ação agredir, pode fazer um ataque corpo a corpo adicional contra o mesmo alvo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o bônus de ataque e dano para +5 e o alvo passa a sofrer apenas metade do dano dos tipos balístico, corte, impacto e perfuração. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Ouvir os Sussurros",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "O ritual conecta você com os sussurros, memórias ecoadas pelo Outro Lado, que você pode consultar para receber conhecimento proibido em relação a uma ação que tomará em breve. Ao usar este ritual, faça uma pergunta sobre um evento que você está prestes a fazer (na mesma cena) que possa ser respondida com “sim” ou “não”. O mestre rola 1d6 em segredo; com um resultado de 2 a 6, o ritual funciona e você recebe sua resposta, que pode ser “sim”, “não” ou “sim e não”. Com um resultado 1, o ritual falha e oferece o resultado “não”. Não há como saber se esse resultado foi dado porque o ritual falhou ou não. Lançar este ritual múltiplas vezes sobre o mesmo assunto gera sempre o primeiro resultado. Por exemplo, você está prestes a entrar em um prédio que pode ser o esconderijo de um cultista. Se você perguntar para os sussurros se o cultista está mesmo nesse local, a resposta pode ser “sim” (ele está no prédio), “não” (ele não está no prédio) ou “sim e não” (ele está no prédio, mas usou um ritual para se esconder seu corpo físico em uma dimensão do Outro Lado…). Isso é útil para saber se você deve (ou não) gastar recursos para um possível combate.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a execução para 1 minuto. Em vez do normal, você pode consultar os ecos fazendo uma pergunta sobre um evento que poderá acontecer até um dia no futuro. O mestre rola a chance de falha; com um resultado de 2 a 6, você recebe uma resposta, desde uma simples frase até uma profecia ou enigma. Em geral, este uso oferece pistas, indicando um caminho a tomar para descobrir a resposta que se procura. Numa falha você não recebe resposta alguma. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda a execução para 10 mi nutos e a duração para 5 rodadas. Em vez do normal, você consulta os ecos, podendo fazer uma pergun ta por rodada, desde que ela possa ser respondida com “sim”, “não” ou “ninguém sabe”. O mestre rola a chance de falha para cada pergunta. Em caso de falha, a resposta também é “ninguém sabe”. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Perturbação",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "1 rodada",
    "resistencia": "Vontade (anula)",
    "descricao": "Você dá uma ordem que o alvo deve ser capaz de ouvir (mas não precisa entender). Se falhar na resistência, ele deve obedecer à ordem em seu próprio turno da melhor maneira possível. Escolha um dos efeitos. Fuja: O alvo gasta seu turno tentando se afastar de você (usando todas as suas ações). Largue: O alvo solta quaisquer itens que esteja segurando e não pode pegá-los de volta até o início de seu próximo turno. Como esta é uma ação livre, ele ainda pode executar outras ações (exceto pegar aquilo que largou). Pare: O alvo fica pasmo (não pode realizar ações, só reações). Sente-se: Com uma ação livre, o alvo se senta no chão (se estava pendurado ou voando, desce até o chão). Ele pode fazer outras ações, mas não se levantar até o início de seu próximo turno. Venha: O alvo gasta seu turno se aproximando de você (usando todas as suas ações).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o alvo para “1 ser” e adiciona o seguinte comando: “Sofra. O alvo é acometido de dor aguda. Ele sofre 3d8 pontos de dano de Conhecimento e fica abalado por uma rodada”."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alvo para “até 5 seres” ou adiciona o seguinte comando: “Ataque. O alvo deve fazer a ação agredir contra um outro alvo a sua escolha em alcance médio, com todas as suas capacidades”. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Polarização Caótica",
    "circulo": 1,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Vontade anula",
    "descricao": "Você gera uma aura magnética sobrenatural. Escolha um dos efeitos a seguir. Atrair: você pode usar uma ação de movimento para puxar um objeto metálico de espaço 2 ou menor dentro do alcance. Se o objeto estiver livre, voa para suas mãos (caso tenha mãos livres para apanhá-lo) ou para seus pés. Repelir: você repele objetos de espaço 2 ou menor (o que envolve quase todos os projéteis e armas de arremesso), recebendo resistência a balístico, corte, impacto e perfuração 5.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "nesta versão a energia magnética é expelida de uma única vez e arremessa até 10 objetos, ou um total de 10 espaços, o que for menor. Os objetos devem estar a até 3m uns dos outros. Objetos arremessados podem atingir seres em seu caminho, causando de 1 ponto de dano de impacto por espaço (objetos macios, sem pontas ou sem fio) até 1d6 pontos de dano por espaço (objetos duros, pontudos ou afiados). Seres atingidos têm direito a um teste de Reflexos para reduzir o dano à metade. Seres dentro da capacidade de carga do efeito podem ser arremessados, mas têm direito a um teste de Vontade para evitar o efeito (em si mesmos ou em objetos que estejam segurando). Um ser arremessado contra uma superfície sólida sofre 1d6 pontos de dano de impacto para cada 3m que “voou” no deslocamento (incluindo outros seres; nesse caso, ambos sofrem o dano)."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alcance para médio. Você pode usar uma ação de movimento para fazer com que a força magnética levite e mova um ser ou objeto de espaço 10 ou menor por até 9m em qualquer direção dentro do alcance. Um ser pode anular o efeito sobre ele, ou sobre um objeto que possua, passando num teste de Vontade. O alvo cai no chão se sair do alcance ou o efeito terminar."
      }
    ]
  },
  {
    "nome": "Tecer Ilusão",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "",
    "efeito": "ilusão que se estende a até 4 cubos de 1,5m",
    "duracao": "cena",
    "resistencia": "Vontade desacredita",
    "descricao": "Este ritual cria uma ilusão visual (uma pessoa, uma parede…) ou sonora (um grito de socorro, um uivo assustador…). O ritual cria apenas imagens ou sons simples, com volume equivalente à voz de uma pessoa para cada cubo de 1,5m no efeito. Não é possível criar cheiros, texturas ou temperaturas, nem sons complexos, como uma música ou diálogo. Seres e objetos atravessam uma ilusão sem sofrer dano, mas o ritual pode, por exemplo, esconder uma armadilha ou emboscada. A ilusão é dissipada se você sair do alcance.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda o efeito para até 8 cubos de 1,5m e a duração para sustentada. Você pode criar ilusões de imagem e som combinados, e pode criar sons complexos, odores e sensações térmicas. Também pode criar sensações táteis, como texturas; objetos ainda atravessam a ilusão, mas seres não conseguem atravessá-la sem passar em um teste de Vontade. A cada rodada, você pode usar uma ação livre para mover a imagem ou alterar o som, como aumentar o volume ou fazer com que pareça se afastar ou se aproximar, ainda dentro dos limites do efeito. Você pode, por exemplo, criar a ilusão de um fantasma que anda pela sala, controlando seus movimentos. A ilusão ainda é incapaz de causar ou sofrer dano. Quando você para de sustentar o ritual, a imagem ou som persiste por mais uma rodada antes do ritual se dissipar. Requer 2º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+ 5 PE",
        "texto": "você cria a ilusão de um perigo mortal. Quando o ritual é conjurado, e no início de cada um de seus turnos, um alvo interagindo com a ilusão deve fazer um teste de Vontade; se falhar, acredita que a ilusão é real e sofre 6d6 pontos de dano de Conhecimento. O alvo racionaliza o efeito sempre que falha no teste (por exemplo, acredita que o mesmo teto pode cair sobre ele várias vezes). Se um alvo passar em dois testes de Vontade seguidos, o efeito é anulado para ele. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Terceiro Olho",
    "circulo": 1,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Seus olhos se enchem de sigilos e você passa a enxergar auras paranormais em alcance longo. Rituais, itens amaldiçoados e criaturas emitem auras. Você sabe o elemento da aura e seu poder aproximado — rituais de 1º círculo e criaturas de VD até 80 emitem uma aura fraca; rituais de 2º e 3º círculos e criaturas de VD entre 81 e 280 emitem uma aura moderada, e rituais de 4º círculo e criaturas de VD 281 ou maior emitem uma aura poderosa. Além disso, você pode gastar uma ação de movimento para descobrir se um ser que possa ver em alcance médio tem poderes paranormais ou se é capaz de conjurar rituais e de quais elementos.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a duração para 1 dia."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "também pode enxergar objetos e seres invisíveis, que aparecem como formas translúcidas."
      }
    ]
  },
  {
    "nome": "Aprimorar Físico",
    "circulo": 2,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "O alvo tem seus músculos tonificados e seus ligamentos reforçados, recebendo +1 em Agilidade ou Força, à escolha dele.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o bônus para +2. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o bônus para +3. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Aprimorar Mente",
    "circulo": 2,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "O alvo tem sua mente energizada por fagulhos do Conhecimento. Ele recebe +1 em Intelecto ou Presença, à escolha dele (esse aumento não fornece PE ou perícias treinadas).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o bônus para +2. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o bônus para +3. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Chamas do Caos",
    "circulo": 2,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "veja texto",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você manipula o calor e o fogo. Ao conjurar o ritual, escolha um dos seguintes efeitos. Chamejar: o alvo é uma arma corpo a corpo. Ela causa +1d6 pontos de dano de fogo. Esquentar: o alvo é um objeto, que começa a esquentar. Ele sofre 1d6 pontos de dano de fogo por rodada e causa o mesmo dano a qualquer ser que o esteja empunhando ou vestindo. A critério do mestre, o objeto ou o ser pode pegar fogo. Um ser pode gastar uma ação completa para resfriar o objeto (jogando areia ou jogando-o numa fonte de água próxima, por exemplo) e cancelar o efeito do ritual. Extinguir: o alvo é uma chama de tamanho Grande ou menor, que é apagada. Isso cria uma nuvem de fumaça que ocupa uma esfera de 3m de raio centrada onde estava a chama. Dentro da fumaça, seres têm camuflagem. Modelar: o alvo é uma chama de tamanho Grande ou menor. A cada rodada, você pode gastar uma ação livre para movimentá-la 9m em qualquer direção. Se atravessar o espaço ocupado por um ser, ela causa 3d6 pontos de dano de fogo nele. Um ser só pode sofrer dano dessa maneira uma vez por rodada.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda a duração para sustentada e adiciona “Resistência: Reflexos reduz à metade”. Em vez do normal, uma vez por rodada você pode gastar uma ação de movimento para projetar uma labareda, num alvo em alcance curto. O alvo sofre 4d6 pontos de dano de Energia (Reflexos reduz à metade)."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+ 7 PE",
        "texto": "como discente, mas muda o dano para 8d6. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Contenção Fantasmagórica",
    "circulo": 2,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Reflexos anula",
    "descricao": "Três laços de Energia surgem do chão e se enroscam no alvo, deixando-o agarrado. O alvo pode tentar se livrar, gastando uma ação padrão para fazer um teste de Atletismo (DT do ritual). Se passar, destrói um laço, mais um laço adicional para cada 5 pontos pelos quais superou a DT. Os laços também podem ser atacados e destruídos: cada um tem Defesa 10, 10 PV, RD 5 e imunidade a Energia. Se todos os laços forem destruídos, o ritual é dissipado. Por serem feitos de Energia, os laços afetam criaturas incorpóreas.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "aumenta o número de laços para 6, e você pode escolher o alvo de cada laço, com um mínimo de dois laços por alvo. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "como discente, e cada laço destruído libera uma onda de choque que causa 2d6+2 pontos de dano de Energia no alvo agarrado. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Desacelerar Impacto",
    "circulo": 2,
    "elementos": [
      "Morte"
    ],
    "execucao": "reação",
    "alcance": "curto Alvos: 1 ser ou objetos somando até 10 espaços",
    "alvo": "",
    "area": "",
    "efeito": "",
    "duracao": "até chegar ao solo ou",
    "resistencia": "",
    "descricao": "cena, o que vier primeiro O alvo cai lentamente. A velocidade da queda é reduzida para 18m por rodada — o suficiente para não causar dano. Como conjurar este ritual é uma reação, você pode conjurá-lo rápido o bastante para salvar a si ou um aliado de quedas inesperadas. Se o alvo for um projétil — como um disparo de arma ou um objeto largado do alto de um prédio —, o ritual faz com que ele cause metade do dano normal, devido à lentidão. Este ritual só funciona em alvos em queda livre ou similar; não pode frear um golpe de faca ou o mergulho rasante de um atacante voador.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "aumenta o total de alvos para seres ou objetos somando até 100 espaços."
      }
    ]
  },
  {
    "nome": "Descarnar",
    "circulo": 2,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque Alvos: 1 ser",
    "alvo": "",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Este ritual cruel faz com que lacerações se manifestem na pele e órgãos do alvo, que sofre 6d8 pontos de dano (metade corte, metade Sangue) e fica com uma hemorragia severa. No início de cada turno dele, o alvo deve fazer um teste de Fortitude. Se falhar, sofre 2d8 pontos de dano de Sangue. Se passar nesse teste dois turnos seguidos, a hemorragia é estancada. Alvos que passem no teste de resistência inicial sofrem metade do dano e não ficam com hemorragia.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o dano direto para 10d8 e o dano da hemorragia para 4d8. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o alvo para você e a du ração para sustentada. Enquanto o ritual durar, seus ataques corpo a corpo causam 4d8 pontos de dano de Sangue adicional e deixam o alvo com hemorragia automaticamente (como no efeito básico do ritual). O alvo ainda tem direito a um teste de Fortitude no início de seus turnos. Requer 3º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Detecção de Ameaças",
    "circulo": 2,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "",
    "area": "esfera de 18m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você recebe uma percepção aguçada sobre perigos à sua volta. Quando um ser hostil ou armadilha entra na área do efeito, você tem uma sensação de perigo e pode gastar uma ação de movimento para fazer um teste de Percepção (DT 20). Se passar, sabe a direção e distância do perigo.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "além do normal, você não fica desprevenido contra perigos detectados e recebe +5 em testes de resistência contra armadilhas. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda a duração para “1 dia” e concede os mesmos benefícios de discente. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Dissonância Acústica",
    "circulo": 2,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "esfera com 6m de raio",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "",
    "descricao": "Você manipula a vibração do ar, criando uma área de dissonância sonora. Enquanto estiverem na área, todos os seres ficam surdos. Essa dissonância impede que seres dentro da área conjurem rituais.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+1 PE",
        "texto": "muda a área para “alvo: 1 objeto”. Em vez do normal, o alvo emana uma área de silêncio com 3m de raio. Se conjurar o ritual num objeto de um ser involuntário, ele tem direito a um teste de Vontade para anulá-lo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+3 PE",
        "texto": "muda a duração para cena. Em vez do normal, nenhum som pode deixar a área, mas seres dentro da área podem falar, ouvir e conjurar rituais normalmente. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Eco Espiral",
    "circulo": 2,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "2 rodadas",
    "resistencia": "Fortitude reduz",
    "descricao": "à metade Você manifesta em suas mãos uma pequena cópia do alvo feita de cinzas. No início do próximo turno após conjurar este ritual, você precisa gastar uma ação padrão para se concentrar nele; caso contrário, ele se dissipa sem efeito. No início do segundo turno, você precisa gastar uma ação padrão para descarregá-lo. Se fizer isso, a cópia explode e o alvo sofre dano de Morte igual a quantidade de dano que sofreu na rodada em que você se concentrou (Fortitude reduz à metade). Se não fizer, o ritual se dissipa sem efeito.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o alvo para “até 5 seres”."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda a duração para “até 3 rodadas”, permitindo que você se concentre nas duas primeiras e descarregue na terceira. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Esconder dos Olhos",
    "circulo": 2,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "livre",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "1 rodada",
    "resistencia": "",
    "descricao": "Você fica invisível, incluindo seu equipamento, recebendo camuflagem total e +15 em testes de Furtividade. Como o normal, seres que não possam vê-lo ficam desprevenidos contra seus ataques. O efeito termina se você faz um ataque ou usa uma habilidade hostil. Ações contra objetos livres não dissipam Esconder dos Olhos (você pode tocar ou apanhar objetos que não estejam sendo segurados por outros seres). Causar dano indiretamente — por exemplo, prepar explosivos para detonar mais tarde — não é considerado um ataque. Objetos soltos voltam a ser visíveis e objetos apanhados por você ficam invisíveis. Luz transportada nunca fica invisível (mesmo que sua fonte esteja). Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda a duração para “sustentada”. Em vez do normal, você gera uma esfera de invisibilidade. Você e todos os aliados a até 3m de você se tornam invisíveis, como no efeito normal do ritual (ainda ficam visíveis caso façam uma ação hostil). A esfera se move junto com você; qualquer coisa que saia da esfera fica visível. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda a execução para “ação padrão”, o alcance para “toque”, o alvo para “1 ser” e a duração para “sustentada”. O efeito não é dissipado caso o alvo faça um ataque ou ação hostil. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Flagelo de Sangue",
    "circulo": 2,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Fortitude parcial",
    "descricao": "Você toca uma pessoa, gravando uma marca escarificada no corpo dela enquanto profere uma ordem, como “não ataque a mim ou meus aliados”, “siga-me” ou “não saia desta sala”. A cada rodada que o alvo desobedecer a ordem, a marca inflige uma dor excruciante, que causa 10d6 pontos de dano de Sangue e deixa o alvo enjoado pela rodada (Fortitude reduz o dano à metade e evita a condição). Se o alvo passar nesse teste dois turnos seguidos a marca desaparece.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o alvo para “1 ser (exceto criaturas de Sangue)”. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "como Discente, e muda a duração para “1 dia”. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Hemofagia",
    "circulo": 2,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude reduz",
    "descricao": "à metade Você arranca o sangue do corpo do alvo através da pele dele, causando 6d6 pontos de dano de Sangue. Você então absorve esse sangue, recuperando pontos de vida iguais à metade do dano causado.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda a resistência para “nenhuma”. Como parte da execução do ritual, você faz um ataque corpo a corpo contra o alvo. Se acertar, causa o dano do ataque e do ritual, recuperando PV em quantidade igual à metade do dano total causado."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o alcance para “pessoal”, o alvo para “você” e a duração para “cena”. Em vez do normal, a cada rodada você pode gastar uma ação padrão para tocar 1 ser e causar 4d6 pontos de dano de Sangue. Você recupera PV iguais à metade do dano causado. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Invadir Mente",
    "circulo": 2,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "médio ou toque",
    "alvo": "1 ser ou 2 pessoas voluntárias",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Vontade parcial ou",
    "descricao": "ou 1 dia nenhuma Quando conjura este ritual, você gera um dos efeitos a seguir, a sua escolha: rajada mental (usa os primeiros parâmetros do cabeçalho acima) ou ligação telepática (usa os segundos parâmetros). Rajada Mental: você infecta a mente do alvo com o Conhecimento proibido do Outro Lado, dilacerando o cérebro dele. O alvo sofre 6d6 pontos de dano de Conhecimento e fica atordoado por uma rodada. Se passar no teste de Vontade, sofre metade do dano e não fica atordoado. Um mesmo alvo só pode ficar atordoado por este ritual uma vez por cena. Ligação Telepática: você cria um elo mental entre duas pessoas (você pode ser uma delas), que podem se comunicar independente da distância pela duração do ritual (1 dia).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "se escolhar rajada mental, aumenta o dano para 10d6. Se escolher ligação telepática, em vez do normal, você cria um elo mental que permite que você gaste uma ação de movimento para ver e ouvir pelos sentidos do alvo. Um alvo involuntário pode fazer um teste de Vontade para suprimir o ritual por uma hora. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "se escolher rajada mental, aumenta o dano para 10d6 e muda o alvo para “seres escolhidos”. Se escolher ligação telepática, você pode criar um vínculo mental entre até 5 pessoas. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Localização",
    "circulo": 2,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "",
    "area": "círculo com 90m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Este ritual pode encontrar uma pessoa ou objeto a sua escolha. Você pode pensar em termos gerais (“um policial”, “algo de metal”) ou específicos (“A delegada Joana”, “uma pistola”). O ritual indica a direção e distância da pessoa ou objeto mais próxi mo desse tipo, caso esteja ao alcance. Você pode movimentar-se para continuar procurando. Procurar algo muito específico (“a chave do armazém 4 no porto”) exige que você tenha em mente uma imagem precisa do objeto; caso a imagem não seja parecida com a verdade, o ritual falha, mas você gasta os PE mesmo assim. Este ritual pode ser bloqueado por uma fina camada de chumbo.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o alcance para “toque”, o alvo para “1 pessoa” e a duração para “1 hora”. Em vez do normal, a pessoa tocada descobre o caminho mais direto para entrar ou sair de um lugar. Assim, o ritual pode ser usado para descobrir a rota até o relicário de uma catedral ou a saída mais próxima de uma caverna (mas não para encontrar a localização de uma pessoa ou objeto; funciona apenas em relação a lugares). Caso a pessoa demore mais de uma hora para percorrer o caminho, o conhecimento se perde."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "aumenta a área para círculo de 1km de raio. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Miasma Entrópico",
    "circulo": 2,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "nuvem com 6m de raio",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "(veja texto) Cria uma explosão de emanações tóxicas. Seres na área sofrem 4d8 pontos de dano químico e ficam enjoados por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoados.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o dano para 6d8 de Morte."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda a duração para 3 rodadas. Um ser que inicie seu turno dentro da área sofre o dano novamente. Requer 3º círculo."
      }
    ]
  },
  {
    "nome": "Paradoxo",
    "circulo": 2,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "esfera com 6m de raio",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude reduz",
    "descricao": "à metade O ritual cria uma poderosa implosão de distorção temporal contraditória, causando 6d6 pontos de dano de Morte em todos os seres na área.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda a área para “efeito: esfera com tamanho Médio” e a duração para cena. Em vez do normal, cria uma esfera de emanações espirais sibilantes com 1,5m de diâmetro que causa 4d6 pontos de dano de Morte a qualquer ser no mesmo espaço. Você pode gastar uma ação de movimento para fazer a esfera voar 9m em qualquer direção. Um ser só pode sofrer dano da esfera uma vez por rodada."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o dano para 13d6. Seres reduzidos a 0 PV pelo dano do Paradoxo devem fazer um teste de Fortitude. Se falharem, são reduzidos a cinzas (morrem imediatamente). Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Proteção contra Rituais",
    "circulo": 2,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você canaliza uma aura de Medo puro, que protege o alvo contra efeitos paranormais. O alvo recebe resistência a dano paranormal 5 e +5 em testes de resistência contra rituais e habilidades de criaturas paranormais.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda o alvo para “até 5 seres tocados”. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+6 PE",
        "texto": "muda o alvo para “até 5 seres tocados”, a resistência a dano para 10 e o bônus em testes de resistência para +10. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Rejeitar Névoa",
    "circulo": 2,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "",
    "area": "nuvem de 6m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você manifesta um leve redemoinho de névoa que se movimenta suavemente dentro da área. Rituais conjurados dentro da área têm seu custo aumentado em +2 PE por círculo e sua execução aumentada em um passo (de livre para movimento, de movimento para padrão, de padrão para completa, de completa para duas rodadas). Rejeitar a Névoa anula os efeitos de Cinerária, a menos que o conjurador de Cinerária use uma ação completa por rodada para manter o ritual ativo, neutralizando o efeito dos dois rituais.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "além do normal, a DT de testes de resistência contra rituais realizados na área diminui em –5."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+ 5 PE",
        "texto": "como discente, e o dano causado dentro da névoa por rituais é sempre mínimo."
      }
    ]
  },
  {
    "nome": "Sopro do Caos",
    "circulo": 2,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "varia",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "veja texto",
    "descricao": "Você altera os movimentos de massas de ar de forma caótica. Ao conjurar o ritual, escolha um dos efeitos abaixo. Ascender: cria uma corrente de ar ascendente capaz de erguer do chão um ser ou objeto Médio, fazendo o alvo ﬂutuar para cima e para baixo conforme sua vontade. Você pode gastar uma ação de movimento para subir ou descer o alvo até 6m por rodada, até um máximo de 30m de altura. Você não pode mover o alvo horizontalmente — mas o alvo pode, por exemplo, escalar uma colina ou se apoiar no teto para mover-se para os lados (com metade de seu deslocamento normal). Um ser levitando fica vulnerável. Alvos involuntários têm direito a um teste de Fortitude no início de cada um de seus turnos para encerrar o efeito. Derrubar um alvo flutuando (simplesmente parando a corrente de ar) causa o dano normal de queda, mas um alvo que passe no teste pode “nadar” para o chão contra a corrente. Você pode usar essa opção para fazer uma manobra derrubar contra um alvo voador dentro do alcance, usando Ocultismo em vez de Luta. Sopro: cria uma lufada de vento a partir de suas mãos, que empurra qualquer alvo Médio ou menor, em um cone de 4,5m — faça uma manobra empurrar usando Ocultismo em vez de Luta, usando uma mesma rolagem sua para todos os alvos. A lufada de vento também faz qualquer coisa que um vento forte e súbito faria, como levantar pó, dispersar vapores, apagar chamas, espalhar papéis ou mover uma embarcação. Manter o sopro ativo exige uma ação padrão no seu turno. Vento: cria uma área de vento forte (página 291) dentro do alcance. Se conjurada numa área que já esteja com algum efeito de vento, aumenta esse efeito em um passo. Manter o vento ativo requer uma ação de movimento. Você também pode usar essa opção para reduzir os efeitos de vento em uma área.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "passa a afetar alvos Grandes."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "passa a afetar alvos Enormes."
      }
    ]
  },
  {
    "nome": "Tela de Ruído",
    "circulo": 2,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Este ritual cria uma película de energia que recobre seu corpo e absorve energia cinética. Você recebe 30 PV temporários, mas apenas contra dano balístico, de corte, de impacto ou de perfuração. Alternativamente, você pode conjurar este ritual como uma reação quando sofrer dano, recebendo resistência 15 apenas contra esse dano.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "aumenta os PV temporário para 60 e a resistência para 30."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o alcance para curto e o alvo para 1 ser ou objeto Enorme ou menor. Em vez do normal, cria uma esfera imóvel e tremeluzente com o tamanho do alvo e centrada nele. Nenhum ser, objeto ou efeito de dano pode passar pela esfera, embora seres possam respirar normalmente dentro dela. O alvo tem direito a um teste de Reflexos para evitar ser aprisionado. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Transfusão Vital",
    "circulo": 2,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Você toca no alvo e transfere sua própria energia vital para ele, podendo sofrer até 30 pontos de dano de Sangue para que o alvo recupere a mesma quantidade em PV. Você não pode ficar com menos de 1 PV por causa desse ritual.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "Você pode transferir até 50 pontos de vida. Requer 3º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "Você pode transferir até 100 pontos de vida. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Velocidade Mortal",
    "circulo": 2,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "",
    "descricao": "Você distorce a passagem do tempo ao redor do alvo, tornando-o extremamente veloz. O alvo pode realizar uma ação de movimento adicional por turno. Esta ação não pode ser usada para conjurar rituais.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "em vez de uma ação de movimento, o alvo recebe uma ação padrão adicional por turno."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "muda o alvo para “alvos es colhidos”. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Alterar Memória",
    "circulo": 3,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Vontade anula",
    "descricao": "Você invade a mente do alvo e altera ou apaga suas memórias de até uma hora atrás. Se escolher alterar as memórias, você pode mudar detalhes de eventos recentes, como a identidade de alguém encontrado ou o endereço de um lugar visitado, mas não reescrever completamente esses eventos. O alvo recupera suas memórias após 1d4 dias.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "você pode alterar ou apagar memórias de até 24 horas atrás. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Âncora Temporal",
    "circulo": 3,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Uma aura espiralada surge sobre o alvo. No início de cada turno dele, ele deve fazer um teste de Vontade. Se falhar, não poderá se deslocar naquele turno (ele ainda pode agir, só não pode se deslocar). Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "muda o alvo para “seres a sua escolha”. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Contato Paranormal",
    "circulo": 3,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "1 dia",
    "resistencia": "",
    "descricao": "Você barganha com a entidade de Conhecimento para que o auxilie durante o dia, em troca de se alimentar de sua Sanidade. Quando o ritual é conjurado, você recebe seis d6. Sempre que fizer um teste de perícia, você pode gastar um desses d6, rolá-lo e adicionar o resultado no teste. No entanto, essa ajuda tem um preço: sempre que rolar um 6 no dado, a entidade toma 2 pontos de Sanidade de você. Se você ficar sem dados ou chegar a Sanidade 0, o ritual acaba.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+4 PE",
        "texto": "muda os dados de auxílio para d8. Sempre que rolar um 8 num desses dados, a entidade toma 3 pontos de sua Sanidade. Requer 4º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "muda os dados de auxílio para d12. Sempre que rolar um 12 num desses dados, a entidade toma 5 pontos de sua Sanidade. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Convocação Instantânea",
    "circulo": 3,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "ilimitado",
    "alvo": "1 objeto de até 2 espaços",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Vontade anula",
    "descricao": "Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com o símbolo do ritual e pode ocupar no máximo 2 espaços. Se o objeto estiver sendo empunhado por outra pessoa, ela pode fazer um teste de Vontade para negar o efeito, mas você saberá onde o objeto está e quem o está carregando (ou sua aparência, caso não conheça a pessoa). Por até 1h depois da convocação, você pode gastar uma ação de movimento para enviar o objeto de volta para o local em que ele estava antes.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+4 PE",
        "texto": "muda o alvo para um objeto de até 10 espaços."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "muda o alvo para “1 recipiente Médio (como uma mala ou caixote), com itens que somem até 10 espaços” e a duração para “permanente”. Em vez do normal, você encanta o recipiente para mantê-lo escondido no Outro Lado. Você pode convocar o recipiente para um espaço livre adjacente, ou de volta para o esconderijo paranormal, com uma ação padrão. Para isso, você deve ter em mãos uma miniatura do objeto, que funciona como um utensílio de categoria II. Quando conjura esta versão do ritual, você perde 1 PE permanentemente."
      }
    ]
  },
  {
    "nome": "Dissipar Ritual",
    "circulo": 3,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "médio Alvo ou Área: 1 ser ou objeto, ou esfera com 3m de raio",
    "alvo": "",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Você dissipa rituais ativos, como se a duração deles tivesse acabado. Efeitos de rituais instantâneos não podem ser dissipados (não se pode dissipar uma área de Paradoxo depois que já causou dano…). Faça um teste de Ocultismo; você anula quaisquer rituais ativos no alvo ou na área com DT igual ou menor que o resultado do teste. Você pode conjurar esse ritual em um item amaldiçoado para que se torne um item mundano (perdendo seus poderes) por um dia. Se o item estiver em posse de alguém, seu usuário pode fazer um teste de Vontade para negar o efeito.",
    "melhorias": []
  },
  {
    "nome": "Ferver Sangue",
    "circulo": 3,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Fortitude parcial",
    "descricao": "O sangue do alvo aquece até entrar em ebulição. Quando o ritual é conjurado, e no início de cada turno do alvo, ele deve fazer um teste de Fortitude. Se falhar, sofre 4d8 pontos de dano de Sangue e fica fraco; se passar, sofre metade do dano e não fica fraco nesta rodada. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Forma Monstruosa",
    "circulo": 3,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Seu corpo se transforma, assumindo uma forma que combina suas características com as de uma criatura de Sangue; suas roupas e proteção se mesclam à sua carne, transformando-se em uma couraça, e quaisquer objetos em suas mãos se fundem aos seus braços, transformando-se em garras pontiagudas. Seu equipamento fica inacessível, mas seus bônus se mantém. Seu tamanho muda para Grande e você recebe +5 em testes de ataque e rolagens de dano corpo a corpo e 30 PV temporários. Enquanto estiver transformado, sua mente é tomada por fúria selvagem; você não pode falar nem conjurar rituais e a cada rodada deve atacar o ser mais próximo possível. Se não houver um ser que possa atacar, deve se deslocar em direção ao ser mais próximo da melhor forma possível. Se o ser mais próximo for um aliado, você pode fazer um teste de Vontade (DT do ritual). Se passar, neste turno você pode escolher qual ser atacar.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "além do normal, você recebe imunidade a atordoamento, fadiga, sangramento, sono e veneno."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+9 PE",
        "texto": "muda os bônus em testes de ataque e rolagens de dano para +10 e os PV temporários para 50. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Mergulho Mental",
    "circulo": 3,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Vontade parcial",
    "descricao": "(veja texto) Você mergulha nos pensamentos do alvo para descobrir informações sobre ele. Durante o mergulho, você fica desprevenido. No início de cada turno seu que estiver sustentando o efeito e tocando o alvo, ele deve fazer um teste de Vontade. Se falhar, deve responder uma pergunta sua que possa ser respondida com “sim” ou “não”, sendo incapaz de mentir. O que você descobre depende das suas perguntas e do mestre: talvez você não descubra tudo que há para saber, mas pode ganhar pistas para continuar a investigação.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "muda a execução para 1 dia, o alcance para ilimitado e adiciona como componente ritualístico uma cuba de ouro cheia d’água e uma máscara (acessório de categoria II). Você pode realizar o mergulho mental à distância, submergindo seu rosto mascarado na água enquanto mentaliza o alvo. Para que esse ritual funcione, você precisa ter alguma informação sobre o alvo, como nome completo, e um objeto pessoal ou fotografia. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Poeira da Podridão",
    "circulo": 3,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "nuvem com 6m de raio",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Fortitude (veja texto)",
    "descricao": "Você manifesta uma nuvem de poeira que apodrece os seres na área. Ao conjurar o ritual, e no início de cada um de seus turnos, seres e objetos na área sofrem 4d8 pontos de dano de Morte (Fortitude reduz à metade). Alvos que falharem no teste também não podem recuperar PV de nenhuma forma por uma rodada.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "muda o dano para 4d8+16."
      }
    ]
  },
  {
    "nome": "Purgatório",
    "circulo": 3,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "área de 6m de raio",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Fortitude parcial",
    "descricao": "Você faz brotar uma poça de sangue pegajoso na área afetada. Inimigos na área se tornam vulneráveis a dano balístico, de corte, de impacto e de perfuração. Um alvo que tente sair da área é acometido de uma dor terrível; sofre 6d6 pontos de dano de Sangue e deve fazer um teste de Fortitude. Se passar, consegue sair. Se falhar, a dor faz com que não consiga se mover e perca a ação de movimento.",
    "melhorias": []
  },
  {
    "nome": "Salto Fantasma",
    "circulo": 3,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Seu corpo se transforma momentaneamente em Energia pura e viaja até outro ponto. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo apenas imaginá-lo, desde que já tenha observado o local de alguma forma (em pessoa, por fotografia, por vídeo…). Por exemplo, pode se transportar 3m adiante para ultrapassar uma porta fechada. Uma vez transportado, você não pode agir pelo resto do seu turno. Este ritual não permite que você apareça dentro de um corpo sólido; se o ponto de chegada não tem espaço livre, você ressurge na área vazia mais próxima.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "muda a execução para reação. Em vez do normal, você salta para um espaço adjacente (1,5m), recebendo +10 na Defesa e em testes de Reflexos contra um ataque ou efeito que esteja prestes a atingi-lo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+4 PE",
        "texto": "muda o alcance para longo e o alvo para você e até dois outros seres voluntários que você esteja tocando."
      }
    ]
  },
  {
    "nome": "Tentáculos de Lodo",
    "circulo": 3,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "círculo com 6m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Uma fenda sombria se abre no chão, de onde surgem tentáculos feitos de Lodo da Morte. Ao conjurar o ritual e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando Ocultismo em vez de Luta) contra cada alvo na área. Se você vencer, o ser é agarrado; se já estava agarrado, é esmagado, sofrendo 4d6 pontos de dano (metade impacto, metade Morte). A área do ritual conta como terreno difícil. Os tentáculos são imunes a dano.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "aumenta o raio da área para 9m e aumenta o dano dos tentáculos para 6d6."
      }
    ]
  },
  {
    "nome": "Transfigurar Água",
    "circulo": 3,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "longo",
    "alvo": "",
    "area": "esfera com 30m de raio",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "veja texto",
    "descricao": "Você canaliza Energia sobre um corpo de água, para que ele adquira movimentos e comportamentos paranormais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos. Congelar: toda a água mundana na área é congelada. Seres nadando na área ficam imóveis; escapar exige gastar uma ação padrão e passar num teste de Atletismo (DT igual a do ritual). Derreter: gelo mundano na área vira água e o ritual termina. A critério do mestre, isso pode criar terreno difícil. Enchente: eleva o nível da água mundana na área em até 4,5m. A sua escolha, muda área para “alvo: uma embarcação”. O alvo recebe +6m em seu deslocamento pela duração do efeito. Evaporar: toda a água e gelo mundano na área evaporam instantaneamente e o ritual termina. Qualquer ser vivo na área sofre 5d8 de dano de Energia (Fortitude reduz à metade). Criaturas de Morte sofrem o dobro desse dano. Partir: diminui o nível de toda água mundana na área em até 4,5m. Em um corpo d’água raso, isso abre um caminho seco, que pode ser atravessado a pé. Em um corpo d’água profundo, cria um redemoinho que pode prender barcos (um teste de Pilotagem com DT igual à do ritual permite ao piloto livrar a embarcação).",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "aumenta o deslocamento de enchente para +12m e o dano de evaporar para 10d8."
      }
    ]
  },
  {
    "nome": "Transfigurar Terra",
    "circulo": 3,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "longo",
    "alvo": "",
    "area": "9 cubos com 1,5m de lado",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "veja texto",
    "descricao": "Você imbui terra, pedra, lama, argila ou areia na área com Energia, gerando efeitos sobrenaturais e caóticos. Ao conjurar o ritual, escolha um dos seguintes efeitos. Amolecer: se afetar o teto, uma coluna ou suporte, provoca um desabamento que causa 10d6 pontos de dano de impacto aos seres na área (Reflexos reduz à metade). Se afetar um piso de terra ou pedra, cria terreno difícil de areia ou argila, respectivamente. Modelar: pode usar pedra ou argila para criar um ou mais objetos simples de tamanho Enorme ou menor (sem mecanismos ou partes móveis). Por exemplo, pode transformar um tijolo em um martelo, criar uma passagem onde antes havia apenas uma parede ou le vantar uma ou mais paredes que oferecem cobertura total (RD 8 e 50 PV para cada 3m). Solidificar: transforma lama ou areia em terra ou pedra. Seres com os pés na superfície ficam agarrados. Eles podem se soltar com uma ação padrão e um teste de Atletismo (DT igual a do ritual).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+3 PE",
        "texto": "muda a área para 15 cubos com 1,5m de lado."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+7 PE",
        "texto": "também afeta todos os tipos de minerais e metais. Requer 4º círculo."
      }
    ]
  },
  {
    "nome": "Vidência",
    "circulo": 3,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "completa",
    "alcance": "ilimitado",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "5 rodadas",
    "resistencia": "Vontade anula",
    "descricao": "Através de uma superfície reflexiva, como um espelho, uma bacia de água ou mesmo uma TV desligada, você pode ver e ouvir um ser escolhido e seus arredores (cerca de 6m em qualquer direção). O alvo pode estar a qualquer distância, mas tem direito a um teste de resistência no início de cada um de seus turnos para impedir a Vidência naquele turno. Se o alvo passar em dois testes seguidos, o ritual é encerrado e o alvo fica imune a ele por uma semana. Para esse ritual funcionar, você precisa ter alguma informação sobre o alvo, como seu nome ou uma foto. Dependendo do conhecimento que você tiver dele, o alvo recebe bônus ou penalidades em seu teste de resistência. I Você sabe o mínimo sobre o alvo: +10. I Você possui algumas informações sobre o alvo (idade, profissão…) ou já o viu pessoalmente: +5. I Você conhece bem o alvo: –0. I Você tem um pertence pessoal ou roupa do alvo: –5. I Você tem uma parte do corpo do alvo (unhas, cabelos…): –10.",
    "melhorias": []
  },
  {
    "nome": "Vomitar Pestes",
    "circulo": 3,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "",
    "area": "",
    "efeito": "1 enxame Grande (quadrado de 3m)",
    "duracao": "sustentada",
    "resistencia": "Reflexos reduz",
    "descricao": "à metade Você vomita um enxame de pequenas criaturas de Sangue, que surge em um ponto adjacente a sua escolha. O enxame pode passar pelo espaço de outros seres e não impede que outros seres entrem no espaço dele. No final de cada um de seus turnos, o enxame causa 5d12 pontos de dano de sangue a qualquer ser no espaço dele (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+2 PE",
        "texto": "além do normal, um alvo que falhe no teste de Reflexos fica agarrado (o enxame escala e cobre o corpo dele). O alvo pode gastar uma ação padrão e fazer um teste de Acrobacia ou Atletismo para escapar. Se você mover o enxame, o alvo fica livre."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "o enxame vira Enorme (cubo de 6m de lado) e ganha deslocamento de voo 18m."
      }
    ]
  },
  {
    "nome": "Zerar Entropia",
    "circulo": 3,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Você zera completamente a entropia do alvo em relação ao ambiente, deixando-o paralisado. Se passar na resistência, em vez disso fica lento. No início de cada um de seus turnos, o alvo pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, encerra o efeito.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+4 PE",
        "texto": "muda o alvo para “1 ser”. Requer 4º círculo."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+11 PE",
        "texto": "muda o alvo para “seres escolhidos”. Requer 4º círculo e afinidade."
      }
    ]
  },
  {
    "nome": "Alterar Destino",
    "circulo": 4,
    "elementos": [
      "Energia"
    ],
    "execucao": "reação",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "Você vislumbra seu futuro próximo, analisando milhões de possibilidades e escolhendo a melhor. Você recebe +15 em um teste de resistência ou na Defesa contra um ataque.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "muda o alcance para “curto” e o alvo para “um aliado à sua escolha”."
      }
    ]
  },
  {
    "nome": "Canalizar o Medo",
    "circulo": 4,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "permanente até ser",
    "resistencia": "",
    "descricao": "descarregada Você transfere parte de seu poder para outra pessoa. Escolha um ritual de até 3º círculo que você conheça; o alvo pode conjurar este ritual em sua forma básica uma vez, sem pagar seu custo em PE (mas pode usar formas avançadas gastando seus próprios PE para isso). Até o ritual transferido ser conjurado, seus PE máximos diminuem em um valor igual ao custo dele.",
    "melhorias": []
  },
  {
    "nome": "Capturar o Coração",
    "circulo": 4,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Vontade parcial",
    "descricao": "Você desperta uma paixão doentia e obcecada por você no alvo, que passa a querar agradá-lo a todo custo, mesmo que para isso precise ficar contra seus amigos. No início de cada turno do alvo ele deve fazer um teste de Vontade. Se falhar, age de forma a ajudá-lo na melhor de suas capacidades naquele turno. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.",
    "melhorias": []
  },
  {
    "nome": "Conhecendo o Medo",
    "circulo": 4,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Vontade parcial",
    "descricao": "Você manifesta medo absoluto na mente do alvo. Se ele falhar no teste de resistência, a Sanidade dele é reduzida a 0 e ele fica enlouquecendo. Se ele passar, sofre 10d6 pontos de dano mental e fica apavorado por 1 rodada. Uma pessoa que fique insana pelo efeito deste ritual se transforma em uma criatura paranormal a critério do mestre.",
    "melhorias": []
  },
  {
    "nome": "Controle Mental",
    "circulo": 4,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "médio",
    "alvo": "1 pessoa ou animal",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Vontade parcial",
    "descricao": "Você domina a mente do alvo, que obedece todos os seus comandos, exceto ordens suicidas. Um alvo tem direito a um teste de Vontade no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam pasmos por 1 rodada (apenas uma vez por cena).",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+5 PE",
        "texto": "muda o alvo para até cinco pessoas ou animais."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+10 PE",
        "texto": "muda o alvo para até dez pessoas ou animais. Requer afinidade com Conhecimento."
      }
    ]
  },
  {
    "nome": "Convocar o Algoz",
    "circulo": 4,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "1,5m",
    "alvo": "1 pessoa",
    "area": "",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "Vontade parcial,",
    "descricao": "Fortitude parcial Usando os medos subconscientes do alvo, você manipula a espiral da Morte para criar uma imagem daquilo que ele mais teme. Apenas a própria vítima vê o algoz com nitidez; outros seres presentes (incluindo você) enxergam apenas um vulto sombrio. O algoz surge adjacente a você. No fim de cada turno seu, ele flutua 12m em direção à vítima. Se o algoz terminar o turno em alcance curto da vítima, ela deve fazer um teste de Vontade; se falhar, ficará abalada. Se o algoz terminar o turno adjacente à vítima, ela deve fazer um teste de Fortitude. Se falhar, sofre um colapso e fica com 0 PV. Se passar, sofre 6d6 pontos de dano de Morte (este dano não pode reduzir o alvo a menos de 1 PV). O algoz persegue o alvo implacavelmente, mesmo além do alcance do ritual. Ele é incorpóreo e imune a dano e só desaparece se deixar o alvo morrendo ou se for dissipado.",
    "melhorias": []
  },
  {
    "nome": "Deflagração de Energia",
    "circulo": 4,
    "elementos": [
      "Energia"
    ],
    "execucao": "completa",
    "alcance": "pessoal",
    "alvo": "",
    "area": "explosão de 15m de raio",
    "efeito": "",
    "duracao": "",
    "resistencia": "Fortitude parcial",
    "descricao": "Você acumula uma quantidade imensa de Energia, então a libera em uma explosão intensa, como uma estrela em plena terra. Todos na área sofrem 3d10 x 10 pontos de dano de Energia e todos os itens tecnológicos (armas de fogo, acessórios e utensílios) param de funcionar (em termos de regras, estão quebrados). Você não é afetado pela explosão. Alvos que passem no teste de Fortitude sofrem metade do dano e seus itens voltam a funcionar após 1d4 rodadas.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "afeta apenas alvos a sua escolha."
      }
    ]
  },
  {
    "nome": "Distorção Temporal",
    "circulo": 4,
    "elementos": [
      "Morte"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "veja texto",
    "area": "",
    "efeito": "",
    "duracao": "veja texto",
    "resistencia": "",
    "descricao": "Este ritual distorce o fluxo de tempo em relação a você, criando um pequeno bolsão temporal que dura 3 rodadas. Durante este tempo, você pode agir, mas não pode se deslocar do lugar nem interagir com seres e objetos. Da mesma forma, efeitos contínuos não o afetam, e quaisquer efeitos que você iniciar não afetarão a área ao seu redor. Efeitos de área com duração maior que este efeito vão agir normalmente quando o bolsão temporal acabar.",
    "melhorias": []
  },
  {
    "nome": "Fim Inevitável",
    "circulo": 4,
    "elementos": [
      "Morte"
    ],
    "execucao": "completa",
    "alcance": "extremo",
    "alvo": "",
    "area": "",
    "efeito": "buraco negro com 1,5m de diâmetro",
    "duracao": "4 rodadas",
    "resistencia": "Fortitude parcial",
    "descricao": "Você cria um vácuo em um espaço desocupado a sua escolha. No início de cada um de seus quatro turnos seguintes, todos os seres a até 90m do vácuo, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídas e são puxadas 30m na direção do vácuo. Objetos soltos também são puxados. Seres podem gastar uma ação de movimento para se segurar em algum objeto fixo, recebendo +5 em seus testes de resistência. Seres e objetos que iniciem seu turno tocando o vácuo temporal sofrem 100 pontos de dano de Morte por rodada.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+5 PE",
        "texto": "muda a duração para “5 rodadas” e o efeito para que você não seja afetado. Requer afinidade."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+10 PE",
        "texto": "muda a duração para “6 rodadas” e o efeito para que seres escolhidos dentro do alcance não sejam afetados. Requer afinidade."
      }
    ]
  },
  {
    "nome": "Inexistir",
    "circulo": 4,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Vontade parcial",
    "descricao": "Este é um ritual extremamente cruel, que já condenou grandes agentes da Ordem ao oblívio. Você toca o alvo com a intenção de apagá-lo por completo da existência, fazendo a mente e o corpo do alvo serem reescritos e desmantelados da existência. O alvo começa a levitar a poucos centímetros do chão e textos narrando todos os momentos de sua vida surgem e brilham por cima de sua pele, até que a existência dele começa a ser destruída de dentro, causando 10d12+10 pontos de dano de Conhecimento. Se o alvo passar no teste de resistência, em vez disso sofre 2d12 pontos de dano e fica debilitado por uma rodada. Independente do resultado do teste de resistência, se os PV do alvo forem reduzidos a 0 ou menos, ele será completamente apagado, não restando nenhum traço de sua existência.",
    "melhorias": [
      {
        "tipo": "Discente",
        "custo": "+5 PE",
        "texto": "muda o dano para 15d12+15 e o dano resistido para 3d12."
      },
      {
        "tipo": "Verdadeiro",
        "custo": "+10 PE",
        "texto": "muda o dano para 20d12+20 e o dano resistido para 4d12. Requer afinidade."
      }
    ]
  },
  {
    "nome": "Invólucro de Carne",
    "circulo": 4,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "",
    "area": "",
    "efeito": "1 clone seu",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "Você manifesta uma poça de sangue no chão, de onde emerge uma cópia sua. Ela é idêntica em aparência e capacidades (em termos de jogo, tem as mesmas estatísticas) e surge com uma cópia de todo equipamento mundano que você estiver carregando. A cópia não tem consciência (valor de Intelecto e Presença nulos) e não age sem que você dê uma ordem. Você pode gastar uma ação de movimento para dar uma ordem à cópia, como “lute contra aquele ser”. No final de cada um de seus turnos, a cópia segue a ordem da melhor maneira possível, mas ainda é incapaz de tomar decisões sozinha e acatará qualquer ordem perigosa sem hesitar, mesmo que leve à sua destruição. Alternativamente, no início de seu turno, você pode controlar ativamente a cópia. Se fizer isso, você entra num transe temporário e assume o controle da cópia como se fosse seu corpo, usando os sentidos dela. Qualquer ser que interagir com a cópia tem direito a um teste de Percepção (DT do ritual) para perceber que é uma cópia. A cópia se desfaz em uma poça de sangue coagulado se chegar a 0 PV ou sair do alcance.",
    "melhorias": []
  },
  {
    "nome": "Lâmina do Medo",
    "circulo": 4,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "Fortitude parcial",
    "descricao": "Você manifesta uma lâmina impossível, que pode ser descrita apenas como uma “fenda na Realidade”, com a qual golpeia um alvo adjacente. Se o alvo falhar no teste de Fortitude, seus PV são reduzidos a 0 e ele fica morrendo; se passar, sofre 10d8 pontos de dano de Medo (ignora todas as resistências) e fica apavorado por uma rodada. Se uma pessoa ficar morrendo pela Lâmina do Medo e sobreviver, o ferimento causado pelo ritual passa a se transformar constantemente, jamais cicatrizando e fazendo com que a pessoa passe a viver em dor constante. Aprender este ritual requer um poder de trilha específico.",
    "melhorias": []
  },
  {
    "nome": "Medo Tangível",
    "circulo": 4,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "você",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "",
    "descricao": "O ritual transforma seu corpo em uma manifestação do Medo, tornando-o imune a efeitos mundanos. Você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de doenças e venenos, e não sofre dano adicional por acertos críticos e ataques furtivos. Além disso, dano do tipo balístico, corte, impacto ou perfuração não podem reduzir seu total de pontos de vida abaixo de 1, tornando-o virtualmente imortal contra efeitos mundanos.",
    "melhorias": []
  },
  {
    "nome": "Possessão",
    "circulo": 4,
    "elementos": [
      "Conhecimento"
    ],
    "execucao": "padrão",
    "alcance": "longo",
    "alvo": "1 pessoa viva ou morta",
    "area": "",
    "efeito": "",
    "duracao": "1 dia",
    "resistencia": "Vontade anula",
    "descricao": "Você projeta sua consciência no corpo de uma pessoa viva ou morta. Enquanto possuir o alvo, você assume o controle total do corpo dele (se o alvo estiver vivo, a consciência dele troca de lugar com a sua, ficando inerte dentro do seu corpo desacordado). Em termos de jogo, você continua usando a sua ficha, mas com os atributos físicos (Agilidade, Força e Vigor) e deslocamento do alvo. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune a este ritual por um dia. Caso qualquer um dos envolvidos no ritual morra, a mente sobrevivente ficará permanentemente presa no corpo novo, a não ser que use o ritual outra vez para voltar a seu corpo antigo. Retornar para o seu corpo voluntariamente é uma ação livre.",
    "melhorias": []
  },
  {
    "nome": "Presença do Medo",
    "circulo": 4,
    "elementos": [
      "Medo"
    ],
    "execucao": "padrão",
    "alcance": "pessoal",
    "alvo": "",
    "area": "emanação de 9m de raio",
    "efeito": "",
    "duracao": "sustentada",
    "resistencia": "",
    "descricao": "Você se torna um receptáculo para o Medo puro, emanando ondas de pavor e ruína. Alvos dentro da área no momento da conjuração ou no início de cada um de seus turnos são acometidos por sofrimento intenso e sofrem 5d8 de dano mental e 5d8 de dano de Medo (Vontade reduz ambos à metade). Alvos que falharem no teste ficam atordoados por uma rodada (este efeito funciona apenas uma vez por cena).",
    "melhorias": []
  },
  {
    "nome": "Teletransporte",
    "circulo": 4,
    "elementos": [
      "Energia"
    ],
    "execucao": "padrão",
    "alcance": "toque",
    "alvo": "até 5 seres voluntários",
    "area": "",
    "efeito": "",
    "duracao": "instantânea",
    "resistencia": "",
    "descricao": "O ritual transforma o corpo e equipamento dos alvos em energia pura e os faz reaparecer num lugar a sua escolha a até 1.000km. Quando conjura este ritual, você precisa fazer um teste de Ocultismo, com DT definida pelo seu conhecimento sobre o destino. DT 25. Um lugar que você visita com frequência. DT 30. Um lugar que você já visitou pelo menos uma vez. DT 35. Um lugar que você nunca visitou e só conhece a partir da descrição de outra pessoa que esteve lá. Você não pode se teletransportar para um lugar que nunca visitou sem a descrição de alguém. Ou seja, não pode se transportar para “o local onde Júlia está presa” se nunca esteve lá nem falou com alguém que esteve. Se passar no teste, os alvos chegam ao lugar desejado. Se falhar, você chega em um lugar parecido, mas errado ou distante (até 1d10 x 10 km). Se você falhar por 5 ou mais, o ritual falha, mas você gasta PE normalmente e fica atordoado por 1d4 rodadas.",
    "melhorias": [
      {
        "tipo": "Verdadeiro",
        "custo": "+5 PE",
        "texto": "pode se teletransportar para qualquer local na Terra."
      }
    ]
  },
  {
    "nome": "Vínculo de Sangue",
    "circulo": 4,
    "elementos": [
      "Sangue"
    ],
    "execucao": "padrão",
    "alcance": "curto",
    "alvo": "1 ser",
    "area": "",
    "efeito": "",
    "duracao": "cena",
    "resistencia": "Fortitude",
    "descricao": "anula Você manifesta um símbolo de Sangue no seu corpo e no corpo do alvo. Sempre que você sofrer dano, o alvo deve fazer um teste de Fortitude. Se ele falhar, você sofre apenas metade do dano e ele sofre a metade restante. Você pode conjurar o ritual com efeito inverso, fazendo com que você receba metade de todo o dano que o alvo receberia. Alvos voluntários não precisam fazer testes de resistência.",
    "melhorias": []
  }
]

export const ELEMENTOS = [...new Set(RITUAIS.flatMap(r => r.elementos))].sort()