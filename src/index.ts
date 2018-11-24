import FinchServer from './server'
import * as config from './config'

const server = new FinchServer()
server.listen(config.port, () => {
  console.log('Started successfully with config:')
  console.log(config)
})
