const {env} = process

export const port = getNumber(env.PORT, 3000)
export const poolSize = getNumber(env.POOL_SIZE, 10)
export const connectionTimeout = getNumber(env.CONNECTION_TIMEOUT, 60000)
export const healthCheckEndpoint = env.HEALTH_CHECK_ENDPOINT

function getNumber (value: any, defaults: number): number {
  return (typeof value === 'undefined' ? defaults : Number(value)) || defaults
}
