import AdmZip from "adm-zip"

export const bundledToZip = async (
  fromFile: string,
  toFile: string
): Promise<string> => {
  const zip = new AdmZip()
  return new Promise((resolve, reject) => {
    zip.addLocalFile(fromFile)
    zip.writeZip(toFile, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve("success")
      }
    })
  })
}
