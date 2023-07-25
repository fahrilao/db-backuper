import mysqldump from "mysqldump"

export const backupMysql = async (
  backupFile: string,
  dbhost: string,
  dbport: number,
  dbuser: string,
  dbpassword: string,
  dbname: string
): Promise<string> => {
  await mysqldump({
    connection: {
      host: dbhost,
      port: dbport,
      user: dbuser,
      password: dbpassword,
      database: dbname,
    },
    dumpToFile: backupFile + ".sql",
  })

  return backupFile + ".sql"
}
