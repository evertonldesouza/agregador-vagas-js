const API_URL = '/api/vagas';

document.addEventListener('DOMContentLoaded', () => {
    const vagasContainer = document.getElementById('vagas-container');
    const loadingMessage = document.getElementById('loading-message');
    const btnBuscar = document.getElementById('btn-buscar');
    const filtroTech = document.getElementById('filtro-tech');

    async function carregarVagas(filtro = '') {
        vagasContainer.innerHTML = ''; 
        loadingMessage.style.display = 'block';

        try {
            let url = API_URL;
            if (filtro) {
                url += `?tecnologia=${encodeURIComponent(filtro)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const vagas = await response.json();
            loadingMessage.style.display = 'none'; 

            if (vagas.length === 0) {
                vagasContainer.innerHTML = '<p>Nenhuma vaga encontrada com esse filtro.</p>';
                return;
            }

            vagas.forEach(vaga => {
                const card = document.createElement('div');
                card.className = 'card-vaga';

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

    btnBuscar.addEventListener('click', () => {
        carregarVagas(filtroTech.value);
    });

    carregarVagas();
});