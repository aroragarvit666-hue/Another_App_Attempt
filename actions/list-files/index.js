const { Core, Files } = require('@adobe/aio-sdk')
const { PREFIX } = require('../utils.js')

async function main (params) {
  const logger = Core.Logger('list-files', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('Action invoked')

    const files = await Files.init()
    const entries = await files.list(PREFIX)

    const items = await Promise.all((entries || []).map(async e => ({
      key: e.name,
      name: e.name.replace(PREFIX, ''),
      size: e.contentLength,
      lastModified: e.lastModified,
      // short-lived read URL so the UI can offer a direct download
      url: await files.generatePresignURL(e.name, { expiryInSeconds: 600, permissions: 'r' })
    })))

    logger.info(`Listed ${items.length} file(s)`)
    return { statusCode: 200, body: { files: items } }
  } catch (error) {
    logger.error('Action failed:', error.message)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main
