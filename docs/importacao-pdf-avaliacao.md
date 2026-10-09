# Importação de PDF: auditoria reversa e decisão sobre IA

Data: 02/10/2026. Avaliação do checkout local, sem publicação.

## Conclusão

Para os três PDFs disponíveis, a extração por texto e geometria das tabelas é viável sem IA generativa. Não há evidência de que seja necessário contratar um modelo para esses layouts. Ainda falta transformar o experimento em um importador completo e validá-lo em arquivos novos; esta análise não estabelece suporte a qualquer PDF.

## O que foi realmente testado

O caminho foi: dados usados pelo app -> arquivos originais -> extração independente com PDF.js -> células das tabelas -> comparação com a edição revisada e com as páginas dos exercícios.

| Arquivo | Páginas com texto / total | Exercícios identificados pela geometria | Agenda conferida |
| --- | --- | --- | --- |
| Aenda she.pdf | 9/9 | Não se aplica | 168 células, 4 frequências, 6 semanas |
| She start.pdf | 8/8 | 12/12 | Não se aplica |
| Treino A1.pdf | 12/12 | 9/9 | Não se aplica |

Foram extraídas 29 páginas dos arquivos originais. Os hashes e os textos extraídos coincidiram com as edições revisadas. O experimento local separou nome, volume, repetições, cadência, descanso e instruções dos 21 exercícios, incluindo cabeçalhos quebrados em duas linhas e a coluna extra de anotação de cargas.

A prancha lateral tem a célula de cadência vazia no original; isso não foi tratado como falha de extração. Os campos são texto bruto, ainda não uma prescrição normalizada pronta para salvar. A conferência da agenda valida o parser e as 168 células contra o catálogo revisado; não é prova de reconhecimento de calendários arbitrários.

O script experimental não usa nomes de exercícios previamente cadastrados para localizar as linhas. Entretanto, ele depende dos cabeçalhos e da estrutura de volume destes modelos. Não foi conectado ao importador do app.

## Limitação atual do app

`preparePdfImport` só aceita os hashes de três arquivos conhecidos. Para os treinos, retorna dados previamente cadastrados após conferir o texto; não interpreta uma ficha desconhecida. A agenda tem um parser, mas também está atrás dessa restrição de hash.

O teste confirmou a rejeição de um identificador de arquivo diferente mesmo preservando o texto extraído. É uma simulação da mudança de edição, não um teste com um quarto PDF real.

O hash deve continuar servindo para identificar a edição, evitar duplicatas e recuperar um resultado já conferido. Ele não deve ser a única porta de entrada de um futuro parser para layouts reconhecidos.

## Casos que exigem regras e revisão

- Mesa flexora: quatro séries declaradas, somente três descritas. Manter a quarta sem meta e pedir confirmação; nenhuma IA pode recuperar com certeza um dado ausente.
- Cadeira extensora: rest-pause na quarta série, incluindo repetições pesadas, pausa em segundos e repetições mais leves. Não reduzir a uma única quantidade de repetições.
- Pullover + abdominal supra: dois movimentos conjugados, com metas diferentes e descanso após o conjunto.
- Prancha lateral: duração em segundos, séries variáveis e cadência sem descrição na célula correspondente.
- A1: ambiguidades de equipamento/unidade e divergência entre seis semanas anunciadas e cinco descritas. A análise mantém os avisos já revisados.

## O que incluir, na ordem

1. **Parser por layout.** Preservar as posições dos textos e os retângulos dos links; reconhecer as colunas, linhas, blocos e código da ficha. Aceitar edições novas do mesmo modelo somente quando a estrutura e os campos forem reconhecidos.
2. **Normalização e validação.** Representar intervalos, unidades, séries opcionais, movimentos conjugados, rest-pause e descanso por série. Preservar o texto original junto dos valores estruturados; marcar dados ausentes e divergências em vez de preenchê-los.
3. **Revisão com o original.** Mostrar a página correspondente ao lado do exercício, permitir correções e destacar campos que precisam de confirmação. A revisão atual foi corrigida para mostrar os avisos existentes, o arquivo e a página de origem; edição de campos e comparação visual ainda estão pendentes.
4. **Vínculo entre ficha, programa e agenda.** Resolver códigos dentro do programa correto e disponibilizar os exercícios também em ciclos já ativados, sem confundir fichas de programas diferentes ou sobrescrever sessões em andamento.
5. **Armazenamento dos originais.** Guardar os bytes do PDF em IndexedDB para consulta local. Hoje são guardados textos e links em localStorage. Sincronização entre dispositivos exige armazenamento e API próprios; não está implementada por esta auditoria.
6. **Mais arquivos de teste.** Validar C1, B3 e outras edições reais, diferentes quantidades de exercícios, tabelas quebradas, páginas sem texto, documentos incompletos e reimportação após ajustes do usuário.

