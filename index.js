const express = require('express');        
const { MongoClient } = require('mongodb'); 
require('dotenv').config();                

const uri = process.env.MONGODB_URI; 
const app = express();                
const port = process.env.PORT || 3000; 

app.use(express.static('public'));

let dbClient;

async function startServer() {
    try {
        console.log("Conectando ao MongoDB Atlas...");
        dbClient = new MongoClient(uri);
        await dbClient.connect();
        console.log("Conectado ao banco com sucesso!");

        const database = dbClient.db("AgregadorVagasDB");
        const vagasCollection = database.collection("Vagas");


        app.get('/api/vagas', async (req, res) => {
            console.log("Recebida requisição GET em /api/vagas");
            try {
                
                const { tecnologia } = req.query;

                let filtro = {}; 

                if (tecnologia) {
                    filtro.titulo = { $regex: tecnologia, $options: 'i' };
                }

                const vagas = await vagasCollection
                    .find(filtro)
                    .sort({ dataScraping: -1 })
                    .toArray();

                res.json(vagas);

            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
                res.status(500).json({ message: "Erro interno do servidor" });
            }
        });

        app.listen(port, () => {
            console.log(`🚀 Servidor da API rodando em http://localhost:${port}`);
        });

    } catch (error) {
        console.error("Falha ao conectar ao banco de dados:", error);
        process.exit(1);
    }
}

startServer();