import { google, drive_v3 } from "googleapis"
import { JWT } from "google-auth-library"
import * as fs from "fs"

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
}
