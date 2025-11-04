// A API está rodando no MESMO servidor que o nosso HTML.
// Então, podemos usar uma URL relativa. Isso é muito robusto.
const API_URL = '/api/vagas';

// Espera o HTML carregar antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {
    const vagasContainer = document.getElementById('vagas-container');
    const loadingMessage = document.getElementById('loading-message');
    const btnBuscar = document.getElementById('btn-buscar');
    const filtroTech = document.getElementById('filtro-tech');

    // Função principal para buscar e exibir as vagas
    async function carregarVagas(filtro = '') {
        vagasContainer.innerHTML = ''; // Limpa os resultados antigos
        loadingMessage.style.display = 'block'; // Mostra "Carregando..."

        try {
            let url = API_URL;
            if (filtro) {
                // Adiciona o filtro de tecnologia na URL da API
                url += `?tecnologia=${encodeURIComponent(filtro)}`;
            }

            // fetch() é o "HttpClient" do JavaScript
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const vagas = await response.json();
            loadingMessage.style.display = 'none'; // Esconde "Carregando..."

            if (vagas.length === 0) {
                vagasContainer.innerHTML = '<p>Nenhuma vaga encontrada com esse filtro.</p>';
                return;
            }

            // Cria um card HTML para cada vaga
            vagas.forEach(vaga => {
                const card = document.createElement('div');
                card.className = 'card-vaga';

                // Converte a data do MongoDB para um formato legível
                const dataScraping = new Date(vaga.dataScraping).toLocaleDateString('pt-BR');

                card.innerHTML = `
                    <h3>${vaga.titulo}</h3>
                    <p><strong>Empresa:</strong> ${vaga.empresa}</p>
                    <p><strong>Fonte:</strong> ${vaga.fonte}</p>
                    <p><strong>Coletado em:</strong> ${dataScraping}</p>
                    <a href="${vaga.linkOriginal}" target="_blank">Ver vaga original</a>
                `;
                vagasContainer.appendChild(card);
            });

        } catch (error) {
            loadingMessage.style.display = 'none';
            vagasContainer.innerHTML = `<p style="color: red;">Erro ao carregar vagas. Verifique se a API (${API_URL}) está rodando.</p>`;
            console.error('Erro ao buscar vagas:', error);
        }
    }

    // Adiciona o "ouvinte" de clique no botão
    btnBuscar.addEventListener('click', () => {
        carregarVagas(filtroTech.value);
    });

    // Carrega todas as vagas na primeira vez que a página abre
    carregarVagas();
});