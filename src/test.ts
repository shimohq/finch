import * as puppeteer from 'puppeteer'
import {writeFileSync} from 'fs'

async function start () {
  console.time('get browser')
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:3000/'
  })
  console.timeEnd('get browser')
  throw new Error('')

  // Everything else stays the same
  console.time('new page')
  const page = await browser.newPage()
  console.timeEnd('new page')
  console.time('goto')
  await page.goto('https://shimo.im/');
  console.timeEnd('goto')
  console.time('screenshot')
  const ret = await page.screenshot({ path: 'screenshot.png' });
  console.timeEnd('screenshot')
  writeFileSync('screen.png', ret)
  browser.close()
}

start().catch(console.error)
