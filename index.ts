import * as fs from "fs"
import * as path from "path"
import dayjs from "dayjs"
import { backupMysql } from "./services/backup"
import { bundledToZip } from "./services/bundle"
import cron from "node-cron"
import {
  GoogleDrive,
  GoogleServiceAccountInterface,
} from "./third-party/google"

// ** Load ENV Variables
const {
  DBHOST = "localhost",
  DBPORT = "3306",
  DBUSER = "root",
  DBPASS = "password",
  DBNAME = "anonymous",
  PREFIX_FILENAME = "",
  GOOGLE_SERVICE_ACCOUNT,
  GOOGLE_FILE_SHARE_ID,
  CRON_HOUR = 10,
  CRON_MINUTE = "*",
  TIME_ZONE = "Asia/Jakarta",
} = process.env

if (!GOOGLE_SERVICE_ACCOUNT) {
  console.error("Please provide a GOOGLE_SERVICE_ACCOUNT")
  process.exit(1)
}
if (!GOOGLE_FILE_SHARE_ID) {
  console.error("Please provide a GOOGLE_FILE_SHARE_ID")
  process.exit(1)
}

var dir = process.cwd() + "/" + "exports"

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

// ** Initialize
const gsa: GoogleServiceAccountInterface = JSON.parse(
  atob(GOOGLE_SERVICE_ACCOUNT)
)
const locationDir = path.join(process.cwd(), "exports")
const currentTime = dayjs().format("DD-MM-YYYY HH.mm.ss")
const filename = `${locationDir}/${currentTime}`

const run = async () => {
  console.log("Backuper is start working!")
  // ** Get an exports file
  let filenameSql: string

  try {
    filenameSql = await backupMysql(
      filename,
      DBHOST,
      parseInt(DBPORT),
      DBUSER,
      DBPASS,
      DBNAME
    )

    console.log(`Success export to ${filenameSql} file`)
  } catch (err) {
    console.log(`Can't export that DB`, err)
    throw err
  }

  // ** Compress to Zip file
  let filenameZip: string
  try {
    filenameZip = await bundledToZip(filenameSql)
    console.log(`Success build to ${filenameZip} file`)
    fs.unlink(
      filenameSql,
      (err) => err && console.log("Can't delete temp data")
    )
  } catch (err) {
    console.log(`Can't Bundle ${filenameSql} file`, err)
    fs.unlink(
      filenameSql,
      (err) => err && console.log("Can't delete temp data")
    )
    throw err
  }

  // ** Upload to Google Drive
  const googleDrive = new GoogleDrive(gsa.client_email, gsa.private_key)
  try {
    await googleDrive.createFile(
      fs.createReadStream(filenameZip),
      `${PREFIX_FILENAME} ${currentTime}.zip`,
      GOOGLE_FILE_SHARE_ID
    )
    fs.unlink(filenameZip, (err) => err && console.log("Can't delete zip data"))
  } catch (err) {
    console.log(`Can't Upload ${filenameZip} file`)
    fs.unlink(filenameZip, (err) => err && console.log("Can't delete zip data"))
    throw err
  }

  console.log("The program has runned successfully!")
}

console.log(`Scheduling tasks at ${CRON_HOUR}:${CRON_MINUTE}`)

cron
  .schedule(`${CRON_MINUTE} ${CRON_HOUR} * * *`, run, {
    scheduled: true,
    timezone: TIME_ZONE,
  })
  .start()
