# Calculadora PME

Portal web de simuladores de financiamento utilizado pelos colaboradores da PME como apoio em atendimentos, análises iniciais e apresentação do fluxo estimado das operações.

> Os resultados são projeções para apoio à simulação. As condições podem variar e estão sujeitas à análise e à aprovação do agente financeiro.

## Acessar o portal

**Aplicação publicada:** [luidyon.github.io/Calculadora_PME](https://luidyon.github.io/Calculadora_PME/index.html)

O portal reúne simuladores para as seguintes linhas:

- Pronaf;
- Moderfrota;
- TFBD Rural;
- CDC Construção;
- Finame + Inovação.

Cada simulador permite preencher os dados da operação, acompanhar a tabela de amortização e gerar um PDF da projeção. Em telas menores, a tabela pode ser arrastada horizontalmente para exibir todas as colunas.

## Tecnologias utilizadas

O projeto é intencionalmente leve e não exige framework ou etapa de compilação:

- **HTML5:** estrutura das páginas, formulários e tabelas dos simuladores;
- **CSS3:** identidade visual, componentes compartilhados, responsividade e rolagem horizontal das tabelas;
- **JavaScript puro (Vanilla JS):** cálculos, validações, menus, estados da interface e geração dos resultados;
- **PWA (Web App Manifest + Service Worker):** instalação na tela inicial e acesso aos arquivos essenciais mesmo sem conexão;
- **html2canvas + jsPDF:** captura da simulação e exportação do resultado em PDF;
- **GitHub Pages:** hospedagem estática da aplicação.

As bibliotecas usadas na exportação de PDF estão versionadas localmente em `vendor/`, permitindo que o portal continue independente de CDNs externas.

## Uso pelos colaboradores

A interface foi desenhada para ser direta e acessível a qualquer colaborador:

1. Selecione uma modalidade no menu superior.
2. Preencha os campos da operação.
3. Confira a projeção e o fluxo de pagamentos na tabela.
4. Em celular ou tablet, arraste a tabela para o lado para consultar as demais colunas.
5. Use **Gerar PDF** para salvar e compartilhar o resumo da simulação.

O portal também pode ser adicionado à tela inicial do celular. Depois que os arquivos forem preparados pelo navegador, as calculadoras permanecem disponíveis offline.

## Executar localmente

Como o projeto é estático, basta servi-lo por HTTP. A partir da pasta que contém o diretório `Calculadora_PME`, execute:

```bash
python -m http.server 8000
```

Depois, acesse:

```text
http://localhost:8000/Calculadora_PME/
```

O uso de um servidor local é recomendado para que o Service Worker e os caminhos da PWA se comportem de forma semelhante ao GitHub Pages.

## Estrutura do projeto

```text
Calculadora_PME/
├── index.html                 # Página inicial e acesso aos simuladores
├── HTMLs/                     # Páginas das linhas agrícolas e de construção
├── script/                    # Regras e interações de cada simulador
├── style/style.css            # Estilos compartilhados e responsivos
├── vendor/                    # Bibliotecas locais para exportação em PDF
├── img/, logos/ e icons/      # Recursos visuais
├── manifest.json              # Configuração de instalação da PWA
└── service-worker.js          # Cache e funcionamento offline
```

## Cuidados ao contribuir

As regras financeiras ficam nos arquivos JavaScript específicos de cada simulador. Antes de alterar fórmulas, taxas, carências, periodicidades ou datas, valide a mudança com os responsáveis pela regra de negócio.

Para mudanças visuais, priorize `style/style.css` e preserve IDs e classes usados pelos scripts. Antes de publicar, confira:

- cálculos e atualização automática dos resultados;
- abertura dos menus e troca entre simuladores;
- rolagem horizontal das tabelas no celular;
- geração do PDF;
- layout em desktop e mobile;
- versão exibida no portal e versão do cache no `service-worker.js`.

## Publicação

A aplicação é publicada como site estático pelo GitHub Pages. Após enviar as alterações para a branch configurada no repositório, aguarde a atualização do Pages e valide o endereço público informado acima.
