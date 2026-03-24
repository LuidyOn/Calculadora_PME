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

    // --- NOVO: TRAVA DE 15% PARA MODERFROTA ---
    const percEntradaInput = document.getElementById('percEntrada');
    if (percEntradaInput) {
        percEntradaInput.value = 15;
    }
    percEntradaInput.addEventListener('change', () => {
        let valor = parseFloat(percEntradaInput.value) || 0;
        if (valor < 15) {
            alert("Para Moderfrota, a entrada mínima obrigatória é de 15%.");
            percEntradaInput.value = 15;
            calcularTudo(); // Força o recálculo
        }
    });

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

function atualizarResumoInferior() {
    const footerNumParcelas = document.getElementById('footer-num-parcelas');
    const footerValorFinanciado = document.getElementById('footer-valor-financiado');
    const footerTotalGeral = document.getElementById('footer-total-geral');
    const parcelasInput = document.getElementById('parcelas');
    const valorFinanciadoInput = document.getElementById('valorFinanciado');
    const totalGeralCell = document.getElementById('total-geral');

    if (footerNumParcelas && parcelasInput) {
        footerNumParcelas.textContent = parcelasInput.value || '0';
    }

    if (footerValorFinanciado && valorFinanciadoInput) {
        footerValorFinanciado.textContent = valorFinanciadoInput.value || 'R$ 0,00';
    }

    if (footerTotalGeral && totalGeralCell) {
        footerTotalGeral.textContent = totalGeralCell.textContent || 'R$ 0,00';
    }
}

function camposObrigatoriosPreenchidos() {
    const campos = Array.from(document.querySelectorAll('#loan-form input, #loan-form select'))
        .filter(campo => !campo.readOnly && !campo.disabled && campo.type !== 'button' && campo.type !== 'submit');

    return campos.every(campo => String(campo.value).trim() !== '');
}

function atualizarDisponibilidadePdf() {
    const chip = document.getElementById('pdf-status-chip');
    const chipText = document.getElementById('pdf-status-text');
    const btnGerarPdf = document.getElementById('btn-gerar-pdf');
    const disponivel = camposObrigatoriosPreenchidos();

    if (chip && chipText) {
        chip.classList.toggle('ready', disponivel);
        chip.classList.toggle('pending', !disponivel);
        chipText.textContent = disponivel ? 'PDF disponível' : 'Preencha os campos obrigatórios';
    }

    if (btnGerarPdf) {
        btnGerarPdf.disabled = !disponivel;
    }
}

function configurarMenusDaPagina() {
    const calculatorSelector = document.querySelector('.calculator-selector');
    const calculatorDropdown = document.querySelector('.calculator-dropdown');
    const floatingTopbar = document.getElementById('floating-topbar');
    const stickyCalculatorSelector = document.getElementById('sticky-calculator-selector');
    const stickyCalculatorDropdown = document.getElementById('sticky-calculator-dropdown');

    if (calculatorSelector && calculatorDropdown) {
        calculatorSelector.addEventListener('click', (event) => {
            event.stopPropagation();
            calculatorDropdown.classList.toggle('show');
        });
    }

    if (
        floatingTopbar &&
        stickyCalculatorSelector &&
        stickyCalculatorDropdown &&
        calculatorSelector
    ) {
        stickyCalculatorSelector.addEventListener('click', (event) => {
            event.stopPropagation();
            stickyCalculatorDropdown.classList.toggle('show');
        });

        function toggleFloatingTopbar() {
            const selectorRect = calculatorSelector.getBoundingClientRect();
            const shouldShowFloatingBar = selectorRect.bottom < 0;

            if (shouldShowFloatingBar) {
                floatingTopbar.classList.add('show');
            } else {
                floatingTopbar.classList.remove('show');
                stickyCalculatorDropdown.classList.remove('show');
            }
        }

        window.addEventListener('scroll', toggleFloatingTopbar, { passive: true });
        window.addEventListener('resize', toggleFloatingTopbar);
        toggleFloatingTopbar();
    }

    window.addEventListener('click', (event) => {
        if (
            calculatorDropdown &&
            calculatorDropdown.classList.contains('show') &&
            calculatorSelector &&
            !calculatorSelector.contains(event.target)
        ) {
            calculatorDropdown.classList.remove('show');
        }

        if (
            stickyCalculatorDropdown &&
            stickyCalculatorDropdown.classList.contains('show') &&
            stickyCalculatorSelector &&
            !stickyCalculatorSelector.contains(event.target)
        ) {
            stickyCalculatorDropdown.classList.remove('show');
        }
    });
}

