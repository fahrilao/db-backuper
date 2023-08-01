import archiver from "archiver"
import fs from "fs"

const bundledToZip = async (file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filename = file + ".zip"

    const outputZipStream = fs.createWriteStream(filename)

    outputZipStream.on("finish", () => {
      resolve(filename)
    })

    outputZipStream.on("error", (err) => {
      reject(err)
    })

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Compression level (0-9, 9 being the highest compression)
    })

    archive.on("error", (err) => {
      reject(err)
    })

    archive.pipe(outputZipStream)

    archive.file(file, { name: filename })

    archive.finalize()
  })
}

export { bundledToZip }
