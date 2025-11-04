

const path = require('path'); 
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function rasparTrampos() {
    console.log("Iniciando scraping do Trampos.co (COM MODO STEALTH v14 - Extração Correta)...");

    let browser = null;
    let page = null;
    const novasVagas = [];

    try {
        browser = await chromium.launch({ headless: true });
        page = await browser.newPage();

        await page.goto("https://trampos.co/oportunidades?q=c%23");

        
        try {
            const cookieButtonSelector = "text=Aceitar";
            console.log("Procurando o banner de cookies (text=Aceitar)...");
            await page.waitForSelector(cookieButtonSelector, { timeout: 10000 });
            await page.click(cookieButtonSelector);
            console.log("Banner de cookies aceito.");
        } catch (error) {
            console.log("Banner de cookies não encontrado ou já aceito.");
        }
        try {
            const notificationButtonSelector = "button#onesignal-slidedown-cancel-button";
            console.log("Procurando o pop-up de notificação (OneSignal)...");
            await page.waitForSelector(notificationButtonSelector, { timeout: 5000 });
            await page.click(notificationButtonSelector);
            console.log("Pop-up de notificação fechado.");
        } catch (error) {
            console.log("Pop-up de notificação não encontrado.");
        }
        


        
        console.log("Rolando a página (modo inteligente) para carregar 'lazy load'...");

        
        const cardContainerSelector = "div.opportunity-box";

        let cardCount = 0;
        while (true) {
            const currentCards = await page.$$(cardContainerSelector);
            const currentCount = currentCards.length;

            console.log(`Cards (div.opportunity-box) visíveis no momento: ${currentCount}`);

            if (currentCount == 0) {
                console.warn("Nenhum card 'div.opportunity-box' encontrado.");
                break; 
            }
            if (currentCount === cardCount && cardCount > 0) { // <-- Verificação extra
                console.log("Rolagem 'lazy load' finalizada. Não há mais cards para carregar.");
                break; 
            }
            cardCount = currentCount;
            const lastCard = currentCards[currentCount - 1];
            await lastCard.scrollIntoViewIfNeeded();
            console.log("Rolando para o último card... esperando novos cards...");
            await page.waitForTimeout(2500); 
        }

        const allCardContainers = await page.$$(cardContainerSelector);
        console.log(`Total de ${allCardContainers.length} cards encontrados. Extraindo dados...`);

        for (const cardContainer of allCardContainers) {

            
            const linkEl = await cardContainer.$("a.ember-view.inner");
            const tituloEl = await cardContainer.$("div.info h4");

            
            const logoImgEl = await cardContainer.$("div.logo img");
            let empresa = "Empresa não informada"; // Valor padrão
            if (logoImgEl) {
                
                empresa = await logoImgEl.getAttribute("alt") || "Empresa não informada";
            }

            if (!linkEl || !tituloEl) {
                console.warn("Card do Trampos.co pulado (não encontrou link ou título DENTRO do box).");
                continue;
            }

            const link = await linkEl.getAttribute("href") || "N/A";
            const titulo = await tituloEl.textContent() || "N/A";

            const vaga = {
                titulo: titulo.trim(),
                empresa: empresa.trim(), // Será o 'alt' da imagem
                linkOriginal: "https://trampos.co" + link,
                fonte: "Trampos.co",
                dataScraping: new Date()
            };

            novasVagas.push(vaga);
        }
    } catch (error) {
        
        if (error.name === 'TimeoutError' && page) {
             const screenshotPath = path.join(__dirname, '..', 'trampos_FALHA_screenshot_v5.png');
             console.log(`!!! ERRO DE TIMEOUT! SALVANDO SCREENSHOT EM: ${screenshotPath} !!!`);
             await page.screenshot({ path: screenshotPath, fullPage: true });
             console.log("Screenshot de depuração salvo.");
        } else {
             console.error("Erro ao raspar Trampos.co:", error);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    console.log(`Trampos.co finalizado. ${novasVagas.length} vagas encontradas.`);
    return novasVagas;
}

module.exports = rasparTrampos;