const { Core } = require('@adobe/aio-sdk')

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('Action invoked')
    logger.debug('Params:', JSON.stringify(params))

    // Input validation
    const required = ['name']
    const missing = required.filter(p => !params[p])
    if (missing.length > 0) {
      return { statusCode: 400, body: { error: `Missing required params: ${missing.join(', ')}` } }
    }

    // Extract IMS token (require-adobe-auth: true injects this)
    const token = params.__ow_headers?.authorization?.replace('Bearer ', '')
    logger.debug('IMS token present:', Boolean(token))

    const result = { message: `Hello, ${params.name}! Welcome to App Builder.` }

    logger.info('Action completed successfully')
    return { statusCode: 200, body: result }
  } catch (error) {
    logger.error('Action failed:', error.message)
    return { statusCode: 500, body: { error: error.message } }
  }
}

exports.main = main
