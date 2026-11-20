# Capilu — a capivarinha curiosa

Estratégia do canal, identidade e plano de produção.

## 1. Conceito

| Item | Decisão |
|---|---|
| Nome do canal | **Capilu** (lema: "a capivarinha curiosa") |
| Público | Crianças de 3 a 6 anos, Brasil, português |
| Promessa | Aprender brincando: cada vídeo ensina **uma** coisa, com perguntas para a criança responder em voz alta |
| Personagens | **Capilu**, capivara filhote, curiosa e carinhosa, flor de ipê-amarelo na orelha. **Tico**, o passarinho que mora na cabeça dela (só pia) |
| Cenário | Beira de rio inspirada no Pantanal |
| Tom | Calmo, ritmo lento, sem cortes frenéticos. É o oposto do estilo hiperestimulante, e é isso que pais procuram e que o YouTube prioriza em conteúdo infantil de qualidade |

Por que capivara: é o bicho mais querido do Brasil hoje, é nosso, e não havia canal educativo liderado por uma capivara com esse nome na pesquisa feita em nov/2026.

## 2. Identidade visual

Arquivos em `brand/`:

- `avatar-800.png` — foto do canal
- `banner-2560x1440.png` — capa do canal (texto dentro da área segura)
- `logo.png` — logo com fundo transparente
- `marca-dagua-150.png` — marca d'água dos vídeos
- `paleta.png` — cores: Capilu `#C07F3F`, Sol `#FFC93C`, Coral `#FF6B6B`, Folha `#6BCB77`, Rio `#2EC4B6`, Céu `#4D96FF`, Tinta `#2B2D42`, Creme `#FFF6E5`

Fonte: Baloo 2 (licença livre OFL). Desenho, música e efeitos são originais, gerados por código neste repositório; a voz usa o modelo aberto Kokoro (licença Apache 2.0). Não há material de terceiros com direito autoral.

## 3. Formato dos episódios

Estrutura fixa (a repetição é o que faz criança pequena voltar):

1. Vinheta "Capilu!" (4 s)
2. Oi + tema do dia
3. 4 a 6 blocos: **mostra → pergunta → pausa de 3 s → resposta com festa → segundo exemplo**
4. "Vamos lembrar juntos?" (recapitulação)
5. "Sua vez!" — desafio fora da tela (procurar algo em casa)
6. Tchau

Formatos publicados:

- **Episódio** (2 a 4 min): 2 por semana
- **Shorts** (30 a 50 s, um bloco do episódio em vertical): 3 por semana
- **Compilação** (15 a 30 min, vários episódios juntos): 1 por mês a partir do 8º episódio. É o formato que mais acumula horas assistidas em canal infantil

## 4. Primeiros 12 episódios

| # | Título | Série |
|---|---|---|
| 1 | As Cores com a Capilu ✅ pronto | Cores |
| 2 | Contando até 5 com a Capilu | Números |
| 3 | As Formas: círculo, quadrado e triângulo | Formas |
| 4 | Que som faz? Bichos do Brasil | Animais |
| 5 | Contando até 10 | Números |
| 6 | Feliz, triste, bravo: as emoções | Emoções |
| 7 | As vogais A E I O U | Letras |
| 8 | Grande e pequeno: os opostos | Opostos |
| 9 | Hora de escovar os dentes | Hábitos |
| 10 | As frutas | Alimentação |
| 11 | Bichos do Pantanal | Animais |
| 12 | Lavar as mãos | Hábitos |

## 5. Monetização — números honestos

Requisitos do Programa de Parcerias do YouTube: **1.000 inscritos** e **4.000 horas assistidas em 12 meses** (ou 10 milhões de views de Shorts em 90 dias), conta com verificação em duas etapas e AdSense de um adulto.

Pontos que limitam o ganho em canal infantil:

- Todo vídeo precisa ser marcado como **"conteúdo para crianças"** (é obrigação legal). Isso desliga anúncios personalizados, comentários, sininho, cards e telas finais.
- A receita por mil visualizações de conteúdo infantil no Brasil é baixa. Como ordem de grandeza (estimativa, varia muito): algo entre US$ 0,20 e US$ 1,00 por mil views. Para R$ 500/mês seria preciso algo na casa de **100 mil a 500 mil views mensais**.
- Prazo realista para atingir os requisitos: **6 a 18 meses** de publicação constante, sem garantia.
- O YouTube desmonetiza conteúdo "repetitivo ou produzido em massa". Proteções adotadas: personagem e roteiros originais, temas diferentes a cada episódio, valor educativo claro, nada de dezenas de vídeos iguais.

Fontes de renda além dos anúncios (quando houver audiência): YouTube Premium (paga também em vídeo infantil), licenciamento do personagem, atividades para imprimir vendidas a pais e escolas.

## 6. Como compensar a receita baixa por visualização

- **Três idiomas com a mesma animação:** lançar em português e, a partir do episódio 4, redublar cada vídeo em espanhol e inglês (canais irmãos ou faixas de áudio). O roteiro é um arquivo de texto e a animação é a mesma, então o custo extra é mínimo. O inglês paga mais por visualização.
- **Compilações de 15 a 30 minutos** todo mês.
- **Renda fora dos anúncios** quando houver audiência: atividades para imprimir e licenciamento da personagem.

## 7. Publicação

Em cada pasta `episodes/<ep>/` há um `metadata.md` com título, descrição, tags e configurações. Arquivos finais em `videos/`.

Configuração de todo vídeo:

- Público: **"Sim, é conteúdo para crianças"**
- Categoria: Educação · Idioma: Português (Brasil)
- Legendas: enviar o `.srt` do episódio
- Conteúdo alterado/sintético: **Não** (animação claramente não realista não exige declaração; se o formulário perguntar sobre voz sintética, responder com a verdade)
- Playlist: a série do episódio

## 8. O que depende do dono do canal

Estas etapas exigem a conta e os documentos de um adulto e não podem ser feitas por IA:

1. Criar o canal "Capilu" e subir avatar, banner e marca d'água (uma vez, ~20 min)
2. Verificar o telefone da conta (libera miniaturas personalizadas)
3. Subir os vídeos e agendar. Pode ser em lote: uma vez por mês, ~20 min, agendando as datas no YouTube Studio
4. Quando atingir os requisitos: cadastro no AdSense e dados fiscais

Publicação 100% automática exige um projeto no Google Cloud com a API do YouTube aprovado em auditoria do Google; sem a auditoria, os vídeos enviados pela API ficam travados como privados. Vale a pena só depois que o canal estiver andando.
