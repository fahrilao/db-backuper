import { google, drive_v3 } from "googleapis"
import { JWT } from "google-auth-library"
import * as fs from "fs"
import axios from "axios"
import { UploadData } from "../services/upload"

interface GoogleResponse {
  statusCode: number
  message: string
  data: drive_v3.Schema$File
}

export interface GoogleServiceAccountInterface {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

export class GoogleDrive {
  client: JWT
  authenticationTried = 0

  constructor(client_email: string, private_key: string) {
    this.client = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      "https://www.googleapis.com/auth/drive"
    )

    this.authenticate()
  }

  async authenticate(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.client.authorize(function (err) {
        if (err) {
          reject(err)
        } else {
          console.log("Connection established with Google API")
          resolve(true)
        }
      })
    }).catch((err) => {
      this.authenticationTried++
      console.log(err)
      if (this.authenticationTried > 3) throw err
      setTimeout(this.authenticate, 10000)
    })
  }

  async createFile(
    filesource: fs.ReadStream,
    filename: string,
    parentID: string
  ): Promise<GoogleResponse> {
    const drive = google.drive({
      version: "v3",
      auth: this.client,
    })
    const res = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        parents: [parentID],
      },
      media: {
        mimeType: "application/zip",
        body: filesource,
      },
    })

    return {
      statusCode: res.status,
      message: res.statusText,
      data: res.data,
    }
  }

  getList() {
    const drive = google.drive({ version: "v3", auth: this.client })
    const response = drive.files.list(
      {
        pageSize: 10,
        fields: "nextPageToken, files(id, name)",
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err)
        if (!res) return console.log("No files found")
        const files = res.data.files!
        if (files.length) {
          console.log("Files:")
          files.map((file) => {
            console.log(`${file.name} (${file.id})`)
          })
        } else {
          console.log("No files found.")
        }
      }
    )
  }

  private async initialResumable(
    filename: string,
    parents: string[]
  ): Promise<string> {
    const accessToken = await this.client.getAccessToken()
    const res = await axios.post(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`,
      {
        name: filename,
        mimeType: "application/zip",
        parents,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    )

    console.log("success initial the resumable", res.headers.location)

    return res.headers.location
  }

  private async checkResumableStatus(
    filesize: number,
    uploadURL: string
  ): Promise<drive_v3.Schema$File> {
    return await axios
      .put(uploadURL, {
        "Content-Range": `bytes ${filesize}`,
      })
      .then((res) => res.data as drive_v3.Schema$File)
      .catch((err) => {
        console.error(err.message)
        return {
          id: "",
        }
      })
  }

  async uploadResumable(
    uploadURL: string,
    filepath: string,
    filesize: number,
    startByte: number,
    endByte?: number
  ): Promise<UploadData> {
    const chunkSize = 256 * 1024
    if (!endByte) {
      endByte = chunkSize - 1
    }
    if (endByte > filesize) {
      endByte = filesize - 1
    }

    console.log(`Upload bytes ${startByte}-${endByte} of ${filesize}`)

    const chunk = fs.createReadStream(filepath, {
      start: startByte,
      end: endByte,
    })

    const res = await axios
      .put(uploadURL, chunk, {
        headers: {
          "Content-Length": endByte - startByte + 1,
          "Content-Range": `bytes ${startByte}-${endByte}/${filesize}`,
        },
      })
      .then(async (res) => {
        let id = res.data?.id
        if (!id) {
          const data = await this.checkResumableStatus(filesize, uploadURL)
          id = data.id || null
        }

        return {
          file_id: id,
          upload_url: uploadURL,
          filepath,
          filesize,
          rest_start: 0,
          rest_end: 0,
          status: true,
        }
      })
      .catch(async (error) => {
        if (error?.response?.status === 308) {
          console.log(`Uploaded bytes ${startByte}-${endByte} of ${filesize}`)
          // Server is requesting to continue the upload, adjust the range for the next chunk
          const range = error.response.headers.range
          const [nextStart, nextEnd] = range.split("-").map(Number)
          startByte = nextEnd + 1
          endByte = Math.min(startByte + chunkSize - 1, filesize - 1)
          return await this.uploadResumable(
            uploadURL,
            filepath,
            filesize,
            startByte,
            endByte
          )
        }

        console.error("Error uploading chunk:", error.message)
        return {
          file_id: null,
          upload_url: uploadURL,
          filepath,
          filesize,
          rest_start: startByte,
          rest_end: endByte,
          status: false,
        }
      })

    return res
  }

  async resumable(
    filename: string,
    filepath: string,
    parents: string[]
  ): Promise<UploadData> {
    const uploadURL = await this.initialResumable(filename, parents)
    const filesize = fs.statSync(filepath).size
    let startByte = 0

    return await this.uploadResumable(uploadURL, filepath, filesize, startByte)
  }

  async deleteFile(id: string) {
    const drive = google.drive({
      version: "v3",
      auth: this.client,
    })
    const res = await drive.files.delete({
      fileId: id,
    })

    return {
      statusCode: res.status,
      message: res.statusText,
      data: res.data,
    }
  }
}
