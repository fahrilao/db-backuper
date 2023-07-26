import AdmZip from "adm-zip"

export const bundledToZip = async (file: string): Promise<string> => {
  const zip = new AdmZip()
  const filename = file + ".zip"
  zip.addLocalFile(file)
  return new Promise((resolve, reject) => {
    zip.writeZip(filename, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(filename)
      }
    })
  })
}
