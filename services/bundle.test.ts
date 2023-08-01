import { EventEmitter } from "events"
import { bundledToZip } from "./bundle"
const archiver = require("archiver")

class MockFS extends EventEmitter {
  createWriteStream() {
    // Mock the pipe method
    return this
  }
}

class MockArchiver extends EventEmitter {
  fs: MockFS | null
  constructor() {
    super()
    this.fs = null
  }

  pipe(mockfs: MockFS) {
    console.log(mockfs)
    this.fs = mockfs
    // Mock the pipe method
    return this
  }

  file() {
    // Mock the file method
    return this
  }

  finalize() {
    // Mock the finalize method
    if (this.fs) {
      console.log(this.fs)
      this.fs.emit("finish")
    } else this.emit("error")
    return this
  }
}

jest.mock(
  "fs",
  jest.fn().mockImplementation(() => ({
    createWriteStream: jest.fn().mockImplementation(() => new MockFS()),
  }))
)

jest.mock("archiver", () => {
  return jest.fn().mockImplementation(() => new MockArchiver())
})

describe("bundledToZip", () => {
  it("should call AdmZip with the correct parameters", async () => {
    const file = "source.txt"
    const res = await bundledToZip(file)

    expect(res).toEqual(file + ".zip")
    expect(archiver).toHaveBeenCalledTimes(1)
  })
})
