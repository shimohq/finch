# Finch
Puppeteer as a Service

## Features

* Optimized for cold start by introducing a browser pool
* Emoji friendly! ❤️
* [Google Noto Font](https://www.google.com/get/noto/) is used, so no more "tofu"s!
* Resources will be carefully reclaimed to avoid any leakings in a long run
* We love Docker
* Easy to use and approachable if you've used Puppeteer before

## How to use

A Dockerfile is provided for setting up Finch easier:

```shell
docker build -t finch .
docker run -p 9001:9001 finch
```

A Puppeteer cluster will be listening to the port 9001 for you to use as native Puppeteer:

```
// Replace puppeteer.launch with puppeteer.connect
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://127.0.0.1:9001/'
});

// Everything else stays the same
const page = await browser.newPage();
await page.goto('https://example.com/');
await page.screenshot({ path: 'screenshot.png' });
browser.close();
```
