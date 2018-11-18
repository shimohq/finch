import {Pool, createPool} from 'generic-pool'
import {Browser} from 'puppeteer'
import {launchBrowser} from './utils'

export interface IBrowserPoolOptions {
  poolSize?: number
}

export default class BrowserPool {
  static factory = {
    create () {
      return launchBrowser()
    },
    destroy (browser: Browser): Promise<void> {
      console.log('destroy')
      return browser.close()
    }
  }

  private pool: Pool<Browser>

  constructor (options: IBrowserPoolOptions = {}) {
    this.pool = createPool<Browser>(BrowserPool.factory, {
      max: Math.max(options.poolSize || 10, 10),
      min: 5
    })
  }

  acquire (): Promise<Browser> {
    return this.pool.acquire() as Promise<Browser>
  }

  release (browser: Browser): Promise<void> {
    return this.pool.release(browser) as Promise<void>
  }

  destroy (browser: Browser): Promise<void> {
    return this.pool.destroy(browser) as Promise<void>
  }
}
