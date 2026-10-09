# Estado do projeto

## Atualização de 09/10/2026 — recuperação e objetivos

O checkout foi clonado de CREATIV-AI-TECNOLOGIA/Marifitnnes para a pasta de projetos. O remoto continha apenas o commit inicial; o restante foi recuperado dos registros locais e do Worker publicado. A recuperação foi validada, mas não há comparação integral com a pasta apagada.

- O catálogo apresenta dez objetivos. Dentro de cada objetivo, a pessoa aceita a agenda sugerida ou cria sua divisão semanal. Minha agenda reúne os dias dos objetivos e preserva a agenda anteriormente ativa.
- O dock mostra Minha agenda centralizado em uma linha em 320, 375 e 414 px.
- Ainda faltam agendas específicas confirmadas para Posteriores, Primeiros passos, Emagrecimento em casa, Membros inferiores e Membros superiores. As divergências dos PDFs ficam sinalizadas; prescrições ausentes não foram inventadas.
- A revisão da recuperação identificou a ausência do acesso a renomear fichas. O botão foi restaurado na ficha e no menu da lista, usando o formulário e a persistência existentes.
- Validação: 103 testes de aplicação/Worker; build cloud; check cloud; agendas sugeridas/personalizadas, persistência e substituição no navegador; renomeação pela ficha e pela lista com recarga; arquivos de produção conferidos. Não foram executadas migrações ou exclusões de dados de usuários.

Os registros abaixo descrevem etapas anteriores e não representam o estado atual completo.


## FORMA-PDF-20260928 — Agenda Pro e treino A1 pré-carregados

Atualizado em: 2026-09-28 19:14 (America/Sao_Paulo)
Estado: correção implementada — aguardando nova validação do Caio

### Objetivo e comportamento

- A agenda **Hipertrofia na academia** foi incluída no app com as divisões de 3, 4, 5 e 6 dias por semana, em ciclos de seis semanas, transcritas do PDF `ebook_cb91cd01-f751-4c92-88bf-3a75a864f769.pdf`.
- No primeiro uso, a pessoa escolhe a frequência e ativa a agenda. A escolha fica salva localmente e continua valendo nos meses seguintes.
- A ficha **A1 — Inferiores completo** foi lida do PDF `ebook_9a7db3af-9b75-47a6-8c78-f9c46061ee5a.pdf`. O app já mostra e inicia os exercícios com séries, repetições, cadência, descanso e instruções disponíveis na ficha. A mobilidade de 3–5 minutos aparece como preparação, sem tratá-la como repetição.
- Os códigos A2, B1, B2, B3, C1 e C2 continuam na divisão semanal da agenda, mas não aparecem como cards/lista de treinos enquanto não houver ficha detalhada. Nenhum exercício foi inventado para eles.
- A carga anterior começa vazia; histórico de carga passa a ser registrado pelo próprio usuário durante os treinos.
- Novas instalações recebem a agenda inicial; dados salvos na versão anterior recebem a agenda via migração do Zustand.

### Decisões e evidências

- A agenda Pro foi escolhida porque contém o código A1 da ficha enviada.
- A agenda geral descreve seis semanas; a ficha A1 descreve progressão de cinco semanas e não define a semana seis. Essa diferença fica visível na observação do treino.
- O PDF dá duas ou três séries para o Recuo no Smith, mas descreve três séries (10, 8 e 6 repetições por perna); o app exibe as três listadas e mantém a observação.
- A Elevação pélvica é nomeada com halter, mas a instrução fala em manter tensão no elástico. A divergência foi mantida como observação para confirmação pela responsável da ficha.
- A leitura dos PDFs foi feita localmente e os dados escolhidos foram incorporados ao catálogo inicial. Não foi criada integração com IA ou envio dos arquivos para serviço externo.
- A causa dos cards vazios foi a ativação da agenda criar modelos internos para todos os códigos programados, embora só A1 tenha ficha. As telas de treinos e de ciclos agora ocultam modelos sem exercícios; home e agenda também só oferecem fichas completas. O calendário preserva os códigos do PDF.

### Verificações

- `npm test`: 15 testes aprovados, incluindo parser de agendas, migração/ativação do A1 e abertura de uma sessão com os nove exercícios.
- `npx tsc -b`: concluído sem erros.
- `npm run standalone`: build Vite concluído.
- `npm run build`: TypeScript e Vite concluíram; o script falhou na etapa final porque `scripts/pwa.mjs` não existe neste workspace.
- `npm audit --omit=dev`: encontrou dois avisos de severidade alta no pacote React Router.

### Limitações e próximo passo

- O app não tem backend ou conta compartilhada: a agenda e os registros ficam no dispositivo. A ficha incorporada aparece em instalações com esta versão, mas não há publicação centralizada para os telefones nem painel da dona para lançar as outras fichas.
- A validação visual no navegador e a confirmação da responsável sobre as duas divergências da ficha permanecem pendentes.
- Próximo passo: Caio validar o fluxo no app; cadastrar os PDFs dos demais códigos; decidir a correção do script PWA e planejar armazenamento compartilhado antes de publicar para todos.

### Histórico

- 2026-09-28: dados da agenda Pro e ficha A1 cadastrados; parser e tela de frequência conectados ao armazenamento; testes técnicos aprovados; aguardando validação do Caio.
- 2026-09-28: Caio contestou a exibição de A2 e outros códigos como treinos sem exercícios; a conclusão anterior de que bastava deixá-los sem exercícios na lista foi invalidada. Causa confirmada na ativação e na tela do ciclo; filtros ajustados para exibir somente fichas detalhadas, aguardando nova validação do Caio.
