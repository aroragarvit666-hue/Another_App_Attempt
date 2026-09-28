const mockList = jest.fn()
const mockPresign = jest.fn(async () => 'https://signed.example/file')
jest.mock('@adobe/aio-sdk', () => ({
  Core: { Logger: jest.fn(() => ({ info: jest.fn(), debug: jest.fn(), error: jest.fn() })) },
  Files: { init: jest.fn(async () => ({ list: mockList, generatePresignURL: mockPresign })) }
}))
const { main } = require('../actions/list-files/index.js')

describe('list-files', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with a mapped, presigned file list', async () => {
    mockList.mockResolvedValueOnce([
      { name: 'uploads/a.txt', contentLength: 10, lastModified: '2026-09-28T00:00:00Z' }
    ])
    const res = await main({})
    expect(res.statusCode).toBe(200)
    expect(res.body.files).toHaveLength(1)
    expect(res.body.files[0]).toMatchObject({ name: 'a.txt', size: 10, url: 'https://signed.example/file' })
  })

  it('returns 200 with an empty array when there are no files', async () => {
    mockList.mockResolvedValueOnce([])
    const res = await main({})
    expect(res.statusCode).toBe(200)
    expect(res.body.files).toEqual([])
  })

  it('returns 500 when the SDK throws', async () => {
    mockList.mockRejectedValueOnce(new Error('list failed'))
    const res = await main({})
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('list failed')
  })
})
