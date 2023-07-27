import fs from "fs"
import path from "path"
import dayjs from "dayjs"
import { backupMysql } from "./services/backup"
import { bundledToZip } from "./services/bundle"
import {
  GoogleDrive,
  GoogleServiceAccountInterface,
} from "./third-party/google"

const {
  DBHOST = "localhost",
  DBPORT = "3306",
  DBUSER = "root",
  DBPASS = "password",
  DBNAME = "anonymous",
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_FILE_SHARE_ID,
} = process.env

if (!GOOGLE_SERVICE_ACCOUNT) {
  console.error("Please provide a GOOGLE_SERVICE_ACCOUNT")
  process.exit(1)
}

if (!GOOGLE_FILE_SHARE_ID) {
  console.error("Please provide a GOOGLE_FILE_SHARE_ID")
  process.exit(1)
}

const gsa: GoogleServiceAccountInterface = JSON.parse(
  atob(GOOGLE_SERVICE_ACCOUNT)
)

const locationDir = path.join(__dirname, "exports")

const currentTime = dayjs().format("DD-MM-YYYY HH.mm.ss")
const filename = `${locationDir}/${currentTime}`

backupMysql(filename, DBHOST, parseInt(DBPORT), DBUSER, DBPASS, DBNAME)
  .then(async (filenameSql) => {
    try {
      const filenameZip = await bundledToZip(filenameSql)
      console.log(`Success build to ${filenameZip} file`)
      fs.unlink(
        filenameSql,
        (err) => err && console.log("Can't delete temp data")
      )

      return filenameZip
    } catch (err) {
      console.log(`Can't Bundle ${filenameSql} file`, err)
      fs.unlink(
        filenameSql,
        (err) => err && console.log("Can't delete temp data")
      )
      throw err
    }
  })
  .then(async (filenameZip) => {
    const googleDrive = new GoogleDrive(gsa.client_email, gsa.private_key)

    try {
      await googleDrive.createFile(
        fs.createReadStream(filenameZip),
        currentTime + ".zip",
        GOOGLE_FILE_SHARE_ID
      )
      fs.unlink(
        filenameZip,
        (err) => err && console.log("Can't delete zip data")
      )
    } catch (err) {
      console.log(`Can't Upload ${filenameZip} file`)
      fs.unlink(
        filenameZip,
        (err) => err && console.log("Can't delete zip data")
      )
      throw err
    }

    console.log("The program was runned successfully")
  })
