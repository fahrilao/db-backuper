import fs from "fs"
import path from "path"
import dayjs from "dayjs"
import { backupMysql } from "./services/backup"
import { bundledToZip } from "./services/bundle"

const {
  DBHOST = "localhost",
  DBPORT = "3306",
  DBUSER = "root",
  DBPASS = "password",
  DBNAME = "anonymous",
  GOOGLE_SERVICE_ACCOUNT,
} = process.env

if (!GOOGLE_SERVICE_ACCOUNT) {
  console.error("Please provide a GOOGLE_SERVICE_ACCOUNT")
  process.exit(1)
}

const locationDir = path.join(__dirname, "exports")

const currentTime = dayjs().format("DD-MM-YYYY HH.mm.ss")
const filename = `${locationDir}/${currentTime}`

backupMysql(filename, DBHOST, parseInt(DBPORT), DBUSER, DBPASS, DBNAME).then(
  async (filenameSql) => {
    try {
      const fileZip = await bundledToZip(filenameSql)
      console.log(`Success build to ${fileZip} file`)
    } catch (err) {
      console.log(`Can't Bundle ${filenameSql} file`, err)
    } finally {
      fs.unlink(
        filenameSql,
        (err) => err && console.log("Can't delete temp data")
      )
    }
  }
)
