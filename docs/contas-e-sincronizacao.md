# Contas e sincronização

O MiBody usa **Supabase Auth** para cadastro, confirmação de e-mail, entrada, recuperação de senha e saída. Os registros são salvos no PostgreSQL do projeto, separados pelo identificador da conta autenticada. Não existe senha própria no JSON do perfil ou no backup.

## Ativar o projeto

1. No dashboard do projeto Supabase, abra **SQL Editor → New query**. Execute todo o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql). O script é repetível e cria a tabela, a política de leitura e a função de escrita com controle de revisão.
2. Em **Authentication → URL Configuration**, configure a URL HTTPS do site como **Site URL** e adicione a URL de retorno em **Redirect URLs**. Para GitHub Pages deste repositório, a URL prevista é `https://zogap.github.io/MiBody/`; ela precisa estar publicada e funcionando antes dos links de confirmação e recuperação serem usados.
3. Em **Authentication → Providers → Email**, mantenha o cadastro por e-mail habilitado e configure confirmação de e-mail. Para uso por várias pessoas, confira as limitações do serviço de envio e configure seu provedor SMTP quando necessário. Mantenha os limites de envio e proteções do provedor.
4. A URL e a chave **pública publishable/anon** ficam em `src/cloud-config.json`. São configuração pública do cliente, e não dão permissão para ler os registros dos usuários sem autenticação e políticas corretas. Nunca use `service_role` ou `sb_secret_` no frontend.
5. Se necessário, use `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no build, ou a tela **Conta → Conectar Supabase** para uma configuração local. O workflow do Pages lê essas variáveis públicas das **Repository variables**. A escolha salva no navegador tem precedência sobre o build.
6. Publique o build HTTPS e crie uma conta pelo app. Confirme o e-mail e entre. Valide com duas contas reais e dois aparelhos. Um teste com serviço simulado ou a execução local do SQL não substitui esta etapa.

O HTML em arquivo único continua útil para o modo local. Para login, confirmação e recuperação por e-mail, use o site HTTPS, com URL de retorno configurada. Não coloque dados pessoais ou arquivos de backup no repositório.

## Como os dados ficam separados

- O modo local mantém a antiga chave IndexedDB `app`, para preservar instalações anteriores.
- Cada conta usa uma chave local `user:<id>` própria. Ela armazena a cópia daquele usuário, a revisão conhecida no servidor e a indicação de alterações pendentes.
- A tabela `user_state` só permite leitura para o próprio `auth.uid()`, usando Row Level Security. Escritas diretas e acesso anônimo são revogados. A função de escrita usa o usuário da sessão e não aceita um identificador de outro usuário como argumento.
- Entrar numa conta não copia os dados do modo local. A ação **Trazer dados do modo local** pede confirmação e substitui os registros da conta aberta por uma cópia dos dados locais. As outras contas não são alteradas.
- Sair remove a sessão de autenticação deste navegador e mostra a tela de entrada. Os dados da conta deixam de aparecer. O modo local só é reaberto por uma ação explícita. As cópias offline permanecem no armazenamento do navegador; este não é um cofre contra quem controla o aparelho ou suas ferramentas de desenvolvimento.
- Backup, restauração e exclusão de registros atingem somente o perfil aberto. Restaurar ou excluir conectado também sincroniza a alteração nessa conta; não remove o cadastro no Supabase Auth.

## Offline e alterações em dois aparelhos

As alterações são salvas primeiro no IndexedDB e depois enviadas à nuvem. A conta já autenticada pode continuar usando a cópia local sem conexão; a entrada inicial exige internet. O app tenta sincronizar após gravações, ao voltar à janela, ao reconectar e a cada 20 segundos enquanto estiver visível. Não promete sincronização com o app fechado.

A função SQL verifica a revisão esperada antes de gravar. Se outro aparelho alterou os dados, o app preserva a cópia local e apresenta um conflito em **Conta e sincronização**. O usuário escolhe manter a versão do aparelho ou a da nuvem. Antes de usar a nuvem, o app exporta a versão local como backup. Os dados não são mesclados automaticamente.

Espere o status **Sincronizado com sua conta** antes de depender de outro aparelho. Falhas de rede ou configuração mantêm as alterações pendentes e mostram que a sincronização não concluiu. Fotos e outras informações do estado também entram na sincronização; observe as cotas e limites do seu projeto. Faça backups privados regularmente.

## Perfil e plano privados

Em **Perfil → Importar minha configuração**, cole o JSON fornecido em conversa privada. São aceitos `name`, `age`, `sex`, `height`, `weight`, `allergies`, `activity`, `foodPreferences`, `wheyNote` e `kcal`. A importação valida campos e preenche o perfil aberto; valores pessoais não são incluídos no código público.

O modelo aplicado contém quatro refeições: vitaminas no café da manhã e no lanche, e arroz/feijão/frango/legumes no almoço e jantar. As vitaminas ficam como orientações com rótulos pendentes até os valores reais de leite e whey serem informados. O total planejado é marcado **parcial**, sem inventar calorias do suplemento. A referência inicial é 2.150 kcal e 150 g de proteína, ajustável; não é cálculo automático de necessidades. Preservam-se consumos, medidas, presenças e cardápios por data. O plano padrão é substituído e as fichas opcionais com máquinas são adicionadas sem duplicar as já importadas.

A referência de hidratação desse modelo é **2.500 ml de líquidos**, com referência editável de **3.000 ml em dia de treino**. Leite pode ser registrado no controle de hidratação. Registrar um alimento não acrescenta seu volume automaticamente, evitando dupla contagem. O Perfil também permite contar somente água.

## Frequência mensal

**Hoje** e **Treinos → Histórico** contam datas distintas de presença. Um treino concluído conta automaticamente; **Fui à academia nesta data** registra presença manual. Duas sessões no mesmo dia ou uma presença manual junto de um treino valem um dia. O mês exibido segue a data selecionada. Não se pode registrar presença manual futura. Remover a presença manual não apaga a presença de um treino concluído; descartar uma sessão não registra presença.

## Verificação

- `npm test`: cálculos, backup, contagem única e configuração privada.
- `npm run test:profile`: perfil, plano, hidratação e presença em navegador.
- `npm run test:cloud`: SDK real com Auth/REST simulados; contas isoladas, dois contextos de navegador, senha incorreta, sessão, alterações offline e conflito. Não cria contas nem manda e-mails reais.
- `npm run test:cloud:sql`: executa o SQL em PostgreSQL via PGlite, com dois usuários, políticas de leitura, função de escrita, revisão atômica e acesso anônimo bloqueado.

A ativação e verificação no Supabase real dependem do SQL executado, da hospedagem HTTPS e das configurações de autenticação do projeto.
