

const { MongoClient } = require('mongodb');
require('dotenv').config();


const rasparProgramathor = require('./sources/programathor');
const rasparTrampos = require('./sources/trampos'); 

const uri = process.env.MONGODB_URI;

async function rodarScraper() {
    console.log("🚀 Robô Orquestrador iniciado...");
    
    let dbClient = null;

    try {
        
        console.log("Conectando ao MongoDB Atlas...");
        dbClient = new MongoClient(uri);
        await dbClient.connect();
        const database = dbClient.db("AgregadorVagasDB");
        const vagasCollection = database.collection("Vagas");
        console.log("Conectado ao banco com sucesso!");

        
        console.log("Executando todos os scrapers em paralelo...");
        const [vagasProgramathor, vagasTrampos] = await Promise.all([
            rasparProgramathor(),
            rasparTrampos() 
        ]);
        
        
        const todasAsVagas = [
            ...vagasProgramathor,
            ...vagasTrampos 
        ];

        console.log(`Total de ${todasAsVagas.length} vagas encontradas em todas as fontes.`);

        
        if (todasAsVagas.length > 0) {
            let vagasNovas = 0;
            for (const vaga of todasAsVagas) {
                
                const filtro = { 
                    titulo: vaga.titulo, 
                    empresa: vaga.empresa, 
                    fonte: vaga.fonte 
                };

                
                const dados = { $setOnInsert: vaga };

                const resultado = await vagasCollection.updateOne(
                    filtro,
                    dados,
                    { upsert: true } 
                );

                if (resultado.upsertedCount > 0) {
                    vagasNovas++;
                }
            }
            console.log(`Scraping finalizado. ${vagasNovas} NOVAS vagas foram salvas no banco.`);
        } else {
            console.log("Nenhuma vaga encontrada neste ciclo.");
        }

    } catch (error) {
        console.error("Ocorreu um erro no orquestrador:", error);
    } finally {
        if (dbClient) {
            await dbClient.close();
            console.log("Conexão com MongoDB fechada.");
        }
        console.log("🚀 Robô Orquestrador finalizado.");
    }
}


rodarScraper();