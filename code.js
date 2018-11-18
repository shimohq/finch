const puppeteer = require('puppeteer')
const {writeFileSync} = require('fs')

async function start () {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:3000/'
  })
  const page = await browser.newPage()
  await page.goto('https://shimo.im/docs/fFFBWrq6wZEh0Vvl');
  const ret = await page.screenshot({ path: 'screenshot.png' });
  writeFileSync('screen.png', ret)
  browser.close()
}

start().catch(console.error)
