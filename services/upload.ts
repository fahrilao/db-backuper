import { tables, db } from "../database/knexfile"

export interface UploadData {
  id?: number
  upload_url: string
  filepath: string
  filesize: number
  rest_start: number
  rest_end?: number
  status: boolean
  created_at?: Date
}

const InsertUploadData = async (data: UploadData) =>
  await db(tables.upload).returning("id").insert(data)

const FetchUploadData = async () =>
  await db(tables.upload).select<UploadData>("*")

const GetLatestUploadData = async () =>
  await db(tables.upload)
    .select<UploadData>("*")
    .where("status", 0)
    .limit(1)
    .orderBy("id", "desc")
    .first()

const UpdateUploadData = async (id: number, data: UploadData) =>
  await db(tables.upload).where("id", id).update(data)

const DeleteUploadData = async (id: number) =>
  await db(tables.upload).where("id", id).del()

const DeleteUploadAfter5Days = async () =>
  await db(tables.upload).whereRaw(`Date('now') - created_at > 5`).del()

export {
  InsertUploadData,
  FetchUploadData,
  GetLatestUploadData,
  UpdateUploadData,
  DeleteUploadData,
  DeleteUploadAfter5Days,
}
