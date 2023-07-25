import { describe, jest, it, expect } from "@jest/globals"
import { backupMysql } from "./backup"
import mysqldump from "mysqldump"

jest.mock("mysqldump", () =>
  jest.fn().mockImplementation(async () => {
    return Promise.resolve()
  })
)

// Mock Mysqldump
describe("Backup the database", () => {
  it("should create a backup file", async () => {
    const backupFile = "backup"
    const dbhost = "localhost"
    const dbport = 3306
    const dbuser = "root"
    const dbpassword = "password"
    const dbname = "anonymous"

    const result = await backupMysql(
      backupFile,
      dbhost,
      dbport,
      dbuser,
      dbpassword,
      dbname
    )

    expect(mysqldump).toHaveBeenCalledWith({
      connection: {
        host: dbhost,
        port: dbport,
        user: dbuser,
        password: dbpassword,
        database: dbname,
      },
      dumpToFile: `${backupFile}.sql`,
    })
    expect(result).toEqual(backupFile + ".sql")
  })
})
