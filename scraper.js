// 1. IMPORTAR NOSSOS PACOTES
const { chromium } = require('playwright'); // Usamos 'chromium' do Playwright
const { MongoClient } = require('mongodb'); // Driver oficial do MongoDB
require('dotenv').config(); // Carrega o .env (nossa senha) no processo

// 2. BUSCAR A STRING DE CONEXÃO SECRETA
// process.env.MONGODB_URI é como o C# lê o appsettings
// Ele busca a variável MONGODB_URI que você colocou no .env
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("Erro: String de conexão MONGODB_URI não encontrada no arquivo .env");
    process.exit(1); // Encerra o script se não achar a senha
}

// 3. FUNÇÃO PRINCIPAL DO SCRAPER
// Usamos 'async' para poder usar 'await' (como no C#)
async function rodarScraper() {
    console.log("🚀 Robô Scraper iniciado...");
    
    let browser = null;
    let dbClient = null;

    try {
        // 4. CONECTAR AO BANCO DE DADOS
        console.log("Conectando ao MongoDB Atlas...");
        dbClient = new MongoClient(uri);
        await dbClient.connect();
        
        const database = dbClient.db("AgregadorVagasDB"); 
        const vagasCollection = database.collection("Vagas"); 

        console.log("Conectado ao banco com sucesso!");

        // 5. INICIAR O PLAYWRIGHT
        console.log("Iniciando o Playwright...");
        browser = await chromium.launch({ headless: true }); 
        const page = await browser.newPage();

        // 6. RASPAR O PROGRAMATHOR
        console.log("Navegando para 'programathor.com.br'...");
        await page.goto("https://programathor.com.br/jobs?q=c%23");

        const cardSelector = "div.cell-list";
        await page.waitForSelector(cardSelector, { timeout: 15000 });

        // page.querySelectorAll mudou para page.$$
        const cardsVagas = await page.$$(cardSelector); // <-- MUDANÇA AQUI
        console.log(`Encontrados ${cardsVagas.length} cards no Programathor.`);

        let vagasSalvas = 0;
        let vagasProcessadas = 0;
        for (const card of cardsVagas) {
            
            // 7. EXTRAIR OS DADOS
            // card.querySelector mudou para card.$
            const linkEl = await card.$("a:has(h3[class*='text-24'])");     // <-- MUDANÇA AQUI
            const tituloEl = await card.$("h3[class*='text-24']");         // <-- MUDANÇA AQUI
            const empresaEl = await card.$("div.cell-list-content-icon span:first-of-type"); // <-- MUDANÇA AQUI

            if (!linkEl || !tituloEl || !empresaEl) continue;

            let link = await linkEl.getAttribute("href") || "N/A";
            if (!link.startsWith("http")) link = "https://programathor.com.br" + link;
            
            let titulo = await tituloEl.textContent() || "N/A";
            let empresa = await empresaEl.textContent() || "N/A";

            titulo = titulo.replace("NOVA", "").trim();
            
            // 8. CRIAR O OBJETO VAGA
            const vaga = {
                titulo: titulo,
                empresa: empresa.trim(),
                linkOriginal: link,
                fonte: "Programathor",
                dataScraping: new Date() 
            };

            // 9. SALVAR NO MONGODB
            const resultado = await vagasCollection.updateOne(
                { titulo: vaga.titulo, empresa: vaga.empresa, fonte: vaga.fonte }, 
                { $setOnInsert: vaga },
                { upsert: true }
            );
            
            vagasProcessadas++;
            // O 'upsertedCount' nos diz se a vaga foi NOVA (1) ou duplicada (0)
            if (resultado.upsertedCount > 0) {
                vagasSalvas++;
            }
        }
        
        console.log(`Scraping finalizado. ${vagasProcessadas} vagas processadas.`);
        console.log(`${vagasSalvas} NOVAS vagas foram salvas no banco.`);

    } catch (error) {
        console.error("Ocorreu um erro no scraper:", error);
    } finally {
        // 10. FECHAR TUDO
        if (browser) {
            await browser.close();
            console.log("Playwright fechado.");
        }
        if (dbClient) {
            await dbClient.close();
            console.log("Conexão com MongoDB fechada.");
        }
    }
}

// 11. EXECUTAR A FUNÇÃO
rodarScraper();