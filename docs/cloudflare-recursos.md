# Recursos Cloudflare

Criados e conferidos no painel pelo Edge em 02/10/2026, com autorização de Caio. A escolha posterior por Cloudflare substitui a proposta de Vercel registrada em `importacao-pdf-avaliacao.md`.

| Recurso | Nome | Identificador / acesso |
| --- | --- | --- |
| Conta | Conta fornecida por Caio | `c298c1122d9f24c1536110100b974559` |
| Worker | `marifitnnes-api` | `https://marifitnnes-api.caiooficial2025.workers.dev` |
| D1 | `marifitnnes-db` | `8acf65fe-a6ed-42df-86af-85ff76d31180` |
| R2 | `marifitnnes-pdfs` | Standard; acesso público desativado |

## Vínculos confirmados no Worker

- `DB`: banco D1 `marifitnnes-db`.
- `PDFS`: bucket R2 `marifitnnes-pdfs`.

## Estado e pendências

Frontend React/Vite e API publicados juntos no Worker. Migration aplicada no D1: contas, sessões, snapshots, importações e limites. R2 armazena originais privados com acesso autenticado por usuário. Cadastro, login, sincronização com revisão otimista, revisão editável e confirmação implementados. Testes HTTP no endereço público passaram com os três PDFs originais: Treino A1.pdf, She start.pdf e Aenda she.pdf. Isolamento entre duas contas, CSRF, conflito, arquivo falso e logout também passaram.

A integração Gemini usa `gemini-3.5-flash-lite`, saída JSON validada e revisão antes de confirmar. `GEMINI_API_KEY` foi configurada como secret do Worker em 2026-10-02, sem valor em código, documentação ou frontend. Teste real pela API publicada extraiu um PDF sintético novo: dois exercícios, três séries de 12 e duas séries de 10, descansos de 60/45 segundos e evidência literal da página correta. O PDF exigiu autenticação. Os dados técnicos foram removidos após o teste. Esquema de geração simplificado para compatibilidade com Gemini; todos os limites e validações estritos permanecem no servidor. Fluxo de upload pelo Edge não foi concluído pela automação porque a extensão bloqueia acesso a arquivos locais. PDFs conhecidos usam conteúdo previamente conferido sem chamada ao modelo. Recuperação de senha e verificação de e-mail ainda não estão disponíveis.

## Reprodução

Use `XDG_CONFIG_HOME=C:\Users\Windows\AppData\Local\MarifitnnesCloudflare` para a autorização CLI desta conta; a autorização global pertence a outra conta. Execute `pnpm run build:cloud`, `pnpm exec tsc -p tsconfig.worker.json` e `pnpm exec wrangler deploy`. Para migrations: `pnpm exec wrangler d1 migrations apply marifitnnes-db --remote`. `CLOUD_TEST_URL` define a origem do script `node scripts/cloud-smoke.mjs`; `PDF_AUDIT_DIR` aponta para os três PDFs reais. Nenhuma credencial de validação é registrada pelo script.

Nenhum upgrade de plano foi solicitado nesta configuração. Os recursos permanecem sujeitos às cotas e cobranças por uso da conta.
