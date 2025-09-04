document.addEventListener('DOMContentLoaded', () => {
    // --- PREENCHER DATA DE LIBERAÇÃO AUTOMATICAMENTE ---
    function setInitialDate() {
        const liberacaoInput = document.getElementById('liberacao');
        const today = new Date();
        
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        const formattedToday = `${yyyy}-${mm}-${dd}`;
        
        liberacaoInput.value = formattedToday;
    }

    // --- LÓGICA DE DIAS ÚTEIS ---
    const feriadosNacionais = [
        // 2025
        "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18", "2025-04-21", "2025-05-01", 
        "2025-06-19", "2025-09-07", "2025-10-12", "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25",
        // 2026
        "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-06-04", "2026-09-07", 
        "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
    ];

    function isDiaUtil(date) {
        const diaDaSemana = date.getDay();
        if (diaDaSemana === 0 || diaDaSemana === 6) return false;
        const dataFormatada = date.toISOString().slice(0, 10);
        if (feriadosNacionais.includes(dataFormatada)) return false;
        return true;
    }

    function ajustarParaProximoDiaUtil(date) {
        let dataAjustada = new Date(date);
        while (!isDiaUtil(dataAjustada)) {
            dataAjustada.setDate(dataAjustada.getDate() + 1);
        }
        return dataAjustada;
    }

    // --- NOVO: LÓGICA DE CÁLCULO E VALIDAÇÃO DA CARÊNCIA ---
    function atualizarCarenciaEValidar() {
        const liberacaoInput = document.getElementById('liberacao');
        const vencimentoInput = document.getElementById('primeiroVencimento');
        const carenciaInput = document.getElementById('carencia');
        
        const dataLiberacao = new Date(liberacaoInput.value + 'T00:00:00');
        const dataPrimeiroVencimento = new Date(vencimentoInput.value + 'T00:00:00');

        if (isNaN(dataLiberacao.getTime()) || isNaN(dataPrimeiroVencimento.getTime())) {
            carenciaInput.value = 0;
            return;
        }

        // Calcula a diferença em meses
        const mesesDiferenca = (dataPrimeiroVencimento.getFullYear() - dataLiberacao.getFullYear()) * 12 + 
                                (dataPrimeiroVencimento.getMonth() - dataLiberacao.getMonth());
        
        carenciaInput.value = mesesDiferenca;

        // Validação: verifica se a carência ultrapassa 14 meses
        if (mesesDiferenca > 14) {
            alert("A carência não pode exceder 14 meses. A data do primeiro vencimento será ajustada para o limite máximo permitido.");

            // Calcula a data máxima permitida (Liberação + 14 meses)
            let dataMaxima = new Date(dataLiberacao);
            dataMaxima.setMonth(dataMaxima.getMonth() + 14);

            // Formata e reverte a data no input
            const yyyy = dataMaxima.getFullYear();
            const mm = String(dataMaxima.getMonth() + 1).padStart(2, '0');
            const dd = String(dataMaxima.getDate()).padStart(2, '0');
            vencimentoInput.value = `${yyyy}-${mm}-${dd}`;
            
            // Atualiza o valor da carência para o máximo
            carenciaInput.value = 14;

            // Dispara um novo evento de 'input' para que o cálculo geral seja refeito com a data corrigida
            vencimentoInput.dispatchEvent(new Event('input')); 
        }
    }

    // --- FIM DA LÓGICA ---

    const inputs = document.querySelectorAll('#valorBem, #percFinanciado, #parcelas, #taxaAA, #liberacao, #primeiroVencimento, #periodicidade');

    inputs.forEach(input => {
        input.addEventListener('input', calcularTudo);
    });

    const formatCurrency = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDate = (date) => isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');

    function calcularTudo(event) {
        // Evita loop infinito na validação da carência
        if (event && event.isTrusted === false) return; 

        // Roda a validação da carência primeiro
        atualizarCarenciaEValidar();

        const valorBem = parseFloat(document.getElementById('valorBem').value) || 0;
        const percFinanciado = parseFloat(document.getElementById('percFinanciado').value) || 0;
        const numParcelas = parseInt(document.getElementById('parcelas').value) || 1;
        const taxaAA = parseFloat(document.getElementById('taxaAA').value) / 100 || 0;
        const dataLiberacao = new Date(document.getElementById('liberacao').value + 'T00:00:00');
        const dataPrimeiroVencimento = new Date(document.getElementById('primeiroVencimento').value + 'T00:00:00');
        const periodicidade = document.getElementById('periodicidade').value;
        
        const valorFinanciado = valorBem * (percFinanciado / 100);
        const principalPorParcela = numParcelas > 0 ? valorFinanciado / numParcelas : 0;

        document.getElementById('valorFinanciado').textContent = formatCurrency(valorFinanciado);
        document.getElementById('parcelasPrincipal').textContent = numParcelas;
        document.getElementById('total-principal').textContent = formatCurrency(valorFinanciado);
        
        const tbody = document.getElementById('amortization-body');
        tbody.innerHTML = '';
        
        if (numParcelas <= 0 || isNaN(dataLiberacao.getTime()) || isNaN(dataPrimeiroVencimento.getTime())) {
            document.getElementById('prestacao').textContent = formatCurrency(0);
            document.getElementById('total-juros').textContent = formatCurrency(0);
            document.getElementById('total-geral').textContent = formatCurrency(0);
            return;
        }

        let saldoDevedor = valorFinanciado;
        let totalJuros = 0;
        let dataVencimentoAnterior = dataLiberacao;

        for (let i = 1; i <= numParcelas; i++) {
            let dataVencimentoCalculada;
            
            if (i === 1) {
                dataVencimentoCalculada = new Date(dataPrimeiroVencimento);
            } else {
                dataVencimentoCalculada = new Date(dataVencimentoAnterior);
                if (periodicidade === 'ANUAL') {
                    dataVencimentoCalculada.setFullYear(dataVencimentoAnterior.getFullYear() + 1);
                } else if (periodicidade === 'SEMESTRAL') {
                    dataVencimentoCalculada.setMonth(dataVencimentoAnterior.getMonth() + 6);
                } else { // MENSAL
                    dataVencimentoCalculada.setMonth(dataVencimentoAnterior.getMonth() + 1);
                }
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

            if (i === 1) {
                 document.getElementById('prestacao').textContent = formatCurrency(totalParcela);
            }
        }

        document.getElementById('total-juros').textContent = formatCurrency(totalJuros);
        document.getElementById('total-geral').textContent = formatCurrency(valorFinanciado + totalJuros);
    }
    
    // Executa as funções iniciais no carregamento da página
    setInitialDate();
    calcularTudo();
});