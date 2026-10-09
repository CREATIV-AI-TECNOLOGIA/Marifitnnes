# Textos públicos do Forma — rascunho para aprovação

Textos aprovados pelo titular e publicados em `/privacidade.html` e `/termos.html` em 2 de outubro de 2026. Contato aprovado: caiooficial2025@gmail.com. Este arquivo preserva a versão revisada que originou as páginas públicas.

## Política de Privacidade

O Forma organiza fichas, exercícios, agendas e registros de treinos. Para falar sobre seus dados, solicitar correções ou pedir a exclusão da conta e dos dados associados, entre em contato pelo e-mail caiooficial2025@gmail.com. A exclusão completa da conta ainda não possui botão no aplicativo e precisa ser solicitada por esse canal.

### Dados utilizados e finalidade

Guardamos nome, e-mail e informações necessárias para autenticar sua conta. No login Google, recebemos seu identificador Google, nome e e-mail verificado; não solicitamos acesso a Gmail, Drive ou Agenda Google. Para contas com senha, armazenamos uma representação criptográfica com salt, e não a senha em texto.

Os PDFs enviados, exercícios importados ou cadastrados, agendas, preferências, séries, repetições, cargas e histórico são utilizados para apresentar e sincronizar seus treinos. O navegador também mantém dados locais para o funcionamento do app. Cookies de sessão mantêm seu login; o cookie de sessão tem validade de até sete dias. Contadores técnicos limitam tentativas de acesso e importação para proteger o serviço.

### Serviços envolvidos

O aplicativo usa Cloudflare Workers para operar a API, D1 para contas e registros, e R2 privado para arquivos PDF. Os arquivos exigem autenticação e a API verifica a conta responsável pelo acesso.

Na importação de um PDF novo, seu conteúdo é enviado à API Gemini do Google para transcrever a ficha ou agenda em dados estruturados. O resultado é apresentado para revisão antes de confirmar. PDFs já reconhecidos pelo app podem utilizar uma transcrição previamente conferida, sem nova chamada ao Gemini. A importação não envia sua senha ao Google.

O tratamento do conteúdo enviado ao Gemini depende do plano e dos termos do Google. Nos serviços gratuitos, o Google informa que pode utilizar entradas e respostas para melhorar seus serviços, inclusive com revisão humana, e orienta não enviar informações pessoais, sensíveis ou confidenciais. Nos serviços pagos, informa que não utiliza esse conteúdo para melhorar seus produtos. Consulte os [termos da API Gemini](https://ai.google.dev/gemini-api/terms). Remova dados pessoais e informações de saúde de um PDF antes de enviá-lo quando houver uso da cota gratuita.

### Armazenamento e solicitações

Os registros associados à conta permanecem armazenados para permitir continuidade e sincronização dos treinos. O aplicativo não oferece atualmente uma política de exclusão automática por inatividade. Pedidos de acesso, correção ou exclusão podem ser feitos pelo contato acima, com verificação da titularidade da conta. Sair do app encerra a sessão; não equivale a excluir a conta ou o histórico armazenado.

Não há ferramenta de publicidade ou venda de dados implementada no Forma. Google e Cloudflare tratam dados necessários aos respectivos serviços conforme suas próprias políticas. Esta política deve ser atualizada quando o funcionamento ou os serviços usados pelo aplicativo mudarem.

## Termos de Uso

O Forma permite organizar e registrar treinos, importar PDFs e combinar exercícios de diferentes fichas. A versão atual exige conta para sincronização na nuvem. Preserve suas credenciais e utilize apenas documentos que você tenha autorização para enviar.

A importação com IA pode apresentar erros, informações ausentes ou divergências. Confira o PDF original e revise os exercícios, séries, repetições, descansos e a agenda antes de confirmar o resultado. A combinação de fichas é uma escolha do usuário; o aplicativo não avalia se o treino combinado é adequado para sua condição física. O Forma organiza informações e não fornece avaliação clínica ou prescrição médica.

A funcionalidade que utiliza a API Gemini destina-se a usuários maiores de 18 anos, conforme os requisitos desse serviço. Não envie documentos pessoais, confidenciais ou informações sensíveis à importação com IA quando ela utilizar serviços gratuitos do Google.

Recursos podem ficar temporariamente indisponíveis por manutenção, falhas ou limites dos provedores. Na configuração atual, há limites de tamanho e de frequência de importação. A recuperação de senha ainda não está disponível; contas existentes podem vincular Google pelo Perfil, mediante autenticação.

Para suporte, dúvidas sobre os dados ou solicitação de exclusão, use caiooficial2025@gmail.com. Estes termos descrevem os recursos atuais e não substituem os direitos previstos na legislação aplicável.
