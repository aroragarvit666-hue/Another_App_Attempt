const mockWrite = jest.fn()
jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn(() => ({ info: jest.fn(), debug: jest.fn(), error: jest.fn() })) },
  Files: { init: jest.fn(async () => ({ write: mockWrite })) }
}))
const { main } = require('../actions/upload-file/index.js')

const b64 = (s) => Buffer.from(s).toString('base64')

describe('upload-file', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when params are missing', async () => {
    const res = await main({})
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toContain('Missing')
  })

  it('returns 400 for an empty file', async () => {
    const res = await main({ fileName: 'a.txt', content: '' })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when the file exceeds the size cap', async () => {
    const big = 'x'.repeat(800 * 1024)
    const res = await main({ fileName: 'big.txt', content: b64(big) })
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toContain('too large')
  })

  it('returns 200 and stores the file on success', async () => {
    const res = await main({ fileName: '../../etc/passwd', content: b64('hello') })
    expect(res.statusCode).toBe(200)
    expect(res.body.name).toBe('passwd') // path stripped
    expect(res.body.size).toBe(5)
    expect(mockWrite).toHaveBeenCalledWith('uploads/passwd', expect.any(Buffer))
  })

  it('returns 500 when the SDK throws', async () => {
    mockWrite.mockRejectedValueOnce(new Error('storage down'))
    const res = await main({ fileName: 'a.txt', content: b64('hi') })
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('storage down')
  })
})
