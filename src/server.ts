import * as express from 'express'
import {createServer, Server, IncomingMessage} from 'http'
import {createProxyServer} from 'http-proxy'
import BrowserPool from './BrowserPool'
import {parse} from 'url'
import {Socket} from 'net'
import {maxPoolSize, minPoolSize, healthCheckEndpoint, connectionTimeout} from './config'

export default class FinchServer {
  private app = express()
  private browserPool = new BrowserPool({maxPoolSize, minPoolSize, timeout: connectionTimeout / 2})
  private proxy = createProxyServer()
  private server: Server

  constructor () {
    if (healthCheckEndpoint) {
      this.app.get(healthCheckEndpoint, (_, res) => {
        res.end('Hey! I am Finch and I am healthy!')
      })
    }
    this.server = createServer(async (req, res) => this.app(req, res))
      .on('upgrade', (req: IncomingMessage, socket: Socket, head: any) => {
        this.upgrade(req, socket, head).catch((err) => {
          if (socket.writable) {
            console.error(err)
            socket.end('HTTP/1.1 500 Internal Server Error')
          }
        })
      })

    this.proxy.on('error', (err, _req: IncomingMessage, res) => {
      if (res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
      }

      res.end(`Issue communicating with Chrome: ${err.message}`)
    })

    this.proxy.on('close', (_, socket) => {
      if (socket.writable) {
        socket.end()
      }
    })
  }

  public listen (port: number, callback?: Function): void {
    this.server.listen(port, callback)
  }

  public async upgrade(req: IncomingMessage, socket: Socket, head): Promise<void> {
    let closed = false
    const earlyClose = () => {
      closed = true
    }
    socket.once('close', earlyClose)

    const browser = await this.browserPool.acquire().catch((err) => {
      socket.end('HTTP/1.1 503 Service Unavailable')
      throw err
    })

    if (closed || !socket.writable) {
      await this.browserPool.release(browser)
      return
    }
    socket.removeListener('close', earlyClose)

    const handler = new Promise((resolve, reject) => {
      socket.once('close', resolve)
      socket.once('error', reject)

      const {port, pathname} = parse(browser.wsEndpoint())
      const target = `ws://127.0.0.1:${port}`
      req.url = pathname
      this.proxy.ws(req, socket, head, {target})
    })

    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        if (socket.writable) {
          socket.end('HTTP/1.1 408 Request Timeout')
        }
        reject(new Error('Job has been timed out'))
      }, connectionTimeout)
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
