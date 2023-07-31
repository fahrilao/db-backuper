import { google, drive_v3 } from "googleapis"
import { JWT } from "google-auth-library"
import * as fs from "fs"
import axios from "axios"

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

  constructor(client_email: string, private_key: string) {
    this.client = new google.auth.JWT(
      client_email,
      undefined,
      private_key,
      "https://www.googleapis.com/auth/drive"
    )
    this.client.authorize(function (err) {
      if (err) {
        throw new Error(err.message)
      } else {
        console.log("Connection established with Google API")
      }
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

  private async uploadResumable(
    uploadURL: string,
    filepath: string,
    filesize: number,
    startByte: number,
    endByte?: number
  ): Promise<void> {
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

    await axios
      .put(uploadURL, chunk, {
        headers: {
          "Content-Length": endByte - startByte + 1,
          "Content-Range": `bytes ${startByte}-${endByte}/${filesize}`,
        },
      })
      .catch(async (error) => {
        console.log(error)
        if (error?.response?.status === 308) {
          console.log(`Uploaded bytes ${startByte}-${endByte} of ${filesize}`)
          // Server is requesting to continue the upload, adjust the range for the next chunk
          const range = error.response.headers.range
          const [nextStart, nextEnd] = range.split("-").map(Number)
          startByte = nextEnd + 1
          endByte = Math.min(startByte + chunkSize - 1, filesize - 1)
          await this.uploadResumable(
            uploadURL,
            filepath,
            filesize,
            startByte,
            endByte
          )
        } else {
          // Handle other errors
          console.error("Error uploading chunk:", error.message)
          throw error
        }
      })
  }

  async resumable(filename: string, filepath: string, parents: string[]) {
    const uploadURL = await this.initialResumable(filename, parents)
    const filesize = fs.statSync(filepath).size
    let startByte = 0

    await this.uploadResumable(uploadURL, filepath, filesize, startByte)
  }
}
