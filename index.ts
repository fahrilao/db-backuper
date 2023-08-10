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
import {
  SelectUploadAfter5Days,
  DeleteUploadData,
  GetLatestUploadData,
  InsertUploadData,
  UpdateUploadData,
  UploadData,
} from "./services/upload"

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
  RUN_ONCE = 0,
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

const deleteExpireData = async () => {
  const uploadData = await SelectUploadAfter5Days()
  if (!uploadData) return

  const googleDrive = new GoogleDrive(gsa.client_email, gsa.private_key)
  try {
    uploadData.file_id && (await googleDrive.deleteFile(uploadData.file_id))
    await DeleteUploadData(uploadData.id!)
  } catch (err) {
    console.log(`Can't resume ${uploadData.filepath} file`)
    throw err
  }

  console.log("Success deleted expire upload data")
}

const resumeTheFailed = async () => {
  const uploadData = await GetLatestUploadData()
  if (!uploadData) {
    return
  }

  console.log("resuming upload the failed upload")

  const googleDrive = new GoogleDrive(gsa.client_email, gsa.private_key)
  try {
    const res = await googleDrive.uploadResumable(
      uploadData.upload_url,
      uploadData.filepath,
      uploadData.filesize,
      uploadData.rest_start,
      uploadData.rest_end
    )
    UpdateUploadData(uploadData.id!, res)
    fs.unlink(
      uploadData.filepath,
      (err) => err && console.log("Can't delete zip data")
    )
  } catch (err) {
    await DeleteUploadData(uploadData.id!)
    console.log(`Can't resume ${uploadData.filepath} file`)
    fs.unlink(
      uploadData.filepath,
      (err) => err && console.log("Can't delete zip data")
    )
    throw err
  }

  console.log("successfully resume upload data")
}

const runBackup = async () => {
  console.log("Backuper is start working!")
  const currentTime = dayjs().format("DD-MM-YYYY HH.mm.ss")
  const filename = `${locationDir}/${currentTime}`
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
  let uploadInfo: UploadData
  try {
    uploadInfo = await googleDrive.resumable(
      `${PREFIX_FILENAME} ${currentTime}.zip`,
      filenameZip,
      [GOOGLE_FILE_SHARE_ID]
    )
    if (uploadInfo.status)
      fs.unlink(
        filenameZip,
        (err) => err && console.log("Can't delete zip data")
      )
  } catch (err) {
    console.log(`Can't Upload ${filenameZip} file`)
    fs.unlink(filenameZip, (err) => err && console.log("Can't delete zip data"))
    throw err
  }

  // ** Insert upload info to Database
  await InsertUploadData({
    ...uploadInfo,
    created_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  })

  console.log("The program has runned successfully!")
}

const run = () => {
  deleteExpireData()
  resumeTheFailed()
  runBackup()
}

if (RUN_ONCE) run()
else {
  console.log(`Scheduling tasks at ${CRON_HOUR}:${CRON_MINUTE}`)
  cron
    .schedule(`${CRON_MINUTE} ${CRON_HOUR} * * *`, run, {
      scheduled: true,
      timezone: TIME_ZONE,
    })
    .start()
}
