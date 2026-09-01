/*
 * Gerador do documento PDF das simulações (versão vetorial).
 *
 * Substitui a antiga captura de tela (html2canvas): o documento agora é
 * desenhado direto no jsPDF com texto nativo — nítido, leve, com quebra de
 * página por linha e cabeçalho da tabela repetido em cada página.
 *
 * O módulo NÃO recalcula nada: ele lê os valores já exibidos na página
 * (formulário, observações e tabela de amortização), garantindo que o PDF
 * mostra exatamente o que o usuário está vendo.
 *
 * Uso: window.PmePdfDocumento.gerar({ vendedor, cliente, dataSimulacao,
 *      codigoSimulacao, nomeArquivo, salvar })
 */
(function () {
    'use strict';

    // --- Identidade visual ---
    var AZUL_ESCURO = [8, 47, 87];      // #082f57
    var AZUL = [7, 82, 154];            // #07529a
    var AZUL_TABELA = [10, 71, 127];    // #0a477f
    var AMARELO = [246, 201, 0];        // #f6c900
    var TEXTO = [40, 60, 80];
    var TEXTO_SUAVE = [82, 106, 128];   // #526a80
    var LABEL = [107, 124, 141];
    var LINHA = [222, 231, 240];
    var ZEBRA = [245, 248, 251];
    var FUNDO_CAIXA = [238, 243, 248];  // #eef3f8
    var BRANCO = [255, 255, 255];

    // --- Geometria (A4 retrato, mm) ---
    var PAG_L = 210;
    var PAG_A = 297;
    var MARGEM = 14;
    var UTIL = PAG_L - MARGEM * 2;
    var RODAPE_Y = 285;      // linha do rodapé
    var LIMITE_Y = 278;      // último y utilizável para conteúdo

    // jsPDF (fontes padrão) só cobre Latin-1: troca o que dá para
    // equivalentes e descarta o resto para nunca imprimir lixo.
    function sanitizar(texto) {
        return String(texto == null ? '' : texto)
            .replace(/→|↔|▾|▴|⇄/g, '') // setas / triângulos de UI
            .replace(/[‘’]/g, "'")
            .replace(/[“”]/g, '"')
            .replace(/–|—/g, '-')
            .replace(/…/g, '...')
            .replace(/[^\x00-\xFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function texto(el) {
        return el ? sanitizar(el.textContent) : '';
    }

    function formatarData(iso) {
        var partes = String(iso).split('-');
        if (partes.length !== 3) return sanitizar(iso);
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    // Valor exibido de um .form-group / .form-group-inline
    function valorDoCampo(grupo) {
        var select = grupo.querySelector('select');
        if (select) {
            var opt = select.selectedOptions && select.selectedOptions[0];
            return sanitizar(opt ? opt.text : select.value);
        }
        var input = grupo.querySelector('input');
        if (input) {
            if (input.type === 'date') return input.value ? formatarData(input.value) : '';
            return sanitizar(input.value);
        }
        // spans de campos read-only (ignora o <span> do rótulo, se houver)
        var spans = grupo.querySelectorAll('span');
        for (var i = spans.length - 1; i >= 0; i--) {
            var t = sanitizar(spans[i].textContent);
            if (t) return t;
        }
        return '';
    }

    function labelDoCampo(grupo) {
        var label = grupo.querySelector('label');
        return sanitizar(label ? label.textContent : '').replace(/:$/, '');
    }

    // --- Coleta tudo o que está na tela ---
    function coletarDados() {
        var dados = { colunas: [[], []], extras: [], observacoes: [], resumo: [], thead: [], linhas: [], tfoot: [] };

        var colunas = document.querySelectorAll('.form-grid .form-column');
        for (var c = 0; c < colunas.length && c < 2; c++) {
            var grupos = colunas[c].querySelectorAll('.form-group');
            for (var g = 0; g < grupos.length; g++) {
                var rotulo = labelDoCampo(grupos[g]);
                if (rotulo) dados.colunas[c].push({ label: rotulo, valor: valorDoCampo(grupos[g]) });
            }
        }

        var extras = document.querySelectorAll('.form-row .form-group, .form-row .form-group-inline');
        for (var e = 0; e < extras.length; e++) {
            var rotuloExtra = labelDoCampo(extras[e]);
            if (rotuloExtra) dados.extras.push({ label: rotuloExtra, valor: valorDoCampo(extras[e]) });
        }

        var itens = document.querySelectorAll('.observations ul li');
        for (var o = 0; o < itens.length; o++) {
            var obs = texto(itens[o]);
            if (obs) dados.observacoes.push(obs);
        }

        var resumoPares = [
            ['Parcelas', 'footer-num-parcelas'],
            ['Valor financiado', 'footer-valor-financiado'],
            ['Total a pagar', 'footer-total-geral']
        ];
        for (var r = 0; r < resumoPares.length; r++) {
            var elResumo = document.getElementById(resumoPares[r][1]);
            if (elResumo) dados.resumo.push({ label: resumoPares[r][0], valor: texto(elResumo) });
        }

        var ths = document.querySelectorAll('.table-wrapper thead th');
        for (var h = 0; h < ths.length; h++) dados.thead.push(texto(ths[h]));

        var trs = document.querySelectorAll('#amortization-body tr');
        for (var i = 0; i < trs.length; i++) {
            var tds = trs[i].querySelectorAll('td');
            var linha = [];
            for (var j = 0; j < tds.length; j++) linha.push(texto(tds[j]));
            dados.linhas.push(linha);
        }

        var footTrs = document.querySelectorAll('#amortization-foot tr');
        for (var f = 0; f < footTrs.length; f++) {
            var footTds = footTrs[f].querySelectorAll('td');
            var cels = [];
            for (var k = 0; k < footTds.length; k++) {
                var bruto = texto(footTds[k]);
                if (/TOTAL/i.test(bruto)) bruto = 'TOTAL';
                cels.push({ texto: bruto, colspan: parseInt(footTds[k].getAttribute('colspan') || '1', 10) || 1 });
            }
            if (cels.length) dados.tfoot.push(cels);
        }

        var tituloEl = document.getElementById('current-calculator');
        dados.tituloSimulador = tituloEl ? texto(tituloEl) : 'Simulador';

        return dados;
    }

    // Logo da página convertida em dataURL (mesma técnica do fluxo antigo).
    // Redimensiona para no máx. 600px e exporta JPEG sobre fundo branco:
    // o cabeçalho do documento é branco e o arquivo fica muito menor.
    function obterLogo() {
        var img = document.querySelector('.logo-image');
        if (!img || !img.complete || !img.naturalWidth) return null;
        try {
            var escala = Math.min(1, 600 / img.naturalWidth);
            var canvas = document.createElement('canvas');
            canvas.width = Math.round(img.naturalWidth * escala);
            canvas.height = Math.round(img.naturalHeight * escala);
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return { dataUrl: canvas.toDataURL('image/jpeg', 0.9), formato: 'JPEG', proporcao: img.naturalWidth / img.naturalHeight };
        } catch (err) {
            console.warn('PDF: logo indisponível, seguindo sem imagem.', err);
            return null;
        }
    }

    // --- Primitivas de desenho ---
    function cor(pdf, metodo, rgb) {
        pdf[metodo](rgb[0], rgb[1], rgb[2]);
    }

    function truncar(pdf, str, larguraMax) {
        if (pdf.getTextWidth(str) <= larguraMax) return str;
        var t = str;
        while (t.length > 1 && pdf.getTextWidth(t + '...') > larguraMax) t = t.slice(0, -1);
        return t + '...';
    }

    function tituloSecao(pdf, y, titulo) {
        cor(pdf, 'setFillColor', AMARELO);
        pdf.rect(MARGEM, y - 2.6, 1.4, 3.4, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        cor(pdf, 'setTextColor', AZUL_ESCURO);
        pdf.text(titulo, MARGEM + 3.4, y);
        cor(pdf, 'setDrawColor', LINHA);
        pdf.setLineWidth(0.25);
        pdf.line(MARGEM, y + 1.8, PAG_L - MARGEM, y + 1.8);
        return y + 6.4;
    }

    // Alinhamento espelhando o CSS do site: 3ª coluna centro, 4ª+ direita
    function alinhamentoColuna(indice) {
        if (indice === 2) return 'center';
        if (indice >= 3) return 'right';
        return 'left';
    }

    function xTexto(x0, largura, alin, respiro) {
        if (alin === 'right') return { x: x0 + largura - respiro, opt: { align: 'right' } };
        if (alin === 'center') return { x: x0 + largura / 2, opt: { align: 'center' } };
        return { x: x0 + respiro, opt: {} };
    }

    // Larguras das colunas medidas pelo conteúdo real
    function calcularColunas(pdf, thead, linhas, tfoot) {
        var n = thead.length;
        var fonte = 7.6;
        var larguras = [];

        while (true) {
            larguras = [];
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(fonte - 0.4);
            for (var i = 0; i < n; i++) larguras.push(pdf.getTextWidth(thead[i]));

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fonte);
            for (var l = 0; l < linhas.length; l++) {
                for (var c = 0; c < n && c < linhas[l].length; c++) {
                    var w = pdf.getTextWidth(linhas[l][c]);
                    if (w > larguras[c]) larguras[c] = w;
                }
            }
            pdf.setFont('helvetica', 'bold');
            for (var f = 0; f < tfoot.length; f++) {
                var col = 0;
                for (var k = 0; k < tfoot[f].length; k++) {
                    var cel = tfoot[f][k];
                    if (cel.colspan === 1 && col < n) {
                        var wf = pdf.getTextWidth(cel.texto);
                        if (wf > larguras[col]) larguras[col] = wf;
                    }
                    col += cel.colspan;
                }
            }

            var soma = 0;
            for (var s = 0; s < n; s++) { larguras[s] += 3.6; soma += larguras[s]; }

            if (soma <= UTIL) {
                // estica proporcionalmente para ocupar a largura toda
                var extra = (UTIL - soma) / n;
                for (var e = 0; e < n; e++) larguras[e] += extra;
                return { larguras: larguras, fonte: fonte };
            }
            if (fonte <= 6.1) {
                var escala = UTIL / soma;
                for (var e2 = 0; e2 < n; e2++) larguras[e2] *= escala;
                return { larguras: larguras, fonte: fonte };
            }
            fonte -= 0.25;
        }
    }

    function desenharCabecalhoTabela(pdf, y, thead, cols) {
        var altura = 7;
        cor(pdf, 'setFillColor', AMARELO);
        pdf.rect(MARGEM, y - 0.8, UTIL, 0.8, 'F');
        cor(pdf, 'setFillColor', AZUL_TABELA);
        pdf.rect(MARGEM, y, UTIL, altura, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(cols.fonte - 0.4);
        cor(pdf, 'setTextColor', BRANCO);

        var x = MARGEM;
        for (var i = 0; i < thead.length; i++) {
            var pos = xTexto(x, cols.larguras[i], alinhamentoColuna(i), 1.8);
            pdf.text(thead[i], pos.x, y + altura / 2 + 1.1, pos.opt);
            x += cols.larguras[i];
        }
        return y + altura;
    }

    // --- Documento ---
    function montarDocumento(opcoes) {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            throw new Error('jsPDF não carregado.');
        }
        var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        var dados = coletarDados();
        var logo = obterLogo();

        var dataTexto = opcoes.dataSimulacao.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        var y;

        function miniCabecalho() {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7.5);
            cor(pdf, 'setTextColor', AZUL);
            pdf.text('SIMULAÇÃO DE FINANCIAMENTO - ' + dados.tituloSimulador.toUpperCase(), MARGEM, 13);
            pdf.setFont('helvetica', 'normal');
            cor(pdf, 'setTextColor', LABEL);
            pdf.text('Código ' + opcoes.codigoSimulacao, PAG_L - MARGEM, 13, { align: 'right' });
            cor(pdf, 'setDrawColor', LINHA);
            pdf.setLineWidth(0.25);
            pdf.line(MARGEM, 15.2, PAG_L - MARGEM, 15.2);
            return 21;
        }

        function novaPagina() {
            pdf.addPage();
            y = miniCabecalho();
        }

        function garantirEspaco(altura) {
            if (y + altura > LIMITE_Y) novaPagina();
        }

        // ===== Cabeçalho principal =====
        y = 16;
        if (logo) {
            var altLogo = 11;
            var largLogo = altLogo * logo.proporcao;
            if (largLogo > 46) { largLogo = 46; altLogo = largLogo / logo.proporcao; }
            pdf.addImage(logo.dataUrl, logo.formato, MARGEM, y - altLogo / 2 + 1.5, largLogo, altLogo);
        } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(15);
            cor(pdf, 'setTextColor', AZUL_ESCURO);
            pdf.text('PME Máquinas', MARGEM, y + 3);
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13.5);
        cor(pdf, 'setTextColor', AZUL_ESCURO);
        pdf.text('SIMULAÇÃO DE FINANCIAMENTO', PAG_L - MARGEM, y, { align: 'right' });
        pdf.setFontSize(9.5);
        cor(pdf, 'setTextColor', AZUL);
        pdf.text(dados.tituloSimulador, PAG_L - MARGEM, y + 5.6, { align: 'right' });

        y += 10.5;
        cor(pdf, 'setDrawColor', AZUL_ESCURO);
        pdf.setLineWidth(0.5);
        pdf.line(MARGEM, y, PAG_L - MARGEM, y);
        cor(pdf, 'setFillColor', AMARELO);
        pdf.rect(MARGEM, y - 0.1, 34, 1.1, 'F');
        y += 6;

        // ===== Identificação =====
        var alturaId = 15;
        cor(pdf, 'setFillColor', FUNDO_CAIXA);
        pdf.roundedRect(MARGEM, y, UTIL, alturaId, 1.6, 1.6, 'F');

        // Larguras assimétricas: nomes precisam de mais espaço que data/código
        var camposId = [
            ['VENDEDOR', sanitizar(opcoes.vendedor), 0.30],
            ['CLIENTE', sanitizar(opcoes.cliente), 0.30],
            ['DATA DA SIMULAÇÃO', dataTexto, 0.17],
            ['CÓDIGO DA SIMULAÇÃO', String(opcoes.codigoSimulacao), 0.23]
        ];
        var xi = MARGEM + 4;
        for (var ci = 0; ci < camposId.length; ci++) {
            var largId = UTIL * camposId[ci][2];
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(5.9);
            cor(pdf, 'setTextColor', LABEL);
            pdf.text(camposId[ci][0], xi, y + 5.4);
            pdf.setFontSize(8.3);
            cor(pdf, 'setTextColor', AZUL_ESCURO);
            pdf.text(truncar(pdf, camposId[ci][1], largId - 6), xi, y + 10.6);
            xi += largId;
        }
        y += alturaId + 7;

        // ===== Dados da simulação =====
        y = tituloSecao(pdf, y, 'DADOS DA SIMULAÇÃO');

        var esq = dados.colunas[0], dir = dados.colunas[1];
        var linhasGrid = Math.max(esq.length, dir.length);
        var altItem = 8.6;
        var largMeia = UTIL / 2 - 4;

        function itemDado(x, yTopo, campo, larguraCampo) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(6);
            cor(pdf, 'setTextColor', LABEL);
            pdf.text(truncar(pdf, campo.label.toUpperCase(), larguraCampo), x, yTopo + 3);
            pdf.setFontSize(8.6);
            cor(pdf, 'setTextColor', TEXTO);
            pdf.text(truncar(pdf, campo.valor || '-', larguraCampo), x, yTopo + 6.9);
            cor(pdf, 'setDrawColor', LINHA);
            pdf.setLineWidth(0.2);
            pdf.line(x, yTopo + altItem - 0.4, x + larguraCampo, yTopo + altItem - 0.4);
        }

        for (var li = 0; li < linhasGrid; li++) {
            garantirEspaco(altItem);
            if (esq[li]) itemDado(MARGEM, y, esq[li], largMeia);
            if (dir[li]) itemDado(MARGEM + UTIL / 2 + 4, y, dir[li], largMeia);
            y += altItem;
        }

        if (dados.extras.length) {
            garantirEspaco(altItem);
            var largExtra = UTIL / dados.extras.length;
            for (var ex = 0; ex < dados.extras.length; ex++) {
                itemDado(MARGEM + largExtra * ex + (ex ? 4 : 0), y, dados.extras[ex], largExtra - 6);
            }
            y += altItem;
        }
        y += 4;

        // ===== Resumo em destaque =====
        if (dados.resumo.length === 3) {
            garantirEspaco(17);
            var largCartao = (UTIL - 8) / 3;
            for (var rc = 0; rc < 3; rc++) {
                var xc = MARGEM + rc * (largCartao + 4);
                cor(pdf, 'setFillColor', rc === 2 ? AZUL_ESCURO : FUNDO_CAIXA);
                pdf.roundedRect(xc, y, largCartao, 13, 1.6, 1.6, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(5.9);
                cor(pdf, 'setTextColor', rc === 2 ? [173, 196, 220] : LABEL);
                pdf.text(dados.resumo[rc].label.toUpperCase(), xc + 4, y + 4.7);
                pdf.setFontSize(9.6);
                cor(pdf, 'setTextColor', rc === 2 ? BRANCO : AZUL_ESCURO);
                pdf.text(truncar(pdf, dados.resumo[rc].valor, largCartao - 8), xc + 4, y + 9.8);
            }
            y += 13 + 7;
        }

        // ===== Fluxo de pagamento =====
        if (dados.thead.length && dados.linhas.length) {
            garantirEspaco(30);
            y = tituloSecao(pdf, y, 'FLUXO DE PAGAMENTO');

            var cols = calcularColunas(pdf, dados.thead, dados.linhas, dados.tfoot);
            var altLinha = Math.max(5, cols.fonte * 0.72);

            y = desenharCabecalhoTabela(pdf, y, dados.thead, cols);

            for (var ln = 0; ln < dados.linhas.length; ln++) {
                if (y + altLinha > LIMITE_Y) {
                    novaPagina();
                    y = desenharCabecalhoTabela(pdf, y, dados.thead, cols);
                }
                if (ln % 2 === 1) {
                    cor(pdf, 'setFillColor', ZEBRA);
                    pdf.rect(MARGEM, y, UTIL, altLinha, 'F');
                }
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(cols.fonte);
                cor(pdf, 'setTextColor', TEXTO);

                var xl = MARGEM;
                for (var cl = 0; cl < dados.thead.length; cl++) {
                    var valorCel = dados.linhas[ln][cl] || '';
                    var posC = xTexto(xl, cols.larguras[cl], alinhamentoColuna(cl), 1.8);
                    pdf.text(valorCel, posC.x, y + altLinha / 2 + cols.fonte * 0.123, posC.opt);
                    xl += cols.larguras[cl];
                }
                cor(pdf, 'setDrawColor', LINHA);
                pdf.setLineWidth(0.15);
                pdf.line(MARGEM, y + altLinha, MARGEM + UTIL, y + altLinha);
                y += altLinha;
            }

            // Linha de totais
            for (var tf = 0; tf < dados.tfoot.length; tf++) {
                var altTotal = 7.4;
                if (y + altTotal > LIMITE_Y) {
                    novaPagina();
                    y = desenharCabecalhoTabela(pdf, y, dados.thead, cols);
                }
                cor(pdf, 'setFillColor', AZUL_ESCURO);
                pdf.rect(MARGEM, y, UTIL, altTotal, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(cols.fonte);
                cor(pdf, 'setTextColor', BRANCO);

                var xt = MARGEM;
                var colAtual = 0;
                for (var ct = 0; ct < dados.tfoot[tf].length; ct++) {
                    var celT = dados.tfoot[tf][ct];
                    var largCel = 0;
                    for (var sp = 0; sp < celT.colspan && colAtual + sp < cols.larguras.length; sp++) {
                        largCel += cols.larguras[colAtual + sp];
                    }
                    var alinT = celT.colspan > 1 ? 'left' : alinhamentoColuna(colAtual);
                    var posT = xTexto(xt, largCel, alinT, 1.8);
                    pdf.text(celT.texto, posT.x, y + altTotal / 2 + 1.1, posT.opt);
                    xt += largCel;
                    colAtual += celT.colspan;
                }
                y += altTotal;
            }
            y += 7;
        }

        // ===== Observações =====
        if (dados.observacoes.length) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.6);
            var linhasObs = [];
            for (var ob = 0; ob < dados.observacoes.length; ob++) {
                var quebradas = pdf.splitTextToSize(dados.observacoes[ob], UTIL - 12);
                linhasObs.push(quebradas);
            }
            var altObs = 8;
            for (var lo = 0; lo < linhasObs.length; lo++) altObs += linhasObs[lo].length * 3 + 1.4;

            garantirEspaco(altObs);
            cor(pdf, 'setFillColor', [248, 250, 252]);
            pdf.roundedRect(MARGEM, y, UTIL, altObs, 1.6, 1.6, 'F');
            cor(pdf, 'setFillColor', AMARELO);
            pdf.rect(MARGEM, y + 1.6, 1.1, altObs - 3.2, 'F');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(6.8);
            cor(pdf, 'setTextColor', AZUL_ESCURO);
            pdf.text('OBSERVAÇÕES', MARGEM + 5, y + 4.6);

            var yObs = y + 8.6;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.6);
            cor(pdf, 'setTextColor', TEXTO_SUAVE);
            for (var io = 0; io < linhasObs.length; io++) {
                cor(pdf, 'setFillColor', AZUL);
                pdf.circle(MARGEM + 6, yObs - 0.8, 0.55, 'F');
                pdf.text(linhasObs[io], MARGEM + 8.6, yObs);
                yObs += linhasObs[io].length * 3 + 1.4;
            }
            y += altObs + 5;
        }

        // ===== Rodapé em todas as páginas =====
        var totalPaginas = pdf.getNumberOfPages();
        for (var p = 1; p <= totalPaginas; p++) {
            pdf.setPage(p);
            cor(pdf, 'setDrawColor', LINHA);
            pdf.setLineWidth(0.25);
            pdf.line(MARGEM, RODAPE_Y - 3.4, PAG_L - MARGEM, RODAPE_Y - 3.4);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.2);
            cor(pdf, 'setTextColor', LABEL);
            pdf.text('PME Máquinas - Simulação de Financiamento', MARGEM, RODAPE_Y);
            pdf.text('Gerado em ' + dataTexto + '  -  Código ' + opcoes.codigoSimulacao, PAG_L / 2, RODAPE_Y, { align: 'center' });
            pdf.text('Página ' + p + ' de ' + totalPaginas, PAG_L - MARGEM, RODAPE_Y, { align: 'right' });
        }

        return pdf;
    }

    window.PmePdfDocumento = {
        gerar: function (opcoes) {
            return new Promise(function (resolve, reject) {
                // setTimeout dá tempo do navegador atualizar o botão "Gerando..."
                setTimeout(function () {
                    try {
                        var pdf = montarDocumento(opcoes);
                        if (opcoes.salvar !== false) pdf.save(opcoes.nomeArquivo || 'simulacao.pdf');
                        resolve(pdf);
                    } catch (err) {
                        reject(err);
                    }
                }, 60);
            });
        }
    };
})();
