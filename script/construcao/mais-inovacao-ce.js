document.addEventListener('DOMContentLoaded', () => {
    const valorEquipamentoInput = document.getElementById('valorEquipamento');

    function setInitialDate() {
        const liberacaoInput = document.getElementById('liberacao');
        const today = new Date();
        liberacaoInput.value = today.toISOString().slice(0, 10);
    }

    function formatarValor(input) {
        let valor = input.value.replace(/\D/g, '');
        if (valor === '') {
            input.value = '';
            return;
        }
        let numero = parseFloat(valor) / 100;
        input.value = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    valorEquipamentoInput.addEventListener('input', () => formatarValor(valorEquipamentoInput));

    const formatCurrency = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');

    function parseCurrencyBR(value) {
        return parseFloat(String(value || '').replace(/\./g, '').replace(',', '.')) || 0;
    }

    function round2(value) {
        return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    function yearDays(date) {
        return isLeapYear(date.getFullYear()) ? 366 : 365;
    }

    function diffDays(dateA, dateB) {
        return Math.max(0, Math.round((dateB - dateA) / (1000 * 60 * 60 * 24)));
    }

    function addMonthsWithDay(baseDate, monthsToAdd, targetDay = 15) {
        const year = baseDate.getFullYear() + Math.floor((baseDate.getMonth() + monthsToAdd) / 12);
        const month = (baseDate.getMonth() + monthsToAdd) % 12;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const day = Math.min(targetDay, lastDay);
        return new Date(year, month, day);
    }

    const feriadosNacionais = [
        "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21", "2025-05-01", "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25",
        "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
        "2027-01-01", "2027-02-08", "2027-02-09", "2027-03-26", "2027-04-21", "2027-05-01", "2027-05-27", "2027-09-07", "2027-10-12", "2027-11-02", "2027-11-15", "2027-11-20", "2027-12-25",
        "2028-01-01", "2028-02-28", "2028-02-29", "2028-04-14", "2028-04-21", "2028-05-01", "2028-06-15", "2028-09-07", "2028-10-12", "2028-11-02", "2028-11-15", "2028-11-20", "2028-12-25"
    ];

    function isDiaUtil(date) {
        const diaDaSemana = date.getDay();
        if (diaDaSemana === 0 || diaDaSemana === 6) return false;
        const dataFormatada = date.toISOString().slice(0, 10);
        return !feriadosNacionais.includes(dataFormatada);
    }

    function ajustarParaProximoDiaUtil(date) {
        let dataAjustada = new Date(date);
        while (!isDiaUtil(dataAjustada)) {
            dataAjustada.setDate(dataAjustada.getDate() + 1);
        }
        return dataAjustada;
    }

    function atualizarResumoInferior() {
        const footerNumParcelas = document.getElementById('footer-num-parcelas');
        const footerValorFinanciado = document.getElementById('footer-valor-financiado');
        const footerTotalGeral = document.getElementById('footer-total-geral');
        const parcelasInput = document.getElementById('parcelas');
        const valorFinanciadoInput = document.getElementById('valorFinanciado');
        const totalGeralCell = document.getElementById('total-geral');

        if (footerNumParcelas && parcelasInput) footerNumParcelas.textContent = parcelasInput.value || '0';
        if (footerValorFinanciado && valorFinanciadoInput) footerValorFinanciado.textContent = valorFinanciadoInput.value || 'R$ 0,00';
        if (footerTotalGeral && totalGeralCell) footerTotalGeral.textContent = totalGeralCell.textContent || 'R$ 0,00';
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

        if (btnGerarPdf) btnGerarPdf.disabled = !disponivel;
    }

    function configurarMenusDaPagina() {
    const calculatorSelector = document.querySelector('.calculator-selector');
    const calculatorDropdown = document.querySelector('.calculator-dropdown');
    const floatingTopbar = document.getElementById('floating-topbar');
    const stickyCalculatorSelector = document.getElementById('sticky-calculator-selector');
    const stickyCalculatorDropdown = document.getElementById('sticky-calculator-dropdown');

    function configurarSubgruposMenu(dropdownElement) {
        if (!dropdownElement) return;

        const toggles = dropdownElement.querySelectorAll('.menu-group-toggle');

        function fecharTodos() {
            dropdownElement.querySelectorAll('.menu-group-toggle').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
            });

            dropdownElement.querySelectorAll('.menu-group-content').forEach(content => {
                content.classList.remove('show');
            });
        }

        toggles.forEach(toggle => {
            toggle.setAttribute('aria-expanded', 'false');

            toggle.addEventListener('click', (event) => {
                event.stopPropagation();

                const content = toggle.nextElementSibling;
                const estavaAberto = content && content.classList.contains('show');

                fecharTodos();

                if (!estavaAberto && content) {
                    toggle.classList.add('active');
                    toggle.setAttribute('aria-expanded', 'true');
                    content.classList.add('show');
                }
            });
        });

        dropdownElement._fecharSubgrupos = fecharTodos;
    }

    if (calculatorSelector && calculatorDropdown) {
        configurarSubgruposMenu(calculatorDropdown);

        calculatorSelector.addEventListener('click', (event) => {
            event.stopPropagation();
            calculatorDropdown.classList.toggle('show');

            if (!calculatorDropdown.classList.contains('show') && calculatorDropdown._fecharSubgrupos) {
                calculatorDropdown._fecharSubgrupos();
            }
        });
    }

    if (
        floatingTopbar &&
        stickyCalculatorSelector &&
        stickyCalculatorDropdown &&
        calculatorSelector
    ) {
        configurarSubgruposMenu(stickyCalculatorDropdown);

        stickyCalculatorSelector.addEventListener('click', (event) => {
            event.stopPropagation();
            stickyCalculatorDropdown.classList.toggle('show');

            if (!stickyCalculatorDropdown.classList.contains('show') && stickyCalculatorDropdown._fecharSubgrupos) {
                stickyCalculatorDropdown._fecharSubgrupos();
            }
        });

        function toggleFloatingTopbar() {
            const selectorRect = calculatorSelector.getBoundingClientRect();
            const shouldShowFloatingBar = selectorRect.bottom < 0;

            if (shouldShowFloatingBar) {
                floatingTopbar.classList.add('show');
            } else {
                floatingTopbar.classList.remove('show');
                stickyCalculatorDropdown.classList.remove('show');
                if (stickyCalculatorDropdown._fecharSubgrupos) stickyCalculatorDropdown._fecharSubgrupos();
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
            if (calculatorDropdown._fecharSubgrupos) calculatorDropdown._fecharSubgrupos();
        }

        if (
            stickyCalculatorDropdown &&
            stickyCalculatorDropdown.classList.contains('show') &&
            stickyCalculatorSelector &&
            !stickyCalculatorSelector.contains(event.target)
        ) {
            stickyCalculatorDropdown.classList.remove('show');
            if (stickyCalculatorDropdown._fecharSubgrupos) stickyCalculatorDropdown._fecharSubgrupos();
        }
    });
}

    function configurarIndicacaoRolagemTabela() {
        const wrapper = document.querySelector('.table-wrapper');
        if (!wrapper) return;

        let nudgeExecutado = false;

        function atualizarEstadoRolagem() {
            const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
            const mostrarFadeDireito = maxScroll > 4 && wrapper.scrollLeft <= 1;
            wrapper.classList.toggle('show-right-fade', mostrarFadeDireito);
        }

        function executarNudgeInicial() {
            if (nudgeExecutado) return;
            if (window.innerWidth > 768) return;

            const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;
            if (maxScroll <= 24) return;

            nudgeExecutado = true;

            setTimeout(() => {
                wrapper.scrollTo({ left: Math.min(48, maxScroll), behavior: 'smooth' });
                setTimeout(() => {
                    wrapper.scrollTo({ left: 0, behavior: 'smooth' });
                }, 850);
            }, 500);
        }

        wrapper.addEventListener('scroll', atualizarEstadoRolagem, { passive: true });
        window.addEventListener('resize', atualizarEstadoRolagem);

        requestAnimationFrame(() => {
            atualizarEstadoRolagem();
            executarNudgeInicial();
        });
    }

    function calcularTudo() {
        const valorEquipamento = parseCurrencyBR(document.getElementById('valorEquipamento').value);
        const percEntrada = (parseFloat(document.getElementById('percEntrada').value) || 0) / 100;
        const taxaTotalAA = (parseFloat(document.getElementById('taxaTotalAA').value) || 0) / 100;
        const carencia = Math.max(0, parseInt(document.getElementById('carencia').value, 10) || 0);
        const prazo = parseInt(document.getElementById('prazo').value, 10) || 60;
        const parcelas = Math.max(1, prazo - (carencia * 3));
        const tac = 1400;
        const dataLiberacao = new Date(document.getElementById('liberacao').value + 'T00:00:00');
        const taxaTotalAM = Math.pow(1 + taxaTotalAA, 1 / 12) - 1;

        const valorEntrada = round2(valorEquipamento * percEntrada);
        const valorFinanciado = round2(valorEquipamento - valorEntrada);
        const principalConstante = parcelas > 0 ? round2(valorFinanciado / parcelas) : 0;

        document.getElementById('valorEntrada').value = formatCurrency(valorEntrada);
        document.getElementById('valorFinanciado').value = formatCurrency(valorFinanciado);
        document.getElementById('parcelas').value = parcelas;
        document.getElementById('taxaTotalAM').value = `${(taxaTotalAM * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        document.getElementById('cetAA').value = `${(taxaTotalAA * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

        const tbody = document.getElementById('amortization-body');
        tbody.innerHTML = '';

        if (valorFinanciado <= 0 || isNaN(dataLiberacao.getTime())) {
            document.getElementById('total-juros').textContent = formatCurrency(0);
            document.getElementById('total-principal').textContent = formatCurrency(0);
            document.getElementById('total-geral').textContent = formatCurrency(0);
            atualizarResumoInferior();
            atualizarDisponibilidadePdf();
            return;
        }

        let saldoPrincipal = valorFinanciado;
        let totalJuros = 0;
        let totalPrincipal = 0;
        let dataAnterior = new Date(dataLiberacao);

        for (let j = 1; j <= carencia; j++) {
            const dataBase = addMonthsWithDay(dataLiberacao, (j * 3) + 1, 15);
            const dataVencimento = ajustarParaProximoDiaUtil(dataBase);
            const dias = diffDays(dataAnterior, dataVencimento);
            const juros = round2(saldoPrincipal * (Math.pow(1 + taxaTotalAA, dias / yearDays(dataAnterior)) - 1));
            const parcela = juros;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td></td>
                <td></td>
                <td>${j}</td>
                <td>${formatDate(dataVencimento)}</td>
                <td>${dias}</td>
                <td>${formatCurrency(saldoPrincipal)}</td>
                <td>${formatCurrency(juros)}</td>
                <td>${formatCurrency(0)}</td>
                <td>${formatCurrency(parcela)}</td>
            `;
            tbody.appendChild(row);

            totalJuros = round2(totalJuros + juros);
            dataAnterior = dataVencimento;
        }

        for (let i = 1; i <= parcelas; i++) {
            const dataBase = addMonthsWithDay(dataLiberacao, (carencia * 3) + 1 + i, 15);
            const dataVencimento = ajustarParaProximoDiaUtil(dataBase);
            const dias = diffDays(dataAnterior, dataVencimento);

            let principal = i === parcelas ? round2(saldoPrincipal) : principalConstante;
            const juros = round2(saldoPrincipal * (Math.pow(1 + taxaTotalAA, dias / yearDays(dataAnterior)) - 1));
            const parcela = round2(principal + juros);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i}</td>
                <td>${i}</td>
                <td></td>
                <td>${formatDate(dataVencimento)}</td>
                <td>${dias}</td>
                <td>${formatCurrency(saldoPrincipal)}</td>
                <td>${formatCurrency(juros)}</td>
                <td>${formatCurrency(principal)}</td>
                <td>${formatCurrency(parcela)}</td>
            `;
            tbody.appendChild(row);

            saldoPrincipal = round2(saldoPrincipal - principal);
            totalJuros = round2(totalJuros + juros);
            totalPrincipal = round2(totalPrincipal + principal);
            dataAnterior = dataVencimento;
        }

        document.getElementById('total-juros').textContent = formatCurrency(totalJuros);
        document.getElementById('total-principal').textContent = formatCurrency(totalPrincipal);
        document.getElementById('total-geral').textContent = formatCurrency(totalJuros + totalPrincipal + tac);

        atualizarResumoInferior();
        atualizarDisponibilidadePdf();
    }

    const camposFormularioStatus = document.querySelectorAll('#loan-form input, #loan-form select');
    camposFormularioStatus.forEach(campo => {
        campo.addEventListener('input', calcularTudo);
        campo.addEventListener('input', atualizarDisponibilidadePdf);
        campo.addEventListener('change', calcularTudo);
        campo.addEventListener('change', atualizarDisponibilidadePdf);
    });

    setInitialDate();
    formatarValor(valorEquipamentoInput);
    calcularTudo();
    atualizarResumoInferior();
    atualizarDisponibilidadePdf();
    configurarMenusDaPagina();
    configurarIndicacaoRolagemTabela();

    const btnGerarPdf = document.getElementById('btn-gerar-pdf');
    const modalOverlay = document.getElementById('pdf-modal-overlay');
    const btnCancelPdf = document.getElementById('btn-cancel-pdf');
    const btnConfirmPdf = document.getElementById('btn-confirm-pdf');

    btnGerarPdf.addEventListener('click', () => {
        modalOverlay.classList.add('show');
    });

    btnCancelPdf.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
    });

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) modalOverlay.classList.remove('show');
    });

    btnConfirmPdf.addEventListener('click', () => {
        const vendedorName = document.getElementById('vendedor-name').value.trim();
        const clienteName = document.getElementById('cliente-name').value.trim();
        const vendedorCpfFinal = document.getElementById('vendedor-cpf-final').value.trim();

        if (!vendedorName || !clienteName || !vendedorCpfFinal) {
            alert('Por favor, preencha nome do vendedor, nome do cliente e os 3 últimos números do CPF.');
            return;
        }

        if (!/^\d{3}$/.test(vendedorCpfFinal)) {
            alert('Informe exatamente os 3 últimos números do CPF do vendedor.');
            return;
        }

        modalOverlay.classList.remove('show');
        generatePdf(vendedorName, clienteName, vendedorCpfFinal);
    });

    function contarCaracteresNome(nome) {
        return (nome || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .length;
    }

    function gerarCodigoSimulacao(dataSimulacao, vendedor, cliente, cpfFinal) {
        const dia = String(dataSimulacao.getDate()).padStart(2, '0');
        const mes = String(dataSimulacao.getMonth() + 1).padStart(2, '0');
        const ano = String(dataSimulacao.getFullYear());

        const totalVendedor = contarCaracteresNome(vendedor);
        const totalCliente = contarCaracteresNome(cliente);
        const cpfFinalNumerico = Number(String(cpfFinal || '').replace(/\D/g, '')) || 0;
        const somaFinal = totalVendedor + totalCliente + cpfFinalNumerico;

        return `${dia}${mes}${ano}${String(totalVendedor).padStart(2, '0')}${String(totalCliente).padStart(2, '0')}${String(somaFinal).padStart(4, '0')}`;
    }

    async function generatePdf(vendedor, cliente, cpfFinal) {
        const originalElement = document.getElementById('capture');
        const originalButtonText = btnGerarPdf.textContent;

        btnGerarPdf.textContent = 'Gerando...';
        btnGerarPdf.disabled = true;

        const clone = originalElement.cloneNode(true);
        const clonedActionsDiv = clone.querySelector('.actions');
        if (clonedActionsDiv) clonedActionsDiv.style.display = 'none';

        const elementosParaRemoverDoPdf = clone.querySelectorAll('.header-home-link, .floating-home-link');
        elementosParaRemoverDoPdf.forEach(elemento => elemento.remove());

        const originalLogo = document.querySelector('.logo-image');
        const clonedLogo = clone.querySelector('.logo-image');

        if (originalLogo && clonedLogo && originalLogo.complete) {
            try {
                const canvasLogo = document.createElement('canvas');
                canvasLogo.width = originalLogo.naturalWidth;
                canvasLogo.height = originalLogo.naturalHeight;
                const ctxLogo = canvasLogo.getContext('2d');
                ctxLogo.drawImage(originalLogo, 0, 0);
                clonedLogo.src = canvasLogo.toDataURL('image/png');
            } catch (err) {
                console.warn('Erro ao converter logo para PDF:', err);
            }
        }

        const dateInputs = clone.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (input.value) {
                const span = document.createElement('span');
                const [ano, mes, dia] = input.value.split('-');
                span.textContent = `${dia}/${mes}/${ano}`;
                span.className = input.className;
                span.style.cssText = window.getComputedStyle(input).cssText;
                span.style.border = '1px solid #ccc';
                span.style.display = 'flex';
                span.style.alignItems = 'center';
                span.style.justifyContent = 'flex-end';
                input.parentNode.replaceChild(span, input);
            }
        });

        const header = clone.querySelector('header');
        if (header) {
            const infoDiv = document.createElement('div');
            const dataSimulacao = new Date();
            const dataSimulacaoTexto = dataSimulacao.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
            const codigoSimulacao = gerarCodigoSimulacao(dataSimulacao, vendedor, cliente, cpfFinal);

            infoDiv.className = 'pdf-info';
            infoDiv.innerHTML = `
                <p><strong>Vendedor:</strong> ${vendedor}</p>
                <p><strong>Cliente:</strong> ${cliente}</p>
                <p><strong>Data da Simulação:</strong> ${dataSimulacaoTexto}</p>
                <p><strong>Código da Simulação:</strong> ${codigoSimulacao}</p>
            `;
            header.appendChild(infoDiv);
        }

        const printContainer = document.createElement('div');
        printContainer.style.position = 'absolute';
        printContainer.style.left = '0';
        printContainer.style.top = '-9999px';
        printContainer.style.width = '1200px';
        printContainer.classList.add('pdf-compact-mode');

        try {
            const response = await fetch('../../style/style.css');
            const cssText = await response.text();
            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            printContainer.appendChild(styleElement);
        } catch (cssError) {
            console.error('Erro ao carregar CSS para PDF:', cssError);
        }

        printContainer.appendChild(clone);
        document.body.appendChild(printContainer);

        try {
            await new Promise(resolve => setTimeout(resolve, 200));

            if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                throw new Error('jsPDF não carregado.');
            }

            const { jsPDF } = window.jspdf;
            const scale = 2;
            const canvas = await html2canvas(clone, {
                scale,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const contentWidth = (clone.offsetWidth + 20) * scale;
            const contentHeight = canvas.height;

            const destinationCanvas = document.createElement('canvas');
            destinationCanvas.width = contentWidth;
            destinationCanvas.height = contentHeight;
            const ctx = destinationCanvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, destinationCanvas.width, destinationCanvas.height);
            ctx.drawImage(canvas, 0, 0);

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

            pdf.save('simulacao_finame-inovacao.pdf');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF.');
        } finally {
            if (printContainer && printContainer.parentNode === document.body) {
                document.body.removeChild(printContainer);
            }
            btnGerarPdf.textContent = originalButtonText;
            btnGerarPdf.disabled = false;
        }
    }
});

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
}