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
