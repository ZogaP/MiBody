# MiBody

PWA pessoal em português do Brasil para treinos, alimentação e evolução corporal. Sem conta, backend, anúncios ou rastreadores. Os dados e fotos ficam no IndexedDB deste navegador.

## Interface

<img src="docs/tela-inicial.png" alt="Tela inicial do MiBody sem registros pessoais" width="320">

## Executar

Requer Node.js 20.19+ ou 22.12+ (validado com Node 24) e npm.

```sh
cd /workspace/MiBody
npm ci --cache /tmp/mibody-npm
npm run dev
```

Abra o endereço informado pelo Vite no navegador do computador. O modo de desenvolvimento não registra o service worker: para testar offline ou instalação, use o build de produção.

```sh
npm run build
npm run preview -- --port 4173
```

## Hospedar e instalar no celular

1. Execute `npm ci` e `npm run build`.
2. Publique **todo o conteúdo de `dist/`** em uma hospedagem estática com HTTPS. O build padrão usa a raiz do domínio; para um subdiretório, use `MIBODY_BASE=/MiBody/ npm run build`. Não é necessário servidor de aplicação nem variáveis secretas. Exemplos possíveis: GitHub Pages, Netlify ou Cloudflare Pages.
3. Configure `sw.js` e `index.html` para revalidação (`Cache-Control: no-cache`). Os arquivos com hash em `assets/` podem receber cache imutável. Não remova arquivos antigos durante uma sessão ativa; ao atualizar, feche todas as janelas do app e reabra para ativar o novo cache.
4. Abra o site no celular com internet e aguarde o primeiro carregamento completo.
5. Android/Chrome: menu → **Instalar aplicativo**. No Perfil, o botão aparece somente se o navegador emitir o evento de instalação.
6. iPhone/Safari: Compartilhar → **Adicionar à Tela de Início**. Não há botão programático de instalação no Safari.
7. Depois do primeiro carregamento em HTTPS, o app e os registros funcionam sem internet. Um endereço HTTP de rede local não oferece os mesmos recursos de instalação e service worker; `localhost` é uma exceção apenas para desenvolvimento.

### Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` está preparado para compilar, testar e publicar o projeto após um envio à branch `main`. Ele usa o caminho do repositório, como `/MiBody/`. O workflow só será executado no GitHub após o envio do código; preparar esses arquivos localmente não publica o aplicativo.

No repositório GitHub, em **Settings → Pages → Build and deployment**, escolha **GitHub Actions** como origem. Essa configuração exige acesso de administração e disponibilidade do Pages para o plano e a visibilidade do repositório. Depois, acompanhe o workflow em **Actions**. O endereço efetivo aparecerá no resultado da etapa de publicação. Não há um endereço ativo enquanto essa publicação não concluir.

Para validar localmente o mesmo caminho antes de publicar:

```sh
MIBODY_BASE=/MiBody/ npm run build
MIBODY_BASE=/MiBody/ npm run preview -- --port 4174
# Em outro terminal:
APP_URL=http://localhost:4174/MiBody/ npm run test:e2e
```

## Usar

- **Hoje:** escolha a data, acompanhe seu dia e registre alimento, água ou medidas.
- **Treinos:** crie uma ficha, adicione exercícios personalizados ou da biblioteca e associe dias da semana. Não há ficha prescrita automaticamente. Duplicar, editar, ordenar, arquivar e excluir preserva o histórico.
- **Sessão:** campos vazios mostram referências. Digite carga real (inclusive `0` para exercício sem peso) e repetições, e marque cada série. Carga × repetições só entra no volume se a série estiver concluída. Tempos e descanso usam timestamps e sobrevivem ao recarregamento; pausas são descontadas da duração ativa.
- **Alimentação:** cadastre nutrientes do rótulo por g, ml ou porção. O consumo usa a mesma unidade e é proporcional à referência. Cadastre receitas com ingredientes e rendimento em porções. O plano não entra no diário até você registrar o consumo. Registros mantêm uma cópia dos nutrientes de quando foram criados.
- **Evolução:** peso, medidas e fotos são opcionais. Gráficos, frequência, comparações e recordes usam somente registros reais.
- **Perfil:** edite metas, tema, descanso automático e o atalho de água. Metas não são prescritas pelo app.

## Dados e recuperação

Cada alteração de registros é gravada automaticamente no IndexedDB. Em caso de falha, uma faixa de erro permanece visível. Exporte um backup antes de sair caso isso aconteça. Não há sincronização entre celulares, entre navegadores ou entre o navegador e uma instalação que use outro espaço de armazenamento.

**Perfil → Backup completo (JSON)** exporta registros, fichas, alimentos, receitas, configurações, sessão em andamento e fotos. Guarde esse arquivo de forma privada: ele contém seus dados em texto e imagens, sem criptografia. **Restaurar backup** verifica a versão e a estrutura e pede confirmação antes de substituir os dados atuais. A versão aceita é `1`. O CSV inclui alimentos consumidos, séries, água e medidas; ele não substitui o backup completo.

Limpar dados do navegador ou trocar de aparelho pode apagar os registros locais. O pedido de armazenamento persistente depende do navegador e não dispensa backups. Fotos aceitam JPEG, PNG ou WebP até 8 MB por arquivo; backups até 100 MB. Nenhuma foto é enviada para análise externa.

## Validação

```sh
npm test
npm run build
# Em outro terminal, deixe npm run preview -- --port 4173 executando:
npm run test:e2e
```

O teste de navegador usa Chromium instalado em `/usr/bin/chromium`; outro caminho pode ser passado em `CHROMIUM_PATH`. Os testes usam um perfil temporário e não alteram seus dados pessoais. Capturas são geradas em `test-results/`, que não é versionado.

Os testes cobrem cálculos, validação de backup, snapshots do histórico, fluxo de treino, recuperação, relógio, alimentação, plano separado, backup/restauração, medidas, gravação offline e larguras móveis e desktop. A instalação e os alertas em Android/iPhone físicos ainda exigem validação nesses dispositivos.

## Limites explícitos

- Não há sincronização, login, base nutricional externa, leitor de código de barras, reconhecimento de foto ou prescrição de dieta/treinos.
- Descanso tenta emitir som/vibração apenas com o app aberto e suporte do navegador. Não há push, execução garantida em segundo plano nem alertas com o app fechado. Ao voltar ao app, o horário é recalculado.
- As séries registram repetições inteiras e carga em kg; exercícios cronometrados podem usar observações, mas não têm um campo próprio de duração da série.
- O app foi validado em Chromium. Compatibilidade de instalação e comportamentos específicos do Safari precisam de teste em dispositivo real.
- Hospedagem HTTPS e publicação não foram feitas pelo projeto.

## Organização

- `src/core.js`: cálculos, criação de sessões, datas, CSV e validação de backup.
- `src/db.js`: transações IndexedDB.
- `src/app.js`: telas, formulários, navegação e interações.
- `src/style.css`: temas, layout responsivo e acessibilidade visual.
- `vite.config.js`: build e geração do service worker com cache dos arquivos da versão.
- `public/`: manifesto e ícones locais.
- `tests/`: testes unitários e fluxos reais no navegador.
