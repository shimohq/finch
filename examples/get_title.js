const puppeteer = require('puppeteer')

async function start () {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:3000/'
  })
  const page = await browser.newPage()
  await page.goto('http://baidu.com')
  console.log(await page.title())
  browser.close()
}

start()
