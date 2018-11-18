import {Pool, createPool} from 'generic-pool'
import {Browser} from 'puppeteer'
import {launchBrowser} from './utils'

export interface IBrowserPoolOptions {
  poolSize?: number,
  timeout?: number
}

const borrowedResources: Map<Browser, Date> = new Map()
export default class BrowserPool {
  static factory = {
    create () {
      return launchBrowser()
    },
    destroy (browser: Browser): Promise<void> {
      return browser.close()
    }
  }

  private pool: Pool<Browser>
  private timeout?: number

  constructor (options: IBrowserPoolOptions = {}) {
    this.pool = createPool<Browser>(BrowserPool.factory, {
      max: Math.max(options.poolSize || 10, 10),
      min: 5,
      acquireTimeoutMillis: this.timeout
    })

    if (options.timeout) {
      setInterval(this.timeoutCheck.bind(this), options.timeout)
      this.timeout = options.timeout
    }
  }

  async acquire (): Promise<Browser> {
    const browser = await this.pool.acquire()
    borrowedResources.set(browser, new Date())
    return browser
  }

  async release (browser: Browser): Promise<void> {
    await this.pool.release(browser)
    borrowedResources.delete(browser)
  }

  async destroy (browser: Browser): Promise<void> {
    await this.pool.destroy(browser)
    borrowedResources.delete(browser)
  }

  async timeoutCheck (): Promise<void> {
    if (!this.timeout) {
      return
    }

    const now = Date.now()
    const timeout = this.timeout * 2
    for (const [browser, createdAt] of borrowedResources.entries()) {
      if (now - createdAt.valueOf() > timeout) {
        console.error('Possible browser leak detected')
        try {
          await this.pool.destroy(browser)
        } catch (_) {
        }
        borrowedResources.delete(browser)
      }
    }
  }
}