## Onde OCR ou IA entram

| Situação | Caminho proposto | Evidência nesta auditoria |
| --- | --- | --- |
| Texto selecionável e os layouts atuais | Extração por coordenadas + parser + validação | Testado nos três PDFs |
| Nova edição do mesmo layout | Mesmo parser, com validação da estrutura e revisão | Ainda precisa de arquivos novos |
| PDF digitalizado ou foto | OCR antes de reconhecer a tabela | Não testado; nenhum dos três precisou de OCR |
| Layout diferente ou conteúdo livre | Adaptador adicional; IA pode propor um rascunho sujeito a validação | Não testado |
| Informação ausente ou contraditória | Confirmação da responsável pelo treino | Identificado nos originais |

Recomendação: implementar primeiro o caminho determinístico para estes layouts. Avaliar IA como fallback depois de medir os casos que esse caminho não resolve, sem permitir que complete séries, repetições ou descansos por suposição.

## Evidências reproduzíveis

O teste de corpus está em `scripts/pdf-import-audit.test.ts`; o leitor experimental de células está em `scripts/pdf-layout-probe.ts`. Os relatórios brutos ficam em `outputs/pdf-import-audit/`, ignorados pelo Git e sem cabeçalhos pessoais de licença.

```powershell
$env:PDF_AUDIT_DIR = 'C:\Users\Windows\Downloads'
.\node_modules\.bin\vitest.cmd run scripts/pdf-import-audit.test.ts
```

Sem `PDF_AUDIT_DIR`, os três testes de corpus são pulados. Não se presume que os PDFs existam em todas as máquinas. O experimento não altera os arquivos originais.

Validação executada nesta auditoria: 58 testes aprovados, incluindo os três arquivos reais e a regressão dos avisos na revisão; TypeScript, build de produção e `git diff --check` aprovados. O fluxo de leitura do A1 foi executado no Chrome até a revisão, onde os três avisos apareceram. O layout dessa revisão foi conferido em 390 px, sem rolagem horizontal. O novo parser permanece experimental; não houve publicação, commit ou integração com IA/OCR.

## Decisão posterior: Gemini e Vercel

Caio escolheu Gemini para a interpretação dos PDFs e Vercel para hospedar o app e a API. Esta seção registra a proposta técnica pesquisada em 02/10/2026; não representa uma integração já implementada nem uma contratação. Os resultados da auditoria anterior continuam válidos.

### Modelo e custo

Recomendação inicial: **`gemini-3.5-flash-lite`**, modelo estável indicado pelo Google para novos projetos, com suporte a PDF e saída estruturada. A qualidade para estas fichas ainda precisa ser medida com chamadas reais.

Preços padrão da Gemini Developer API, em dólares por milhão de tokens, sem Batch/Flex, armazenamento, Vercel ou impostos:

| Modelo | Entrada de texto/imagem/PDF | Saída, incluindo raciocínio | Observação |
| --- | --- | --- | --- |
| Gemini 2.5 Flash-Lite | US$ 0,10 | US$ 0,40 | Mais barato, mas acesso limitado a contas que já utilizavam a família 2.5 |
| Gemini 3.1 Flash-Lite | US$ 0,25 | US$ 1,50 | Alternativa estável mais barata que o 3.5; comparar no mesmo corpus |
| Gemini 3.5 Flash-Lite | US$ 0,30 | US$ 2,50 | Recomendado inicialmente para projeto novo |

Exemplo hipotético no 3.5: 10.000 tokens cobrados de entrada + 3.000 de saída custariam US$ 0,0105 por importação, ou US$ 10,50 para mil importações iguais. Não é uma medição dos PDFs disponíveis: tamanho em MB e número de páginas não determinam sozinhos o consumo. Registrar o uso retornado pela API, incluindo tokens de raciocínio, para calcular o custo real.

Para PDFs de usuários, usar a modalidade paga: a tabela do Google informa que o conteúdo da modalidade gratuita pode ser usado para melhorar seus produtos; a modalidade paga informa que não. Isso não significa ausência de retenção ou dispensa de verificar os termos do serviço.

