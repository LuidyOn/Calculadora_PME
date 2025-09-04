document.addEventListener('DOMContentLoaded', () => {
    // Função para preencher a data de liberação com o dia de hoje
    function setInitialDate() {
        const liberacaoInput = document.getElementById('liberacao');
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        liberacaoInput.value = `${yyyy}-${mm}-${dd}`;
    }

    function setDefaultVencimento() {
        const vencimentoInput = document.getElementById('primeiroVencimento');
        const today = new Date();
        today.setMonth(today.getMonth() + 8);
        
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        vencimentoInput.value = `${yyyy}-${mm}-${dd}`;
    }

    // Lógica para Máscara de Valor no campo "Valor do Bem"
    const valorBemInput = document.getElementById('valorBem');
    function formatarValor(input) {
        let valor = input.value.replace(/\D/g, '');
        if (valor === '') { input.value = ''; return; }
        let numero = parseFloat(valor) / 100;
        input.value = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    valorBemInput.addEventListener('input', () => formatarValor(valorBemInput));

    // Funções e lista de feriados para cálculo de dias úteis
    const feriadosNacionais = [ "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21", "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25", "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25" ];
    function isDiaUtil(date) { const diaDaSemana = date.getDay(); if (diaDaSemana === 0 || diaDaSemana === 6) return false; const dataFormatada = date.toISOString().slice(0, 10); if (feriadosNacionais.includes(dataFormatada)) return false; return true; }
    function ajustarParaProximoDiaUtil(date) { let dataAjustada = new Date(date); while (!isDiaUtil(dataAjustada)) { dataAjustada.setDate(dataAjustada.getDate() + 1); } return dataAjustada; }
    
    // Lógica de cálculo e validação da carência
    function atualizarCarenciaEValidar() {
        const liberacaoInput = document.getElementById('liberacao'); const vencimentoInput = document.getElementById('primeiroVencimento'); const carenciaInput = document.getElementById('carencia'); const dataLiberacao = new Date(liberacaoInput.value + 'T00:00:00'); const dataPrimeiroVencimento = new Date(vencimentoInput.value + 'T00:00:00'); if (isNaN(dataLiberacao.getTime()) || isNaN(dataPrimeiroVencimento.getTime())) { carenciaInput.value = 0; return; } const mesesDiferenca = (dataPrimeiroVencimento.getFullYear() - dataLiberacao.getFullYear()) * 12 + (dataPrimeiroVencimento.getMonth() - dataLiberacao.getMonth()); carenciaInput.value = mesesDiferenca; if (mesesDiferenca > 14) { alert("A carência não pode exceder 14 meses. A data do primeiro vencimento será ajustada."); let dataMaxima = new Date(dataLiberacao); dataMaxima.setMonth(dataMaxima.getMonth() + 14); const yyyy = dataMaxima.getFullYear(); const mm = String(dataMaxima.getMonth() + 1).padStart(2, '0'); const dd = String(dataMaxima.getDate()).padStart(2, '0'); vencimentoInput.value = `${yyyy}-${mm}-${dd}`; carenciaInput.value = 14; vencimentoInput.dispatchEvent(new Event('input')); }
    }

    const inputs = document.querySelectorAll('#valorBem, #percEntrada, #parcelas, #taxaAA, #liberacao, #primeiroVencimento, #periodicidade');
    inputs.forEach(input => input.addEventListener('input', calcularTudo));

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDate = (date) => isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');

    function calcularTudo(event) {
        if (event && event.isTrusted === false) return;
        atualizarCarenciaEValidar();
        const valorBemStr = document.getElementById('valorBem').value.replace(/\./g, '').replace(',', '.');
        const valorBem = parseFloat(valorBemStr) || 0;
        const percEntrada = parseFloat(document.getElementById('percEntrada').value) || 0;
        const valorFinanciado = valorBem * ((100 - percEntrada) / 100);
        const numParcelas = parseInt(document.getElementById('parcelas').value) || 1;
        const taxaAA = parseFloat(document.getElementById('taxaAA').value) / 100 || 0;
        
        const cetAA = taxaAA;
        const cetAM = (Math.pow(1 + cetAA, 1/12) - 1);

        document.getElementById('cetAA').textContent = (cetAA * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        document.getElementById('cetAM').textContent = (cetAM * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        // --- FIM DA ALTERAÇÃO ---

        const dataLiberacao = new Date(document.getElementById('liberacao').value + 'T00:00:00');
        const dataPrimeiroVencimento = new Date(document.getElementById('primeiroVencimento').value + 'T00:00:00');
        const periodicidade = document.getElementById('periodicidade').value;
        const principalPorParcela = numParcelas > 0 ? valorFinanciado / numParcelas : 0;
        
        document.getElementById('valorFinanciado').textContent = formatCurrency(valorFinanciado);
        document.getElementById('parcelasPrincipal').textContent = numParcelas;
        document.getElementById('total-principal').textContent = formatCurrency(valorFinanciado);
        
        const tbody = document.getElementById('amortization-body');
        tbody.innerHTML = '';
        if (numParcelas <= 0 || isNaN(dataLiberacao.getTime()) || isNaN(dataPrimeiroVencimento.getTime()) || valorFinanciado <= 0) {
            document.getElementById('total-juros').textContent = formatCurrency(0);
            document.getElementById('total-geral').textContent = formatCurrency(0);
            return;
        }
        
        // O resto da lógica de cálculo da tabela permanece idêntico ao pronaf.js
        let saldoDevedor = valorFinanciado;
        let totalJuros = 0;
        let dataVencimentoAnterior = dataLiberacao;
        for (let i = 1; i <= numParcelas; i++) {
            let dataVencimentoCalculada;
            if (i === 1) { dataVencimentoCalculada = new Date(dataPrimeiroVencimento); } else {
                dataVencimentoCalculada = new Date(dataVencimentoAnterior);
                if (periodicidade === 'ANUAL') { dataVencimentoCalculada.setFullYear(dataVencimentoAnterior.getFullYear() + 1); }
                else if (periodicidade === 'SEMESTRAL') { dataVencimentoCalculada.setMonth(dataVencimentoAnterior.getMonth() + 6); }
                else { dataVencimentoCalculada.setMonth(dataVencimentoAnterior.getMonth() + 1); }
            }
            const dataVencimentoAtual = ajustarParaProximoDiaUtil(dataVencimentoCalculada);
            const diffTime = Math.abs(dataVencimentoAtual - dataVencimentoAnterior);
            const diasCorridos = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const juros = saldoDevedor * (taxaAA / 365) * diasCorridos;
            const totalParcela = principalPorParcela + juros;
            totalJuros += juros;
            const row = document.createElement('tr');
            row.innerHTML = `<td>${i}</td><td>${formatDate(dataVencimentoAtual)}</td><td>${diasCorridos}</td><td>${formatCurrency(saldoDevedor)}</td><td>${formatCurrency(juros)}</td><td>${formatCurrency(principalPorParcela)}</td><td>${formatCurrency(totalParcela)}</td>`;
            tbody.appendChild(row);
            saldoDevedor -= principalPorParcela;
            dataVencimentoAnterior = dataVencimentoAtual;
        }
        document.getElementById('total-juros').textContent = formatCurrency(totalJuros);
        document.getElementById('total-geral').textContent = formatCurrency(valorFinanciado + totalJuros);
    }
    
    setInitialDate();
    setDefaultVencimento();
    formatarValor(valorBemInput);
    calcularTudo();

    const btnGerarPdf = document.getElementById('btn-gerar-pdf');
    btnGerarPdf.addEventListener('click', async () => {
        const elementToCapture = document.getElementById('capture');
        const originalButtonText = btnGerarPdf.textContent;

        btnGerarPdf.textContent = 'Gerando...';
        btnGerarPdf.disabled = true;
        btnGerarPdf.style.display = 'none';

        // Bloco para lidar com a rolagem horizontal
        const tableWrapper = document.querySelector('.table-wrapper');
        const tableContainer = document.querySelector('.table-container');
        const originalWrapperOverflow = tableWrapper.style.overflowX;
        const originalContainerMinWidth = tableContainer.style.minWidth;
        tableWrapper.style.overflowX = 'visible';
        tableContainer.style.minWidth = 'auto';

        // Bloco para lidar com a rolagem vertical
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyHeight = document.body.style.height;
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';
        
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            // Verifica se a biblioteca PDF está carregada
            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                console.error("jsPDF não está carregado ou acessível.");
                alert("Erro ao carregar a funcionalidade de PDF.");
                return;
            }

            // <<< CORREÇÃO AQUI: A variável é declarada APENAS UMA VEZ
            const { jsPDF } = window.jspdf;

            const canvas = await html2canvas(elementToCapture, {
                scale: 2, useCORS: true, logging: false, scrollY: -window.scrollY
            });

            // A partir daqui, começa a lógica do PADDING que conversamos
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const margin = 10;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
            heightLeft -= (pageHeight - (margin * 2));

            while (heightLeft > 0) {
                position -= (pageHeight - margin);
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - (margin * 2));
            }
            
            pdf.save('simulacao_financiamento.pdf');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. No Brave, verifique se os 'Shields' estão desativados.");
        } finally {
            btnGerarPdf.textContent = originalButtonText;
            btnGerarPdf.disabled = false;
            btnGerarPdf.style.display = 'block';

            // Restaura estilos da tabela para o layout mobile
            tableWrapper.style.overflowX = originalWrapperOverflow;
            tableContainer.style.minWidth = originalContainerMinWidth;

            // Restaura estilos de rolagem vertical
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.height = originalBodyHeight;
        }
    });
});