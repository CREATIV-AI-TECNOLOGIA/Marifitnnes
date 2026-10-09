# Integração Cloudflare: plano de execução

Objetivo aprovado por Caio: concluir hospedagem, autenticação, persistência privada e importação Gemini com revisão. Executar nesta sessão, sem commit/push. A chave Gemini será configurada depois; arquivos conhecidos podem ser importados sem modelo.

## Decisões

Worker existente serve frontend Vite e rotas `/api/*` na mesma origem. D1 guarda contas, sessões, snapshots com revisão otimista, importações e cotas. R2 guarda PDF por usuário/hash, sem URL pública. Senhas usam scrypt; cookies HttpOnly/Secure/SameSite e conferência de Origin protegem mutações. Registro/login e importações têm limites por IP/usuário. Não há envio de e-mails nem recuperação de senha nesta entrega.

Gemini recebe PDF e retorna JSON validado com Zod: dados ausentes são explícitos, páginas precisam existir, metas especiais conservam texto original. Revisão permite editar e consultar o PDF autenticado antes de confirmar. Cache de extração separado das alterações pessoais; confirmações e snapshot têm escopo do usuário. Sessões locais existentes permanecem intactas; contas em nuvem usam armazenamento local separado.

## Execução e comprovação

- [x] Backend: regressões de credenciais, CSRF, acesso sem sessão, isolamento, limites de PDF e saída do modelo; implementar migrations, rotas, senha/sessão, snapshot e PDF.
- [x] Frontend: autenticação e retomada, snapshot com conflito visível, importação e revisão editável com original, logout sem exposição de dados de outra conta.
- [x] Cloudflare: Wrangler com DB/PDFS existentes; autorizar CLI na conta já conectada, aplicar migrations e publicar frontend/backend; conferir bindings e endpoints.
- [x] Verificar testes, TypeScript, build, runtime Worker e fluxo real de conta/importação conhecida no Edge; chave ausente deve produzir erro claro. Não declarar extração Gemini validada antes de chamada real.

Secret GEMINI_API_KEY configurado em 2026-10-02. Extração real de PDF sintético pela API publicada validada com séries, descansos e evidência literal. Nenhum upgrade de plano automático; se CPU/quotas gratuitas impedirem execução, registrar a limitação real.