Fontes: [preços do Google](https://ai.google.dev/gemini-api/docs/pricing), [catálogo e restrição da família 2.5](https://ai.google.dev/gemini-api/docs/models), [capacidades e versão estável do 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).

### Papel da IA e contrato de dados

A IA identifica fichas e tabelas, propõe a estrutura dos exercícios e da agenda e sinaliza inconsistências. Deve transcrever a prescrição existente, conservando séries especiais e movimentos conjugados. Não deve inventar metas ausentes, resolver contradições por suposição ou alterar a prescrição para personalizar um treino.

O resultado deve conter: tipo de documento; código e nome da ficha; exercícios em ordem; séries/metas e unidades; cadência; descanso; instruções; agrupamentos conjugados; regras da agenda quando existirem; texto original; página e trecho de evidência por item; campos ausentes e avisos. Campos desconhecidos devem ser nulos. Hash, usuário e versão do importador são atribuídos pelo servidor, não pela IA. Páginas e trechos devolvidos precisam ser conferidos contra a fonte; a referência gerada pela IA não prova fidelidade.

Saída em JSON com schema, seguida de validação no servidor (Zod e regras de domínio). JSON válido não garante valores corretos. Contagens divergentes, unidades desconhecidas, dados sem evidência e metas incompletas devem impedir confirmação automática e aparecer na revisão editável junto da página original. Manter tanto a extração original quanto as correções do usuário.

Mesclar C1 + B3, selecionar exercícios, alternar a ordem, montar a agenda e registrar a sessão são funções determinísticas do app. Não exigem chamadas ao Gemini depois de importar as fichas.

Fontes: [saída estruturada e validação semântica](https://ai.google.dev/gemini-api/docs/structured-output), [leitura visual de PDFs](https://ai.google.dev/gemini-api/docs/document-processing).

### Fluxo proposto na Vercel

1. Manter o frontend React/Vite. Implementar autenticação real: o perfil atual é apenas local e não protege uma API paga.
2. Autorizar o upload no servidor e enviar o PDF diretamente do navegador para **Vercel Blob privado**, com limite de tamanho, tipo e prazo. Verificar novamente assinatura, tamanho, páginas e propriedade do arquivo no processamento. Manter os limites atuais de 20 MiB e 40 páginas inicialmente.
3. Criar a importação no banco com estados de upload, processamento, revisão, confirmação e falha. Uma Vercel Function Node processa somente arquivos pertencentes ao usuário autenticado; não aceita URLs arbitrárias fornecidas pelo cliente.
4. Extrair texto e posições com PDF.js. Reutilizar resultados verificados de arquivos conhecidos sem chamar IA. Para arquivos novos, enviar conteúdo necessário ao Gemini; preservar contexto das colunas. Usar leitura visual de páginas para PDFs digitalizados, tabelas ambíguas ou falhas na extração. Comparar qualidade e tokens de texto versus PDF antes de fixar a estratégia mais econômica; texto puro pode perder a estrutura da tabela.
5. Validar e salvar o rascunho. O usuário revisa e corrige antes de confirmar. A confirmação grava fichas e vínculo com programa/agenda sem sobrescrever sessões em andamento. O frontend acompanha o estado e oferece retomada em caso de falha.
6. Guardar originais no Blob e dados estruturados em banco Postgres conectado à Vercel. Provedor de banco e autenticação ainda a definir ao configurar a conta; Vercel não fornece automaticamente uma identidade autenticada para os usuários do app.

As Functions têm limite de payload de **4,5 MB**. Os PDFs testados excedem esse limite, por isso o upload direto ao Blob é necessário no fluxo proposto. A Function recebe uma referência interna e recupera o arquivo privado, sem transportar o PDF no corpo da requisição do navegador.

Chamar a Gemini API diretamente no servidor é suficiente para este caso; hospedar na Vercel não exige usar AI Gateway nem migrar para Next.js. Configurar `GEMINI_API_KEY` como variável sensível de servidor, sem prefixo `VITE_`, sem inclusão no bundle e sem valores em logs ou documentos. Segregar desenvolvimento, preview e produção.

Aplicar limites por usuário e concorrência, teto de tokens/tempo/tentativas e orçamento de uso. Reservar cota antes da chamada; retries limitados apenas para falhas transitórias. Impedir cobranças duplicadas por requisições simultâneas com idempotência. Cache por usuário + SHA-256 + versão do parser/schema/prompt + modelo, separado das edições pessoais. Não aumentar automaticamente para um modelo mais caro sem política de custo explícita.

Fontes: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [limites das Functions](https://vercel.com/docs/functions/limitations), [upload direto e autorização](https://vercel.com/docs/vercel-blob/client-upload), [Blob privado](https://vercel.com/docs/vercel-blob/private-storage), [variáveis sensíveis](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

### Próxima validação e conexão

Conectar a conta Vercel por autorização do conector ou login no navegador, sem enviar senha no chat. Também será necessário um projeto Google com Gemini API habilitada, faturamento e chave configurada no ambiente seguro.

Antes de liberar importação: medir os três PDFs atuais e novos arquivos C1/B3 no Gemini; conferir exercícios, ordem, cada meta, conjugados, rest-pause e todas as células da agenda; verificar avisos de dados ausentes. Testar arquivos sem texto, PDFs inválidos, resposta incompleta, timeout, cota excedida, duplicatas e isolamento entre usuários. O consumo e a qualidade reais podem justificar trocar o modelo inicial pelo 3.1 ou reforçar a leitura visual. Ainda não houve chamada ao Gemini, conexão da conta ou deploy desta proposta.
