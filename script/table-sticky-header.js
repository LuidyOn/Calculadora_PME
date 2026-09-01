/*
 * Linha de títulos fixa das tabelas de amortização.
 *
 * A tabela fica dentro de .table-wrapper, que rola na horizontal. Um
 * contêiner com rolagem "prende" o position: sticky nele mesmo, então o
 * <thead> original nunca conseguiria se fixar em relação à janela.
 *
 * Por isso espelhamos a linha de títulos em uma barra fixa, posicionada
 * logo abaixo do menu flutuante (com uma folga) e sincronizada com a
 * rolagem horizontal da tabela. Nada do layout original é alterado, e o
 * espelho vive fora de #capture — portanto não entra na geração do PDF.
 */
(function () {
    'use strict';

    const FOLGA_ABAIXO_DO_MENU = 10; // respiro entre o menu flutuante e a linha fixa
    const TOPO_SEM_MENU = 12;        // posição quando o menu flutuante está escondido

    function iniciar() {
        const wrapper = document.querySelector('.table-wrapper');
        if (!wrapper) return;

        const tabela = wrapper.querySelector('table');
        const thead = tabela ? tabela.querySelector('thead') : null;
        const linhaTitulos = thead ? thead.querySelector('tr') : null;
        const corpo = tabela ? tabela.querySelector('tbody') : null;

        if (!tabela || !thead || !linhaTitulos || !corpo) return;

        const topbar = document.getElementById('floating-topbar');

        // --- Monta o espelho da linha de títulos ---
        const barra = document.createElement('div');
        barra.className = 'sticky-thead';
        barra.setAttribute('aria-hidden', 'true');

        // Blindagem: se o style.css estiver desatualizado no cache (ou não
        // carregar), estas regras impedem que o espelho vire um bloco solto
        // no fim da página e alargue o documento no celular.
        barra.style.cssText =
            'position:fixed;top:0;left:0;width:0;display:none;' +
            'overflow:hidden;pointer-events:none;z-index:940;background:#0a477f;';

        const trilho = document.createElement('div');
        trilho.className = 'sticky-thead-track';

        const tabelaEspelho = document.createElement('table');
        const theadEspelho = document.createElement('thead');
        const linhaEspelho = document.createElement('tr');

        theadEspelho.appendChild(linhaEspelho);
        tabelaEspelho.appendChild(theadEspelho);
        trilho.appendChild(tabelaEspelho);
        barra.appendChild(trilho);
        document.body.appendChild(barra);

        let visivel = false;
        let atualizacaoAgendada = false;

        function topoDesejado() {
            if (topbar && topbar.classList.contains('show')) {
                const rect = topbar.getBoundingClientRect();
                if (rect.height > 0 && rect.bottom > 0) {
                    return rect.bottom + FOLGA_ABAIXO_DO_MENU;
                }
            }
            return TOPO_SEM_MENU;
        }

        function esconder() {
            if (!visivel) return;
            visivel = false;
            // display inline (e não só a classe) porque o estilo embutido
            // acima tem prioridade sobre a folha de estilo.
            barra.style.display = 'none';
            barra.classList.remove('show');
        }

        function sincronizarColunas(colunas) {
            if (linhaEspelho.children.length !== colunas.length) {
                linhaEspelho.innerHTML = '';
                for (let i = 0; i < colunas.length; i++) {
                    linhaEspelho.appendChild(document.createElement('th'));
                }
            }

            for (let i = 0; i < colunas.length; i++) {
                const original = colunas[i];
                const espelho = linhaEspelho.children[i];
                if (!espelho) continue;

                if (espelho.textContent !== original.textContent) {
                    espelho.textContent = original.textContent;
                }

                espelho.style.width = `${original.getBoundingClientRect().width}px`;
            }
        }

        function atualizar() {
            atualizacaoAgendada = false;

            const colunas = linhaTitulos.querySelectorAll('th');
            const larguraVisivel = wrapper.clientWidth;

            // Sem colunas, sem linhas calculadas ou tabela invisível: nada a fixar.
            if (!colunas.length || !corpo.rows.length || larguraVisivel <= 0) {
                esconder();
                return;
            }

            const topo = topoDesejado();
            const retanguloThead = thead.getBoundingClientRect();
            const retanguloCorpo = corpo.getBoundingClientRect();

            // Só aparece depois que a linha original saiu de vista e enquanto
            // ainda houver linhas de dados abaixo do ponto de fixação.
            const precisaFixar =
                retanguloThead.height > 0 &&
                retanguloThead.top < topo &&
                retanguloCorpo.bottom > topo + retanguloThead.height;

            if (!precisaFixar) {
                esconder();
                return;
            }

            const retanguloWrapper = wrapper.getBoundingClientRect();
            const bordaEsquerda = parseFloat(getComputedStyle(wrapper).borderLeftWidth) || 0;

            barra.style.top = `${topo}px`;
            barra.style.left = `${retanguloWrapper.left + bordaEsquerda}px`;
            barra.style.width = `${larguraVisivel}px`;

            tabelaEspelho.style.width = `${tabela.getBoundingClientRect().width}px`;
            sincronizarColunas(colunas);
            trilho.style.transform = `translateX(${-wrapper.scrollLeft}px)`;

            if (!visivel) {
                visivel = true;
                barra.style.display = 'block';
                barra.classList.add('show');
            }
        }

        function agendar() {
            if (atualizacaoAgendada) return;
            atualizacaoAgendada = true;

            // rAF sincroniza com o quadro; o setTimeout é rede de segurança
            // para contextos em que o rAF não dispara (aba oculta, webviews).
            const reserva = setTimeout(atualizar, 80);
            window.requestAnimationFrame(() => {
                clearTimeout(reserva);
                atualizar();
            });
        }

        window.addEventListener('scroll', agendar, { passive: true });
        window.addEventListener('resize', agendar);
        window.addEventListener('orientationchange', agendar);
        wrapper.addEventListener('scroll', agendar, { passive: true });

        // O menu flutuante entra/sai com transição: reposiciona ao terminar.
        if (topbar) {
            topbar.addEventListener('transitionend', agendar);
        }

        // A tabela é regerada a cada recálculo — as larguras mudam junto.
        if ('MutationObserver' in window) {
            new MutationObserver(agendar).observe(corpo, { childList: true, subtree: true });
        }

        agendar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
