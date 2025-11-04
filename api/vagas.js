// api/vagas.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;


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



module.exports = async (req, res) => {
    try {
        const client = await connectToDatabase();
        const database = client.db("AgregadorVagasDB");
        const vagasCollection = database.collection("Vagas");

        
        const { tecnologia } = req.query;

        let filtro = {}; 
        if (tecnologia) {
            filtro.titulo = { $regex: tecnologia, $options: 'i' };
        }

        
        const vagas = await vagasCollection
            .find(filtro)
            .sort({ dataScraping: -1 })
            .toArray();

        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        res.status(200).json(vagas);

    } catch (error) {
        console.error("Erro ao buscar vagas:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
};