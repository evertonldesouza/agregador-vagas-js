// 1. IMPORTAR OS PACOTES
const express = require('express');        // Nosso framework de API (como o ASP.NET Core)
const { MongoClient } = require('mongodb'); // Nosso driver do banco
require('dotenv').config();                // Para carregar nossa senha do .env

// 2. CONFIGURAÇÕES
const uri = process.env.MONGODB_URI; // Pega a string de conexão do .env
const app = express();                 // Cria a aplicação Express
const port = process.env.PORT || 3000; // Define a porta (3000 por padrão)

// Diz ao Express para servir arquivos estáticos (HTML/CSS/JS) da pasta 'public'
app.use(express.static('public'));

// Variável para guardar a conexão com o banco (para não reconectar toda hora)
let dbClient;

// 3. FUNÇÃO PRINCIPAL DA API (async)
async function startServer() {
    try {
        // 4. CONECTAR AO BANCO (uma vez, ao iniciar a API)
        console.log("Conectando ao MongoDB Atlas...");
        dbClient = new MongoClient(uri);
        await dbClient.connect();
        console.log("Conectado ao banco com sucesso!");

        const database = dbClient.db("AgregadorVagasDB");
        const vagasCollection = database.collection("Vagas");

        // 5. O ENDPOINT (O "VagasController" do C#)
        // app.get() cria um endpoint HTTP GET
        // '/api/vagas' é a URL que vamos chamar
        app.get('/api/vagas', async (req, res) => {
            console.log("Recebida requisição GET em /api/vagas");
            try {
                // Pega o filtro da URL (ex: /api/vagas?tecnologia=c#)
                const { tecnologia } = req.query;

                let filtro = {}; // Filtro vazio por padrão (pega tudo)

                if (tecnologia) {
                    // $regex: "busca por texto", $options: "i" (ignora maiúscula/minúscula)
                    // Isto é o ".Where(v => v.Titulo.ToLower().Contains(...))" do C#
                    filtro.titulo = { $regex: tecnologia, $options: 'i' };
                }

                // .find(filtro) = "SELECT * FROM Vagas WHERE ..."
                // .sort({ dataScraping: -1 }) = "ORDER BY dataScraping DESC"
                const vagas = await vagasCollection
                    .find(filtro)
                    .sort({ dataScraping: -1 })
                    .toArray();

                // res.json() envia a resposta como JSON (igual ao Ok(vagas))
                res.json(vagas);

            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });

        // 6. INICIAR O SERVIDOR
        app.listen(port, () => {
            console.log(`🚀 Servidor da API rodando em http://localhost:${port}`);
        });

    } catch (error) {
        console.error("Falha ao conectar ao banco de dados:", error);
        process.exit(1);
    }
}

// 7. EXECUTAR A API
startServer();