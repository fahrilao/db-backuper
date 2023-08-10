import { tables, db } from "../database/knexfile"

export interface UploadData {
  id?: number
  file_id: string | null
  upload_url: string
  filepath: string
  filesize: number
  rest_start: number
  rest_end?: number
  status: boolean
  created_at?: string
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

const SelectUploadAfter5Days = async () =>
  await db(tables.upload)
    .whereRaw(`ROUND(JULIANDAY('now') - JULIANDAY(created_at)) > 5`)
    .select<UploadData>("*")
    .first()

export {
  InsertUploadData,
  FetchUploadData,
  GetLatestUploadData,
  UpdateUploadData,
  DeleteUploadData,
  SelectUploadAfter5Days,
}
