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
        today.setMonth(today.getMonth() + 12);
        
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

    const inputs = document.querySelectorAll('#valorBem, #percEntrada, #parcelas, #taxaAA, #liberacao, #primeiroVencimento, #periodicidade'); // Adicionado #percEntrada
    inputs.forEach(input => input.addEventListener('input', calcularTudo));

    const formatCurrency = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');

    function calcularTudo(event) {
        if (event && event.isTrusted === false) return;
        atualizarCarenciaEValidar();
        const valorBemStr = document.getElementById('valorBem').value.replace(/\./g, '').replace(',', '.');
        const valorBem = parseFloat(valorBemStr) || 0;
        const percEntrada = parseFloat(document.getElementById('percEntrada').value) || 0;
        // Calcula o VALOR da entrada
        const valorEntrada = valorBem * (percEntrada / 100);
        // Calcula o VALOR FINANCIADO
        const valorFinanciado = valorBem - valorEntrada;
        const numParcelas = parseInt(document.getElementById('parcelas').value) || 1;
        const taxaAA = parseFloat(document.getElementById('taxaAA').value) / 100 || 0;
        
        const cetAA = taxaAA;
        const cetAM = (Math.pow(1 + cetAA, 1/12) - 1);

        document.getElementById('cetAA').value = (cetAA * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        document.getElementById('cetAM').value = (cetAM * 100).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
        // --- FIM DA ALTERAÇÃO ---

        const dataLiberacao = new Date(document.getElementById('liberacao').value + 'T00:00:00');
        const dataPrimeiroVencimento = new Date(document.getElementById('primeiroVencimento').value + 'T00:00:00');
        const periodicidade = document.getElementById('periodicidade').value;
        const principalPorParcela = numParcelas > 0 ? valorFinanciado / numParcelas : 0;
        
        // Atualiza os campos na tela (usando .value para os inputs readonly)
        document.getElementById('valorEntrada').value = formatCurrency(valorEntrada); // Atualiza o novo campo
        document.getElementById('valorFinanciado').value = formatCurrency(valorFinanciado);
        document.getElementById('parcelasPrincipal').value = numParcelas;
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

    // LÓGICA ATUALIZADA PARA O FLUXO DE PDF COM MODAL
    // LÓGICA FINAL E COMPLETA PARA O FLUXO DE PDF COM MODAL
    const btnGerarPdf = document.getElementById('btn-gerar-pdf');
    const modalOverlay = document.getElementById('pdf-modal-overlay');
    const btnCancelPdf = document.getElementById('btn-cancel-pdf');
    const btnConfirmPdf = document.getElementById('btn-confirm-pdf');

    // O botão principal da página agora só abre a janela (modal)
    btnGerarPdf.addEventListener('click', () => {
        modalOverlay.classList.add('show');
    });

    // O botão de cancelar na janela fecha a janela
    btnCancelPdf.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
    });

    // Clicar no fundo escuro também fecha a janela
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            modalOverlay.classList.remove('show');
        }
    });

    // O botão de confirmar na janela valida os nomes e chama a função para gerar o PDF
    btnConfirmPdf.addEventListener('click', () => {
        const vendedorName = document.getElementById('vendedor-name').value;
        const clienteName = document.getElementById('cliente-name').value;

        if (!vendedorName || !clienteName) {
            alert('Por favor, preencha ambos os nomes para continuar.');
            return;
        }
        
        // Fecha a janela e inicia a geração do PDF
        modalOverlay.classList.remove('show');
        generatePdf(vendedorName, clienteName);
    });


    /**
     * Esta é a função completa que faz todo o trabalho de gerar o PDF.
     * O bloco try/catch/finally está aqui dentro.
     */

    // A função de gerar PDF inteira, com as correções
    async function generatePdf(vendedor, cliente) {
        const originalElement = document.getElementById('capture');
        const btnGerarPdf = document.getElementById('btn-gerar-pdf'); // Pega o botão original
        const originalButtonText = btnGerarPdf.textContent;

        btnGerarPdf.textContent = 'Gerando...';
        btnGerarPdf.disabled = true;
        
        // PASSO 1: Clonar o elemento
        const clone = originalElement.cloneNode(true);

        // <<< CORREÇÃO DO BOTÃO: Encontra o container de ações DENTRO do clone e o esconde
        const clonedActionsDiv = clone.querySelector('.actions');
        if (clonedActionsDiv) {
            clonedActionsDiv.style.display = 'none';
        }

        // Adiciona as informações do vendedor/cliente no cabeçalho do clone
        const header = clone.querySelector('header');
        if (header) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'pdf-info';
            infoDiv.innerHTML = `
                <p><strong>Vendedor:</strong> ${vendedor}</p>
                <p><strong>Cliente:</strong> ${cliente}</p>
                <p><strong>Data da Simulação:</strong> ${new Date().toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</p>
            `;
            header.appendChild(infoDiv);
        }
        
        // PASSO 2: Criar o container de impressão fora da tela
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '0';
        printContainer.style.top = '-9999px';
        printContainer.style.width = '1200px';
        printContainer.classList.add('pdf-compact-mode');
        
        printContainer.appendChild(clone);
        document.body.appendChild(printContainer);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            // <<< CORREÇÃO DAS OBSERVAÇÕES: Força a renderização do elemento
            const obsClone = clone.querySelector('.observations');
            if (obsClone) {
                // Um truque para forçar o navegador a calcular os estilos do elemento
                window.getComputedStyle(obsClone).opacity;
            }

            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                console.error("jsPDF não está carregado ou acessível.");
                alert("Erro ao carregar a funcionalidade de PDF.");
                return;
            }
            const { jsPDF } = window.jspdf;

            // PASSO 3: Capturar o CLONE
            const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
            
            // PASSO 4: Recortar o canvas
            const scale = 2;
            const contentWidth = (clone.offsetWidth + 20) * scale;
            const contentHeight = canvas.height;
            const destinationCanvas = document.createElement('canvas');
            destinationCanvas.width = contentWidth;
            destinationCanvas.height = contentHeight;
            const ctx = destinationCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);
            
            const imgData = destinationCanvas.toDataURL('image/png');
            
            // PASSO 5: Adicionar a imagem recortada e consistente ao PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const margin = 10;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (destinationCanvas.height * imgWidth) / destinationCanvas.width;
            const xOffset = margin;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', xOffset, margin, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin);

            while (heightLeft > 0) {
                position -= (pageHeight - (margin * 2));
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save('simulacao_financiamento.pdf');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            // PASSO 6: Limpeza
            document.body.removeChild(printContainer);
            btnGerarPdf.textContent = originalButtonText; // Usa a variável salva no início
            btnGerarPdf.disabled = false;
        }
    }
    
        // --- NOVO: LÓGICA PARA O MENU DROPDOWN FUNCIONAR EM TODOS OS DISPOSITIVOS ---
    const calculatorSelector = document.querySelector('.calculator-selector');
    const calculatorDropdown = document.querySelector('.calculator-dropdown');

    if (calculatorSelector) {
    calculatorSelector.addEventListener('click', (event) => {
        // Impede que o clique no botão feche o menu imediatamente (ver listener do window)
        event.stopPropagation(); 
        // Adiciona ou remove a classe 'show' para exibir/ocultar o menu
        calculatorDropdown.classList.toggle('show');
    });
    }

    // Opcional, mas recomendado: Fecha o menu se o usuário clicar fora dele
    window.addEventListener('click', (event) => {
        if (calculatorDropdown && calculatorDropdown.classList.contains('show')) {
            // Se o clique não foi dentro do seletor, fecha o menu
            if (!calculatorSelector.contains(event.target)) {
                calculatorDropdown.classList.remove('show');
            }
        }
    });
});

// --- REGISTRA O SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Calculadora_PME/service-worker.js', { scope: '/Calculadora_PME/' })
    .then(registration => {
        console.log('Service Worker registrado com sucesso no escopo:', registration.scope);
    })
    .catch(error => {
        console.error('Falha ao registrar o Service Worker:', error);
    });
  });
} else {
    console.warn('Service Worker não é suportado neste navegador.');
}
