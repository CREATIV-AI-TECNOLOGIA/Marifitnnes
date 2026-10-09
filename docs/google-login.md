# Login Google

Implementação usa Google Identity Services (popup e ID token), sem acesso a Drive/Gmail/Calendar e sem Client Secret. Worker verifica assinatura RS256 nas chaves públicas Google, emissor, Client ID/audience, expiração, idade, nonce e e-mail verificado. Identidade permanente é o `sub`, conforme https://developers.google.com/identity/openid-connect/openid-connect.

Migration `0002_google_auth.sql`: identidade Google ligada ao usuário e desafios de cinco minutos, consumidos atomicamente uma única vez e vinculados ao cookie HttpOnly/SameSite=Strict. Vinculação exige sessão autenticada antes e durante a confirmação. E-mail coincidente não vincula automaticamente uma conta com senha. Conta Google nova não recebe senha fictícia utilizável; a senha continua disponível para contas que já a possuíam.

## Configuração publicada em 2026-10-02

Projeto criado e conferido na conta nova do Edge: **Forma Login**, ID `ferrous-arena-510418-a2`. Termos Google Cloud aceitos pelo titular e política de dados aceita com sua autorização. Cliente OAuth web **Forma** criado, com origem exclusiva `https://marifitnnes-api.caiooficial2025.workers.dev`. `GOOGLE_CLIENT_ID` está configurado em `wrangler.jsonc` e publicado no Worker. Nenhum Client Secret é utilizado neste fluxo.

Verificação executada: 77 testes passaram, assim como TypeScript do frontend/Worker e build cloud. JWT validado com assinatura de teste, destinatário e expiração adversariais; runtime Cloudflare local recusou CSRF, vínculo sem sessão, token falso e repetição do desafio. Autenticação por senha e isolamento remoto passaram após migration. Revisão independente identificou concorrência senha/Google, corrigida com autenticação serializada e verificação de `userId` no snapshot antes de escrever cache. Login Google real concluído pelo titular no Edge: painel exibiu Caio Campos e “Tudo salvo na nuvem”; após recarregar, a sessão autenticada foi restaurada.

Google Auth Platform está **Em produção**, público **Externo**, conforme confirmação do console em 2026-10-02. Política de Privacidade e Termos de Uso foram revisados e aprovados pelo titular, publicados em `/privacidade.html` e `/termos.html` e salvos em Branding. O app solicita apenas identificação básica para login, sem acesso a dados de Drive/Gmail/Agenda. Login real e persistência foram validados com a conta do titular; entrada de uma segunda conta Google não foi exercitada. `GEMINI_API_KEY` também foi configurada como secret e a extração real de PDF sintético passou pela API publicada.

No Google Cloud, criar ou selecionar projeto; configurar Google Auth Platform com nome Forma, e-mail de suporte/contato escolhido pelo titular e público externo; criar cliente OAuth do tipo Aplicativo da Web.

Origem JavaScript autorizada: `https://marifitnnes-api.caiooficial2025.workers.dev`. Este fluxo de popup ID token não exige URI de redirecionamento. Se usar modo Testing, cadastrar os e-mails dos usuários de teste. A publicação do consentimento depende da configuração da conta Google.

Configurar `GOOGLE_CLIENT_ID` no Worker (o identificador público pode ser uma variável). Sem essa variável, a UI informa indisponibilidade e a API não tenta autenticar. Não há segredo Google no frontend. `GEMINI_API_KEY` é outra credencial, independente.

Aplicar migration com Wrangler autorizado nesta conta (`XDG_CONFIG_HOME=C:\Users\Windows\AppData\Local\MarifitnnesCloudflare`), validar testes/TypeScript, executar `pnpm run build:cloud` e `pnpm exec wrangler deploy`.

Login de conta Google nova, retorno ao painel e persistência após recarregar foram confirmados no ambiente publicado. Vinculação de uma conta existente com senha no Perfil e nova entrada após logout ainda não foram exercitadas manualmente com contas reais; os controles de vínculo e conflito foram cobertos pelos testes automatizados.
