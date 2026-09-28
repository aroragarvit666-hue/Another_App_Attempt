const mockDelete = jest.fn()
jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn(() => ({ info: jest.fn(), debug: jest.fn(), error: jest.fn() })) },
  Files: { init: jest.fn(async () => ({ delete: mockDelete })) }
}))
const { main } = require('../actions/delete-file/index.js')

describe('delete-file', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when name is missing', async () => {
    const res = await main({})
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toContain('Missing')
  })

  it('returns 200 and deletes the sanitized key on success', async () => {
    const res = await main({ name: 'report.pdf' })
    expect(res.statusCode).toBe(200)
    expect(res.body.deleted).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith('uploads/report.pdf')
  })

  it('returns 500 when the SDK throws', async () => {
    mockDelete.mockRejectedValueOnce(new Error('delete failed'))
    const res = await main({ name: 'a.txt' })
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('delete failed')
  })
})
