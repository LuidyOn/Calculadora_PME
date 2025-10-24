document.addEventListener('DOMContentLoaded', () => {
    // --- NOVO: LÓGICA PARA O MENU DROPDOWN FUNCIONAR EM TODOS OS DISPOSITIVOS ---
    const calculatorSelector = document.querySelector('.calculator-selector');
    const calculatorDropdown = document.querySelector('.calculator-dropdown');

    if (calculatorSelector) {
        // Adiciona um "ouvinte" de clique ao botão do menu
        calculatorSelector.addEventListener('click', (event) => {
            // Impede que o clique se propague e feche o menu imediatamente
            event.stopPropagation(); 
            // Adiciona ou remove a classe 'show' para exibir/ocultar o menu
            calculatorDropdown.classList.toggle('show');
        });
    }

    // Fecha o menu se o usuário clicar em qualquer lugar fora dele
    window.addEventListener('click', (event) => {
        if (calculatorDropdown && calculatorDropdown.classList.contains('show')) {
            // Se o alvo do clique NÃO for o menu ou um filho dele, remove a classe 'show'
            if (!calculatorSelector.contains(event.target)) {
                calculatorDropdown.classList.remove('show');
            }
        }
    });

    // --- NOVO: LÓGICA PARA O BOTÃO "ADICIONAR À TELA INICIAL" ---
    
    let deferredPrompt; // Variável para guardar o evento de instalação
    const installButton = document.getElementById('btn-install-app');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Impede que o mini-infobar do Chrome apareça no celular
        e.preventDefault();
        // Guarda o evento para que ele possa ser disparado mais tarde.
        deferredPrompt = e;
        // Mostra o nosso botão personalizado
        if (installButton) {
            installButton.style.display = 'block'; // Mostra o botão!
            console.log('`beforeinstallprompt` capturado, botão mostrado.');
        } else {
            console.error('Botão de instalação não encontrado no DOM.');
        }
    });

    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                console.log('Nenhum prompt de instalação disponível.');
                return; // Se o evento não foi capturado, não faz nada
            }
            
            // Mostra o prompt de instalação oficial do navegador
            deferredPrompt.prompt();
            console.log('Prompt de instalação mostrado.');
            
            // Espera o usuário escolher (aceitar ou recusar)
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Escolha do usuário: ${outcome}`);
            
            // Não precisamos mais do evento, seja qual for a escolha
            deferredPrompt = null;
            
            // Esconde o nosso botão, pois ele não pode ser usado duas vezes
            installButton.style.display = 'none';
        });
    }

    // Opcional: Ouve se o app foi instalado com sucesso
    window.addEventListener('appinstalled', () => {
      console.log('PWA foi instalado com sucesso!');
      // Esconde o botão se ele ainda estiver visível por algum motivo
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
