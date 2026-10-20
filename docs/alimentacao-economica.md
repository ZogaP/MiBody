# Exemplo econômico de alimentação

Este modelo genérico é opcional e editável. Ele não é uma prescrição individual nem calcula necessidades pela altura, peso, idade ou objetivo. As quantidades foram escolhidas para compor um exemplo de quatro refeições. Uma orientação individual de nutricionista pode considerar necessidades, exames, alergias e rotina com mais precisão.

O exemplo resulta em aproximadamente **2.156 kcal, 134 g de proteínas, 272 g de carboidratos e 59 g de gorduras**. Marca, preparo e quantidade alteram esses valores.

| Refeição        | Alimentos do exemplo                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Café da manhã   | 100 g de ovo cozido sem casca (cerca de 2 ovos), 60 g de aveia em flocos e 100 g de banana-prata sem casca                                                  |
| Almoço          | 200 g de arroz cozido, 100 g de feijão cozido, 120 g de peito de frango cozido, 50 g de repolho cru, 100 g de tomate cru e 12 g de óleo no total do preparo |
| Lanche da tarde | 50 g de pão francês, 100 g de ovo cozido sem casca (cerca de 2 ovos) e 100 g de banana-prata sem casca                                                      |
| Jantar          | 200 g de arroz cozido, 100 g de feijão cozido, 100 g de peito de frango cozido, 50 g de repolho cru, 100 g de tomate cru e 12 g de óleo no total do preparo |

Os pesos de arroz, feijão e frango são **depois de cozinhar**. Aveia e salada usam os estados descritos. As medidas em unidades são aproximações; o cálculo usa gramas. O óleo listado já inclui o usado no preparo: não é uma quantidade para acrescentar por cima de uma refeição que já contém esse óleo.

## Economizar e adaptar

- Compare os preços locais de ovos, frango e proteína texturizada de soja. As porções não são nutricionalmente equivalentes: use o rótulo ao cadastrar uma substituição.
- Escolha frutas e vegetais da época e prepare porções para congelar. Não há preços estimados ou promessas de custo mínimo, porque variam conforme o local.
- Suplementos não são necessários para utilizar o exemplo.
- Verifique os rótulos e o contato cruzado conforme suas alergias. O app mantém suas anotações no aparelho, mas não verifica fornecedores ou cozinhas.
- Planejar uma refeição não registra consumo. No diário, registre apenas o que comeu, com a quantidade real.

## Fonte dos nutrientes

**NEPA–UNICAMP. Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição revisada e ampliada, 2011.** Os valores usados são por 100 g da parte comestível, para o estado de preparo especificado.

A seleção foi conferida a partir dos arquivos de referência e da transcrição mantidos pelo projeto público [raulfdm/taco-api](https://github.com/raulfdm/taco-api/tree/main/references). O projeto disponibiliza o PDF e a planilha originais obtidos da UNICAMP, além dos CSV de alimentos e nutrientes e das etapas de normalização. As referências foram consultadas em 20/10/2026.

IDs TACO incluídos: **3, 7, 53, 149, 157, 182, 272, 408, 488 e 561**. As colunas utilizadas são energia em kcal, proteínas, carboidratos, lipídios, fibras e sódio. Na transcrição, valores “Tr” são tratados como zero; células não aplicáveis para esses alimentos também foram representadas como zero no recorte. São estimativas de composição, não análise do alimento comprado pelo usuário.

Revisão consultada da transcrição: [`06e466ad2f3d76064b587808b1804564b2c40f67`](https://github.com/raulfdm/taco-api/tree/06e466ad2f3d76064b587808b1804564b2c40f67/references).

O sódio do sal e de outros temperos adicionados **não está incluído**. Não há conversão entre gramas, mililitros e unidades; os alimentos do exemplo usam somente referência em gramas.

## Opções para variar os dias

A aba **Opções de cardápio** acrescenta oito refeições principais e duas vitaminas, todas com quantidades editáveis. Arroz e feijão podem acompanhar frango grelhado com cenoura, beterraba, molho de tomate, batata ou batata-doce, ou ovos cozidos. As opções de macarrão usam carne moída de patinho ou frango grelhado com molho de tomate. As vitaminas combinam leite, whey e morango, com uma variante que acrescenta aveia.

Cada combinação tem seu próprio total; elas não são nutricionalmente equivalentes. O aplicativo não impõe metas, frequência de refeições ou rotação automática. A escolha de uma opção substitui apenas a refeição indicada no cardápio daquela data. O plano padrão e os dias já personalizados permanecem independentes. Copiar para outra data substitui o cardápio de destino, conforme o texto da confirmação; nenhum desses fluxos registra consumo.

Os nove alimentos adicionais foram extraídos da mesma revisão TACO citada acima, por 100 g:

| ID TACO | Referência | Estado de pesagem |
| --- | --- | --- |
| 40 | Macarrão de trigo | Seco, antes de cozinhar |
| 88 | Batata-doce | Cozida |
| 91 | Batata inglesa | Cozida |
| 97 | Beterraba | Cozida |
| 109 | Cenoura | Cozida |
| 159 | Molho de tomate industrializado | Pronto, média de composição |
| 239 | Morango | Cru, sem folhas |
| 376 | Patinho bovino sem gordura | Cru, antes de moer/cozinhar; referência para carne moída |
| 410 | Peito de frango sem pele | Grelhado |

Não se usa o peso de macarrão pronto com a composição da massa seca, nem o peso da carne pronta com a referência crua. O cozimento muda o peso conforme a água perdida/absorvida; não há conversão automática. O óleo listado representa o total de todas as preparações da refeição. A composição do molho comprado e da carne moída pode diferir da referência, especialmente em sódio e gordura.

**Leite e whey exigem cadastro do rótulo**, pois não há produto específico conhecido nem composição suposta de uma marca. O leite deve usar referência em ml, e o whey em g de pó. A quantidade inicial de 30 g de pó pode ser ajustada à porção do produto; não significa 30 g de proteína e não equivale necessariamente a um dosador. Os valores informados são salvos somente no catálogo local e reutilizados nas vitaminas. Fibras e sódio são campos opcionais do cadastro; quando omitidos, entram como zero na estimativa. Nenhum desses dados pessoais de cadastro integra o código público.
