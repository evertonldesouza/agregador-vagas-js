// sources/programathor.js


const { chromium } = require('playwright-extra');


async function rasparProgramathor() {
    console.log("Iniciando scraping do Programathor...");
    
    let browser = null; 
    const novasVagas = []; 

    try {
        
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto("https://programathor.com.br/jobs?q=c%23");

        const cardSelector = "div.cell-list";
        await page.waitForSelector(cardSelector, { timeout: 15000 });

        const cardsVagas = await page.$$(cardSelector);

        for (const card of cardsVagas) {
            const linkEl = await card.$("a:has(h3[class*='text-24'])");
            const tituloEl = await card.$("h3[class*='text-24']");
            const empresaEl = await card.$("div.cell-list-content-icon span:first-of-type");

            if (!linkEl || !tituloEl || !empresaEl) continue;

            let link = await linkEl.getAttribute("href") || "N/A";
            if (!link.startsWith("http")) link = "https://programathor.com.br" + link;

            let titulo = await tituloEl.textContent() || "N/A";
            let empresa = await empresaEl.textContent() || "N/A";

            titulo = titulo.replace("NOVA", "").trim();
            
            const vaga = {
                titulo: titulo,
                empresa: empresa.trim(),
                linkOriginal: link,
                fonte: "Programathor",
                dataScraping: new Date()
            };
            
            novasVagas.push(vaga);
        }
    } catch (error) {
        console.error("Erro ao raspar Programathor:", error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    console.log(`Programathor finalizado. ${novasVagas.length} vagas encontradas.`);
    return novasVagas; 
}

module.exports = rasparProgramathor;