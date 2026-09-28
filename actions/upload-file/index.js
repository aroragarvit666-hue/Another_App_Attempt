const { Core, Files } = require('@adobe/aio-sdk')
const { safeFileName, PREFIX } = require('../utils.js')

// Runtime caps the request payload at 1MB; base64 inflates bytes by ~33%,
// so the decoded file must stay well under that. Cap decoded size at 700KB.
const MAX_BYTES = 700 * 1024

async function main (params) {
  const logger = Core.Logger('upload-file', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('Action invoked')

    const required = ['fileName', 'content']
    const missing = required.filter(p => !params[p])
    if (missing.length > 0) {
      return { statusCode: 400, body: { error: `Missing required params: ${missing.join(', ')}` } }
    }

    // content is a base64-encoded string (data URL prefix stripped client-side)
    let buffer
    try {
      buffer = Buffer.from(params.content, 'base64')
    } catch (e) {
      return { statusCode: 400, body: { error: 'content must be base64-encoded' } }
    }

    if (buffer.length === 0) {
      return { statusCode: 400, body: { error: 'Uploaded file is empty' } }
    }
    if (buffer.length > MAX_BYTES) {
      return { statusCode: 400, body: { error: `File too large: ${buffer.length} bytes (max ${MAX_BYTES})` } }
    }

    const files = await Files.init()
    const key = PREFIX + safeFileName(params.fileName)

    await files.write(key, buffer)

    logger.info(`Stored ${buffer.length} bytes at ${key}`)
    return {
      statusCode: 200,
      body: { key, name: safeFileName(params.fileName), size: buffer.length }
    }
  } catch (error) {
    logger.error('Action failed:', error.message)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main
