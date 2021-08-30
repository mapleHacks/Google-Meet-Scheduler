const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

puppeteer.use(StealthPlugin())

class GoogleMeet {
    constructor(email, pass, head, strict) {
        this.email = email;
        this.pass = pass;
        this.head = head;
        this.strict = strict;
        this.bot = bot;
        this.browserIsActive = false;
        newPage = {};
    }
    
    async createBrowser() {
        this.browser = await puppeteer.launch({
            headless: this.head,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-fake-ui-for-media-stream',
                '--disable-audio-output'
            ],
        });
    }

    notify = (msg)=>{
        this.bot.telegram.sendMessage(process.env.CHAT_ID,msg);
    }

    async accountLogin(newPage) {
		await newPage.goto('https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin');
		
        // Login Start
		await newPage.type("input#identifierId", this.email, {
			delay: 0
		})
		await newPage.click("div#identifierNext");

		await newPage.waitForTimeout(7000);

		await newPage.type("input[name=password]", this.pass, {
			delay: 0
		})

		await newPage.click("div#passwordNext");

		await newPage.waitForTimeout(5000);
	}
    
    async schedule(url,meetID) {
        try {
            if (!this.browserIsActive) {
				await this.createBrowser();
			}
            
            const newPage = await this.browser.newPage();

            if (!this.browserIsActive) {
				await this.accountLogin(newPage);
			}

            await newPage.waitForTimeout(7000);
            
            await newPage.goto(url);
            //Video Check
            try {
                await newPage.click("div.IYwVEf.HotEze.uB7U9e.nAZzG")
            } catch{}
            
            await newPage.waitForTimeout(1000);
            
            //Audio Check
            try {
                await newPage.click("div.IYwVEf.HotEze.nAZzG");
            } catch{}
            
            //Verify Video And Audio Are Stopped
            if (this.strict) {
                let audio = await newPage.evaluate('document.querySelectorAll("div.GKGgdd")[0].children[0].getAttribute("data-is-muted")');
                let video = await newPage.evaluate('document.querySelectorAll("div.GKGgdd")[1].children[0].getAttribute("data-is-muted")');

                if (audio === "false" || video === "false") {
                    this.notify ("Unable To Join, Some Audio/Video Error Occurred");
                    return;
                }
                this.notify("Joining Meeting");
            }

            this.page[meetID] = newPage;
            await newPage.waitForTimeout(1000);
            await newPage.click("span.NPEfkd.RveJvd.snByac");
            await newPage.waitForTimeout(4000);
            let buf = await newPage.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
            this.browserIsActive = true;
        }
        catch(err) {
            this.notify(err.message);
            this.browserIsActive = false;
            return false;
        }
    }
    
    async getScreenshot(){
        try{
            let buf = await newPage.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
        }
        catch(err){
            this.notify(err.message);
        }
    }
    
    async getSignInScreenshot(){
        try{
            if (!this.browserIsActive) 
				await this.createBrowser();
            
            const newPage = await this.browser.newPage();

            if (!this.browserIsActive) 
				await this.accountLogin(newPage);

            await newPage.waitForTimeout(7000);

            let buf = await newPage.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
        }
        catch(err){
            this.notify(err.message);
            this.closeBrowser()
        }
    }


    async closeTab(ind) {
		await this.page[ind].close();
	}

    async closeBrowser() {
        try{
            await this.browser.close();
            this.browserIsActive = false;
        }
        catch{}
    }

    getBrowserIsActive() {
		return this.browserIsActive;
	}
}

module.exports = GoogleMeet;
