import * as puppeteer from 'puppeteer'
import Debug from '../utils/debug'
import * as packageJson from 'puppeteer/package.json'
import {headless} from '../config'

const browserFetcher = (puppeteer as any).createBrowserFetcher()
const revision = packageJson.puppeteer.chromium_revision
const {executablePath} = browserFetcher.revisionInfo(revision)

const debug = Debug('browser-pool:utils')
debug('got executablePath: %s', executablePath)

export async function launchBrowser (retries: number = 1): Promise<puppeteer.Browser> {
  const launchArgs = {
    headless,
    executablePath,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
  }

  try {
    return await puppeteer.launch(launchArgs)
  } catch (err) {
    console.error(err)

    if (retries > 0) {
      debug(`Issue launching Chrome, retrying ${retries} times.`)
      return await launchBrowser(retries - 1)
    }

    debug(`Issue launching Chrome, retries exhausted.`)
    throw err
  }
}
