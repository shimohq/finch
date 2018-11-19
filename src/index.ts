import FinchServer from './server'

const server = new FinchServer()
const port = typeof process.env.PORT === 'undefined' ? 3000 : Number(process.env.PORT)
server.listen(port, () => {
  console.log(`Listening port ${port}`)
})
