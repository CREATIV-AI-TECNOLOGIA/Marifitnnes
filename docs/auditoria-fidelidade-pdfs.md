# Conferência dos PDFs e do Forma — 02/10/2026

Conferência dos bytes originais em Downloads, extração independente com PDF.js e pdfplumber, renderização das 29 páginas e comparação com as definições, importação, revisão, agenda e sessão do app. A identidade dos arquivos foi verificada por SHA-256. Os PDFs originais não foram modificados.

## Cobertura por documento

| Documento | Páginas | Conteúdo conferido |
| --- | --- | --- |
| Treino A1.pdf | 1–4 | Capa, identificação, nível intermediário/avançado, objetivo global de inferiores, orientações e os oito pontos de execução/progressão/recuperação. |
| Treino A1.pdf | 5 | Mobilidade de quadril, joelho e tornozelo: uma série, 3–5 minutos, amplitude progressiva, controle e vídeo original. |
| Treino A1.pdf | 6–10 | Nove exercícios; ordem, ativação/principal, volume, metas por série, unidades, cadências, descansos por série/faixas, instruções, alternativa com halteres, rest-pause, espaços para registro de carga e nove links de demonstração. |
| Treino A1.pdf | 11–12 | Orientações de falha técnica, progressão, ciclo e encerramento. |
| She start.pdf | 1–2 | Capa, nível iniciante, full body, execução, carga, ordem, recuperação e referências aos módulos externos da plataforma original. |
| She start.pdf | 3 | Mobilidade global: quadril, coluna e ombros, 1–2 voltas, 5–8 minutos, movimentos lentos/contínuos e vídeo original. |
| She start.pdf | 4–7 | Doze exercícios; ordem, blocos, volume, metas, unidades por perna/segundos, cadências, descansos, instruções, séries variáveis, conjugado de dois movimentos e doze links. |
| She start.pdf | 8 | Encerramento. |
| Aenda she.pdf | 1–5 | Identificação, funcionamento de seis semanas, fases, mudança de exercícios entre ciclos, recuperação e critérios das quatro frequências. |
| Aenda she.pdf | 6–9 | Todas as 168 células: quatro frequências × seis semanas × sete dias, incluindo Descanso / SheFlow. |

## Diferenças corrigidas

- A1: orientações estavam excessivamente resumidas. Foram recuperados nível/compatibilidade, técnicas avançadas somente onde indicado, objetivo completo, registro por série, possibilidades de evolução além da carga, estratégia de falha, prioridades quando há pouco tempo e distinção de sinais de dor.
- A1: a meta da quarta série da extensora não mostrava a pausa de 10 segundos. A pausa agora também aparece na meta; a orientação completa do rest-pause permanece.
- Start: Leg 45 não especificava que a pausa de um segundo é no topo. Corrigido.
- Start: prancha lateral apresentava uma cadência preenchida pelo app, embora a célula original esteja vazia. Removida; duração e alinhamento continuam nos campos corretos.
- Start: recuperado o nome complementar “plank leg crunch” e a referência ao Cronograma de Treinos.
- Os dois vídeos de mobilidade estavam presentes nos links extraídos, mas não tinham player no lugar da preparação. Agora estão disponíveis nas orientações, sessão e revisão da importação.
- Texto completo, links e PDF original podem ser consultados na conferência opcional da importação. A ficha e a agenda usam a interface normal do app; o PDF incorporado não é carregado ao abrir o resumo. A extração textual não reproduz a disposição gráfica das tabelas e fotos; o original continua sendo a referência visual.
- Sessão: outro PDF cujo treino também se chama A1 recebia orientações do A1 conhecido e ocultava suas próprias notas. A identificação passou a usar a fonte do documento, com regressão cobrindo outro programa A1.
- Importar só a agenda não traz exercícios de PDFs que ainda não foram enviados. Fichas importadas antes ou depois da agenda são vinculadas ao programa; as demais permanecem indisponíveis. As notas e a preparação também acompanham a ficha nos ciclos.
- A conta passa a iniciar vazia. Migrações não recolocam fichas, fontes ou agendas que já foram retiradas.

## Inconsistências preservadas do original

