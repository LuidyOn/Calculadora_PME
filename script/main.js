document.addEventListener('DOMContentLoaded', () => {
    // --- MENU DROPDOWN PRINCIPAL ---
    const calculatorSelector = document.querySelector('.calculator-selector');
    const calculatorDropdown = document.querySelector('.calculator-dropdown');

    if (calculatorSelector && calculatorDropdown) {
        calculatorSelector.addEventListener('click', (event) => {
            event.stopPropagation();
            calculatorDropdown.classList.toggle('show');
        });
    }

    // --- MENU SUPERIOR FIXO DA HOME ---
    const floatingTopbar = document.getElementById('floating-topbar');
    const stickyCalculatorSelector = document.getElementById('sticky-calculator-selector');
    const stickyCalculatorDropdown = document.getElementById('sticky-calculator-dropdown');

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

    // --- FECHAMENTO DOS MENUS AO CLICAR FORA ---
    window.addEventListener('click', (event) => {
        if (
            calculatorSelector &&
            calculatorDropdown &&
            calculatorDropdown.classList.contains('show') &&
            !calculatorSelector.contains(event.target)
        ) {
            calculatorDropdown.classList.remove('show');
        }

        if (
            stickyCalculatorSelector &&
            stickyCalculatorDropdown &&
            stickyCalculatorDropdown.classList.contains('show') &&
            !stickyCalculatorSelector.contains(event.target)
        ) {
            stickyCalculatorDropdown.classList.remove('show');
        }
    });

    // --- BOTÃO "ADICIONAR À TELA INICIAL" ---
    let deferredPrompt;
    const installButton = document.getElementById('btn-install-app');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (installButton) {
            installButton.style.display = 'block';
            console.log('`beforeinstallprompt` capturado, botão mostrado.');
        } else {
            console.error('Botão de instalação não encontrado no DOM.');
        }
    });

    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                console.log('Nenhum prompt de instalação disponível.');
                return;
            }

            deferredPrompt.prompt();
            console.log('Prompt de instalação mostrado.');

            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Escolha do usuário: ${outcome}`);

            deferredPrompt = null;
            installButton.style.display = 'none';
        });
    }

    // --- BLOCOS COLAPSÁVEIS DA HOME ---
    const collapsibleButtons = document.querySelectorAll('.collapsible-button');

    collapsibleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const icon = button.querySelector('.toggle-icon');

            button.classList.toggle('active');

            if (content.classList.contains('show')) {
                content.classList.remove('show');
                if (icon) icon.textContent = '+';
            } else {
                content.classList.add('show');
                if (icon) icon.textContent = '-';
            }
        });
    });

    // --- EVENTO DE APP INSTALADO ---
    window.addEventListener('appinstalled', () => {
        console.log('PWA foi instalado com sucesso!');

        if (installButton) {
            installButton.style.display = 'none';
        }

        deferredPrompt = null;
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
