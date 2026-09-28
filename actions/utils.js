/* Shared helpers for file-vault actions */

/**
 * Sanitize a user-supplied file name so it is safe to use as a Files SDK key.
 * Strips path separators and keeps a conservative character set.
 */
function safeFileName (name) {
  const base = String(name || '').split(/[\\/]/).pop().trim()
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.slice(0, 120) || 'unnamed'
}

/** All uploaded files live under this Files SDK prefix. */
const PREFIX = 'uploads/'

module.exports = { safeFileName, PREFIX }
