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
    const file = "source.txt"
    const res = await bundledToZip(file)

    expect(res).toEqual(file + ".zip")
    expect(AdmZip).toHaveBeenCalledTimes(1)
  })
})
