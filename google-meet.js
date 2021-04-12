const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {Telegraf} = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

puppeteer.use(StealthPlugin())

class GoogleMeet {
    constructor(email, pass, head, strict) {
        this.email = email;
        this.pass = pass;
        this.head = head;
        this.strict = strict;
        this.bot = bot;
        this.page;
    }
    
    notify = (msg)=>{
        this.bot.telegram.sendMessage(process.env.CHAT_ID,msg);
    }
    
    async schedule(url) {
        try {
            this.browser = await puppeteer.launch({
                headless: this.head,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--use-fake-ui-for-media-stream',
                    '--disable-audio-output'
                ],
            });
            
            this.page = await this.browser.newPage();
            await this.page.goto('https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin');

            await this.page.type("input#identifierId", this.email, {
                delay: 0
            });
            
            await this.page.click("div#identifierNext")

            await this.page.waitForTimeout(7000);

            await this.page.type("input[name=password]", this.pass, {
                delay: 0
            })
            await this.page.click("div#passwordNext");

            await this.page.waitForTimeout(5000);

            await this.page.goto(url);
            
            await this.page.waitForTimeout(7000);
            
            //Video Check
            try {
                await this.page.click("div.IYwVEf.HotEze.uB7U9e.nAZzG")
            } catch{}
            
            await this.page.waitForTimeout(1000);
            
            //Audio Check
            try {
                await this.page.click("div.IYwVEf.HotEze.nAZzG");
            } catch{}
            
            //Verify Video And Audio Are Stopped
            if (this.strict) {
                let audio = await this.page.evaluate('document.querySelectorAll("div.sUZ4id")[0].children[0].getAttribute("data-is-muted")');
                let video = await this.page.evaluate('document.querySelectorAll("div.sUZ4id")[1].children[0].getAttribute("data-is-muted")');

                if (audio === "false" || video === "false") {
                    this.notify ("Unable To Join, Some Audio/Video Error Occurred");
                    return;
                }
                this.notify("Joining Meeting");
            }

            await this.page.waitForTimeout(1000);
            await this.page.click("span.NPEfkd.RveJvd.snByac");
            await this.page.waitForTimeout(4000);
            let buf = await this.page.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
        }
        catch(err) {
            this.notify(err.message);
            this.end();
        }
    }
    
    async getScreenshot(){
        try{
            let buf = await this.page.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
        }
        catch(err){
            this.notify(err.message);
        }
    }
    
    async getSignInScreenshot(){
        try{
            this.browser = await puppeteer.launch({
                    headless: this.head,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--use-fake-ui-for-media-stream',
                        '--disable-audio-output'
                    ],
            });
            this.page = await this.browser.newPage()
            await this.page.goto('https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin')

            // Login Start
	    console.log(this.email,this.password)
            await this.page.type("input#identifierId", this.email, {
                delay: 0
            })

            await this.page.click("div#identifierNext")
            await this.page.waitForTimeout(7000)
            await this.page.type("input.whsOnd.zHQkBf", this.pass, {
                delay: 0
            })
            await this.page.click("div#passwordNext")
            await this.page.waitForTimeout(5000)
            let buf=await this.page.screenshot();
            this.bot.telegram.sendPhoto(process.env.CHAT_ID,{source:buf});
        }
        catch(err){
            this.notify(err.message);
            this.end();
        }
    }

    async end() {
        try{
            await this.browser.close();
        }
        catch{}
    }
}

module.exports = GoogleMeet;
