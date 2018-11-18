import * as express from 'express'
import {createServer, Server, IncomingMessage} from 'http'
import {createProxyServer} from 'http-proxy'
import BrowserPool from './BrowserPool'
import {parse} from 'url'
import {Socket} from 'net'

const {CONNECTION_TIMEOUT} = process.env

export default class FinchServer {
  private app = express()
  private browserPool = new BrowserPool({poolSize: 10})
  private proxy = createProxyServer()
  private server: Server

  constructor () {
    this.app.get('/', (req, res) => {
      res.end('Hello Finch!')
    })
    this.server = createServer(async (req, res) => this.app(req, res)).on('upgrade', (req: IncomingMessage, socket: Socket, head: any) => {
      this.upgrade(req, socket, head).then(console.log.bind(console, 'log')).catch(console.error.bind(console, 'error'))
    })
    this.proxy.on('error', (err, _req: IncomingMessage, res) => {
      if (res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
      }

      res.end(`Issue communicating with Chrome`)
    })
  }

  public listen (port: number): void {
    this.server.listen(port)
  }

  public async upgrade(req: IncomingMessage, socket: Socket, head): Promise<void> {
    let closed = false
    const earlyClose = () => {
      closed = true
    }
    socket.once('close', earlyClose)

    const browser = await this.browserPool.acquire().catch((err) => {
      socket.end()
      throw err
    })
    if (closed || socket.destroyed) {
      await this.browserPool.release(browser)
      return
    }

    socket.removeListener('close', earlyClose)

    const handler = new Promise((resolve, reject) => {
      socket.once('close', () => {
        resolve()
      })

      socket.once('error', (err) => {
        reject(err)
      })

      const {port, pathname} = parse(browser.wsEndpoint())
      const target = `ws://127.0.0.1:${port}`
      req.url = pathname
      this.proxy.ws(req, socket, head, {target})
    })

    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        socket.end()
        reject(new Error('Job has been timed out'))
      }, (CONNECTION_TIMEOUT as unknown as number) || 60000)
    })

    return Promise.race([handler, timeout]).then(
      () => this.browserPool.destroy(browser),
      async (err) => {
        await this.browserPool.destroy(browser)
        throw err
      }
    )
  }
}
