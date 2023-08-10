import dayjs from "dayjs"
import {
  DeleteUploadData,
  FetchUploadData,
  GetLatestUploadData,
  InsertUploadData,
  UpdateUploadData,
  UploadData,
} from "./upload"

const DBMock = {
  returning: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnValue([1]),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  first: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnValue(1),
  whereRaw: jest.fn().mockReturnThis(),
}

jest.mock("../database/knexfile", () => ({
  tables: { upload: "upload_table" },
  db: jest.fn().mockImplementation(() => DBMock),
}))

describe("Test Upload File", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should insert upload data", async () => {
    const data: UploadData = {
      file_id: "1234dslkf",
      upload_url: "test_url",
      filepath: "test_filepath",
      filesize: 123,
      rest_start: 456,
      status: true,
      created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    }

    const insertedId = await InsertUploadData(data)

    expect(insertedId[0]).toBe(1)
    expect(DBMock.returning).toHaveBeenCalledWith("id")
    expect(DBMock.insert).toHaveBeenCalledWith(data)
  })

  it("should fetch upload data", async () => {
    DBMock.select.mockReturnValueOnce([
      {
        id: 1,
        upload_url: "test_url",
        filepath: "test_filepath",
        filesize: 123,
        rest_start: 456,
        status: true,
        created_at: "2023-08-03T00:00:00.000Z",
      },
    ])

    const result = await FetchUploadData()

    expect(result).not.toBeNull()
    expect(DBMock.select).toHaveBeenCalled()
  })

  it("should last upload data", async () => {
    DBMock.first.mockReturnValueOnce({
      id: 1,
      upload_url: "test_url",
      filepath: "test_filepath",
      filesize: 123,
      rest_start: 456,
      status: true,
      created_at: "2023-08-03T00:00:00.000Z",
    })

    const result = await GetLatestUploadData()

    expect(result).not.toBeNull()
    expect(result?.id).toEqual(1)
    expect(DBMock.first).toHaveBeenCalled()
  })

  it("should update upload data", async () => {
    await UpdateUploadData(1, {
      id: 1,
      file_id: "1234aASD",
      upload_url: "test_url",
      filepath: "test_filepath",
      filesize: 123,
      rest_start: 456,
      status: true,
    })

    expect(DBMock.update).toHaveBeenCalled()
  })

  it("should delete upload data", async () => {
    await DeleteUploadData(1)

    expect(DBMock.del).toHaveBeenCalled()
  })

  // it("should delete upload data after 5 days", async () => {
  //   await DeleteUploadAfter5Days()

  //   expect(DBMock.del).toHaveBeenCalled()
  //   expect(DBMock.whereRaw).toHaveBeenCalledWith(`Date('now') - created_at > 5`)
  // })
})