1. A1, página 6: título com halter, cadência com elástico e repetição em passos. Nenhuma prescrição foi substituída por interpretação.
2. A1, página 9: mesa flexora declara quatro séries e fornece metas de apenas três. A quarta continua “Não informada no PDF”.
3. A1, páginas 3/11: anuncia seis semanas e detalha uma lógica de cinco. A agenda separada descreve seis fases; isso não autoriza inventar uma prescrição ausente na ficha.
4. Start, página 5: a cadência do agachamento sumô diz “puxar”. O termo foi mantido, apesar da formulação incomum.
5. Os módulos Cronograma, Extra/alongamento/cardio e SheFlow são referências à plataforma original. Estes três PDFs não contêm suas fichas completas; o app não inventa esse material.

## Verificação executada

- Auditoria com arquivos originais: texto de todas as páginas, todos os links, volume/faixas de séries, números de cada meta e de cada descanso, tempos das cadências, movimentos conjugados e associação do vídeo à página do exercício.
- Leitura manual das instruções e orientações frente ao texto extraído e páginas renderizadas.
- 21 exercícios de ativação/principal, duas preparações de mobilidade, 23 links de vídeo e 168 células de agenda conferidos. Mobilidade permanece na preparação, sem inventar séries adicionais na lista principal.
- 90 testes passaram; TypeScript do frontend e Worker, build de produção Cloudflare e verificação de diff passaram.
- No Edge publicado, conferidas orientações completas e player da mobilidade A1 apontando ao vídeo original `n1Bqn5BP6Dc`.

Os três arquivos exatos têm mapeamento previamente conferido, identificado pelo hash; outra edição ou PDF usa o fluxo de extração/revisão. Esta auditoria não certifica antecipadamente a resposta da IA para documentos diferentes.

## Importação e segunda conferência no Chrome

Por solicitação de Caio, foram enviados e confirmados pela interface os três arquivos atuais em Downloads: `Agenda she.pdf`, `Treino A1.pdf` e `She start C.pdf`. A agenda estava aguardando confirmação, assim como A1: o registro de uploads existia, mas nenhuma ficha ou agenda havia sido adicionada ao snapshot. O nome antigo da agenda permanece no registro previamente enviado; seus bytes e hash são idênticos ao arquivo renomeado.

- Importação simplificada: resumo e botão de adicionar no início; observações, ajustes, texto e PDF original opcionais.
- Corrigida a agenda que ocultava planos importados enquanto não houvesse ficha de exercícios vinculada. Teste de regressão reproduziu o problema antes da correção e passou depois.
- D1 confirmou os três uploads com status `confirmed`, três fontes, duas fichas originais e um programa. Ativado o ciclo de seis semanas na frequência inicial de três dias, alterável pela interface.
- Conferência independente do snapshot salvo: fontes e páginas completas, todas as definições dos 21 exercícios, vídeos, preparação e notas, 168 células e quatro frequências idênticos às definições auditadas. O A1 do ciclo recebeu cópias completas dos nove exercícios. As outras fichas citadas na agenda continuam sem exercícios porque não estão nesses três PDFs.
- Navegador recarregado: calendário, ciclo ativo, fichas e status de sincronização preservados. O dia 09/10 abriu o A1 com nove exercícios; o player incorporado carregou o vídeo original de mobilidade `n1Bqn5BP6Dc`.
- Auditoria dos bytes originais repetida usando os nomes atuais: três documentos, 29 páginas e seus links passaram. Mais nove testes cobrindo PDFs, estado remoto salvo, revisão compacta e agenda; seis testes de agenda/importação de ciclo e os 20 testes anteriores desta mudança passaram. Build de produção, TypeScript do Worker e `git diff --check` passaram.
- Publicado na Cloudflare: versão `bf3d9345-d354-40f7-9069-2949863dd481`.

## Limpeza após a conferência

Na conta Google de Caio havia duas fichas e uma agenda pré-carregadas, zero uploads no registro de importações, zero ciclos, zero histórico e nenhuma sessão ativa. Após salvar uma cópia local para recuperação, o snapshot dessa conta foi limpo com proteção de revisão e condições que conferem os IDs pré-carregados. D1 confirmou revisão 4 e zero fichas, exercícios, programas e fontes. Nenhuma outra conta ou arquivo PDF original foi removido. O Edge confirmou catálogo e agenda vazios, sincronizados, com ações para importar.
