const { Core, Files } = require('@adobe/aio-sdk')
const { safeFileName, PREFIX } = require('../utils.js')

async function main (params) {
  const logger = Core.Logger('delete-file', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('Action invoked')

    if (!params.name) {
      return { statusCode: 400, body: { error: 'Missing required params: name' } }
    }

    const files = await Files.init()
    const key = PREFIX + safeFileName(params.name)

    await files.delete(key)

    logger.info(`Deleted ${key}`)
    return { statusCode: 200, body: { key, deleted: true } }
  } catch (error) {
    logger.error('Action failed:', error.message)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main
