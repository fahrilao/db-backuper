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
} = process.env

const locationDir = path.join(__dirname, "exports")

const currentTime = dayjs().format("DD-MM-YYYY HH.mm.ss")
const filename = `${locationDir}/${currentTime}`
const filenameZip = `${filename}.zip`

backupMysql(filename, DBHOST, parseInt(DBPORT), DBUSER, DBPASS, DBNAME).then(
  async (filenameSql) => {
    try {
      await bundledToZip(filenameSql, filenameZip)
      console.log("Success build this file")
      fs.unlink(
        filenameSql,
        (err) => err && console.log("Can't delete temp data")
      )
    } catch (err) {
      console.log("Can't Bundle this file", err)
      fs.unlink(
        filenameSql,
        (err) => err && console.log("Can't delete temp data")
      )
    }
  }
)
