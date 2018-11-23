import {Browser, launch} from 'puppeteer'
import Debug from '../utils/debug'

const debug = Debug('browser-pool:utils')

export async function launchBrowser (retries: number = 1): Promise<Browser> {
  const launchArgs = {
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
  }

  try {
    return await launch(launchArgs)
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
