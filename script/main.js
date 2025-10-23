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
});

// --- REGISTRA O SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js') // Caminho para o seu service worker
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(error => {
        console.error('Falha ao registrar o Service Worker:', error);
      });
  });
} else {
    console.warn('Service Worker não é suportado neste navegador.');
}