const camposFormularioStatus = document.querySelectorAll('#loan-form input, #loan-form select');
camposFormularioStatus.forEach(campo => {
    campo.addEventListener('input', atualizarDisponibilidadePdf);
    campo.addEventListener('change', atualizarDisponibilidadePdf);
});

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
        // USAR DATA FIXA DO INPUT PARA NÃO OCORRER DRIFT (mudança de data gradual)
        const dataPrimeiroVencimentoOriginal = new Date(document.getElementById('primeiroVencimento').value + 'T00:00:00');
        
        const periodicidade = document.getElementById('periodicidade').value;
        const principalPorParcela = numParcelas > 0 ? valorFinanciado / numParcelas : 0;
        
        // Atualiza os campos na tela (usando .value para os inputs readonly)
        document.getElementById('valorEntrada').value = formatCurrency(valorEntrada); // Atualiza o novo campo
        document.getElementById('valorFinanciado').value = formatCurrency(valorFinanciado);
        document.getElementById('parcelasPrincipal').value = numParcelas;
        document.getElementById('total-principal').textContent = formatCurrency(valorFinanciado);
                
        const tbody = document.getElementById('amortization-body');
        tbody.innerHTML = '';
        if (numParcelas <= 0 || isNaN(dataLiberacao.getTime()) || isNaN(dataPrimeiroVencimentoOriginal.getTime()) || valorFinanciado <= 0) {
        document.getElementById('total-juros').textContent = formatCurrency(0);
        document.getElementById('total-geral').textContent = formatCurrency(0);
        atualizarResumoInferior();
        atualizarDisponibilidadePdf();
        return;
    }
        
        // O resto da lógica de cálculo da tabela permanece idêntico ao pronaf.js
        let saldoDevedor = valorFinanciado;
        let totalJuros = 0;
        let dataVencimentoAnterior = dataLiberacao;

        for (let i = 1; i <= numParcelas; i++) {
            // LÓGICA CORRIGIDA: Calcula a data base sempre a partir da data original (evita pular dias)
            let dataBaseVencimento = new Date(dataPrimeiroVencimentoOriginal);
            
            if (i > 1) { 
                const parcelasAdicionais = i - 1;
                if (periodicidade === 'ANUAL') { 
                    dataBaseVencimento.setFullYear(dataBaseVencimento.getFullYear() + parcelasAdicionais); 
                } else if (periodicidade === 'SEMESTRAL') { 
                    dataBaseVencimento.setMonth(dataBaseVencimento.getMonth() + (parcelasAdicionais * 6)); 
                } else { 
                    // Caso ainda exista mensal ou seja adicionado depois
                    dataBaseVencimento.setMonth(dataBaseVencimento.getMonth() + parcelasAdicionais); 
                }
            }

            // Ajusta se cair em FDS/Feriado, mas isso não afeta a dataBase da próxima iteração
            const dataVencimentoAtual = ajustarParaProximoDiaUtil(dataBaseVencimento);
            
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
        atualizarResumoInferior();
        atualizarDisponibilidadePdf();
    }
    
    setInitialDate();
    setDefaultVencimento();
    formatarValor(valorBemInput);
    calcularTudo();
    atualizarResumoInferior();
    atualizarDisponibilidadePdf();
    configurarMenusDaPagina();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then(() => {
                atualizarChipOffline();
            })
            .catch(() => {
                atualizarChipOffline();
            });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            atualizarChipOffline();
        });
    }

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
        const btnGerarPdf = document.getElementById('btn-gerar-pdf');
        const originalButtonText = btnGerarPdf.textContent;

        btnGerarPdf.textContent = 'Gerando...';
        btnGerarPdf.disabled = true;
        
        // PASSO 1: Clonar o elemento
        const clone = originalElement.cloneNode(true);
        const clonedActionsDiv = clone.querySelector('.actions');
        if (clonedActionsDiv) clonedActionsDiv.style.display = 'none';

        // --- CORREÇÃO DA LOGO NO PDF OFFLINE ---
        // Converte a logo original em Base64 para garantir que o html2canvas consiga lê-la
        const originalLogo = document.querySelector('.logo-image');
        const clonedLogo = clone.querySelector('.logo-image');
        
        if (originalLogo && clonedLogo && originalLogo.complete) {
            try {
                const canvasLogo = document.createElement('canvas');
                canvasLogo.width = originalLogo.naturalWidth;
                canvasLogo.height = originalLogo.naturalHeight;
                const ctxLogo = canvasLogo.getContext('2d');
                ctxLogo.drawImage(originalLogo, 0, 0);
                // Substitui o link "../logos/..." pelo código da imagem direta
                clonedLogo.src = canvasLogo.toDataURL('image/png');
            } catch (err) {
                console.warn("Erro ao converter logo para PDF (possível bloqueio de segurança/CORS):", err);
            }
        }

        // --- CORREÇÃO DE DATAS NO PDF (Formato PT-BR Visual) ---
        // Transforma os inputs type="date" em spans de texto DD/MM/AAAA
        const dateInputs = clone.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (input.value) {
                const span = document.createElement('span');
                const [ano, mes, dia] = input.value.split('-');
                span.textContent = `${dia}/${mes}/${ano}`;
                // Copia estilos básicos para manter consistência visual
                span.className = input.className; 
                span.style.cssText = window.getComputedStyle(input).cssText;
                span.style.border = '1px solid #ccc'; // Garante borda visível
                span.style.display = 'flex';
                span.style.alignItems = 'center';
                span.style.justifyContent = 'flex-end'; // Alinha à direita
                input.parentNode.replaceChild(span, input);
            }
        });

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
        
        // PASSO 2: Criar container off-screen
        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '0';
        printContainer.style.top = '-9999px';
        printContainer.style.width = '1200px';
        printContainer.classList.add('pdf-compact-mode'); // Aplica modo compacto no container

        // <<< A MÁGICA PARA O CSS OFFLINE >>>
        let styleElement = null; // Variável para guardar o style injetado
        try {
            // Tenta buscar o conteúdo do CSS (virá do cache offline)
            const cssPath = '../style/style.css'; // Ajuste o caminho se necessário!
            const response = await fetch(cssPath);
            if (!response.ok) throw new Error(`CSS não encontrado: ${response.statusText}`);
            const cssText = await response.text();

            // Cria um elemento <style> e injeta o CSS
            styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            printContainer.appendChild(styleElement); // Adiciona ao container ANTES do clone

        } catch (cssError) {
            console.error("Erro ao carregar ou injetar CSS para PDF:", cssError);
            // Continua mesmo sem CSS externo, usando o que tiver
        }
        // <<< FIM DA MÁGICA >>>
        
        printContainer.appendChild(clone);
        document.body.appendChild(printContainer);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) throw new Error("jsPDF não carregado.");
            const { jsPDF } = window.jspdf;

            // 1. Escala 2 (Qualidade Original) + Fundo Branco na captura
            const scale = 2;
            const canvas = await html2canvas(clone, { 
                scale: scale, 
                useCORS: true,
                backgroundColor: '#ffffff' // Garante fundo branco na captura
            });
            
            // 2. Correção da Barra Preta no Canvas de Destino
            const contentWidth = (clone.offsetWidth + 20) * scale;
            const contentHeight = canvas.height;
            
            const destinationCanvas = document.createElement('canvas');
            destinationCanvas.width = contentWidth;
            destinationCanvas.height = contentHeight;
            const ctx = destinationCanvas.getContext('2d');
            
            // --- A CURA DA BARRA PRETA ---
            // Pintamos todo o fundo de BRANCO antes de desenhar a imagem.
            // Isso garante que a margem extra (+20) seja branca, não transparente (que vira preta no JPEG).
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);
            
            // Desenhamos a imagem capturada sobre o fundo branco
            // Usamos as dimensões originais do canvas para não esticar
            ctx.drawImage(canvas, 0, 0);
            
            // 3. Otimização de Tamanho (JPEG 0.8)
            // Reduz de ~14MB para ~200-400KB mantendo o layout
            const imgData = destinationCanvas.toDataURL('image/jpeg', 0.8);
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const margin = 10;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (destinationCanvas.height * imgWidth) / destinationCanvas.width;
            const xOffset = margin;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', xOffset, margin, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin);

            while (heightLeft > 0) {
                position -= (pageHeight - (margin * 2));
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Lembre-se de ajustar o nome do arquivo para cada simulador (ex: simulacao_pronaf.pdf)
            pdf.save('simulacao_moderfrota.pdf');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            // PASSO 6: Limpeza
            if (printContainer && printContainer.parentNode === document.body) {
                document.body.removeChild(printContainer); // Remove o container com clone e style
            }
            btnGerarPdf.textContent = originalButtonText;
            btnGerarPdf.disabled = false;
        }
    }
    
    // Menu da página já configurado acima
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
