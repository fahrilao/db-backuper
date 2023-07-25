import { backupMysql } from "./backup"
import AdmZip from "adm-zip"
import { bundledToZip } from "./bundle"

jest.mock("adm-zip", () =>
  jest.fn().mockImplementation(() => ({
    addLocalFile: jest.fn(),
    writeZip: jest.fn((toFile: string, callback: (err?: Error) => void) =>
      callback()
    ),
  }))
)

describe("bundledToZip", () => {
  it("should call AdmZip with the correct parameters", async () => {
    const fromFile = "source.txt"
    const toFile = "destination.zip"
    const res = await bundledToZip(fromFile, toFile)

    expect(res).toEqual("success")
    expect(AdmZip).toHaveBeenCalledTimes(1)
  })
})
