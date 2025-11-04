// api/vagas.js

const { MongoClient } = require('mongodb');

// Carrega a string de conexão (o Vercel usa as mesmas "Environment Variables" que o Render)
const uri = process.env.MONGODB_URI;

// --- Otimização de Cache ---
// Nós guardamos o 'dbClient' fora da função.
// Isso permite que o Vercel "reaproveite" a conexão do banco
// entre chamadas, tornando-o MUITO mais rápido.
let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
}
// -------------------------


// Esta é a nossa "Função Serverless".
// 'module.exports' é como o Node.js "exporta" a função.
module.exports = async (req, res) => {
    try {
        // 1. Conecta (ou re-usa) a conexão com o banco
        const client = await connectToDatabase();
        const database = client.db("AgregadorVagasDB");
        const vagasCollection = database.collection("Vagas");

        // 2. Pega o filtro da URL (ex: /api/vagas?tecnologia=c#)
        // (Note que 'req.query' é o mesmo que no Express)
        const { tecnologia } = req.query;

        let filtro = {}; 
        if (tecnologia) {
            filtro.titulo = { $regex: tecnologia, $options: 'i' };
        }

        // 3. Busca os dados (mesma lógica de antes)
        const vagas = await vagasCollection
            .find(filtro)
            .sort({ dataScraping: -1 })
            .toArray();

        // 4. [IMPORTANTE] Adiciona o cabeçalho de CORS
        // Precisamos dizer ao Vercel para permitir que nosso frontend
        // (que vem de um domínio diferente) acesse a API.
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // 5. Retorna o JSON
        res.status(200).json(vagas);

    } catch (error) {
        console.error("Erro ao buscar vagas:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
};