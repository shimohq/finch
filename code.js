const puppeteer = require('puppeteer')

async function start () {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:3000/'
  })
  const page = await browser.newPage()
  page.setViewport({width: 1200, height: 3200, deviceScaleFactor: 2})
  await page.goto('http://baidu.com')
  console.log(await page.title())
  browser.close()
}

const all = {
  success: 0,
  failed: 0,
  totalTime: 0
}

const array = []
for (let i = 0; i < 1; i++) {
  array.push(i)
}

Promise.all(array.map(() => {
  const now = Date.now()
  return start().then(() => {
    all.success += 1
    all.totalTime += Date.now() - now
  }, () => {
    all.failed += 1
  })
})).then(() => {
  console.log(all)
  console.log(all.totalTime / all.success)
})
