# Intruduction

The DB Backuper Project is a desktop app built from NodeJS to back up a DB for MySQL DB and periodically upload it into Google Drive. This documentation provides an overview of the DB Backuper project, its installation and usage instructions, and other relevant information.

# Installation

To use DB Backuper Project, follow these steps:

### Prerequisites

- NodeJS minimum version 18.13
- Typescript (Install Globally)
- MySQL
- Docker (optional)
- Docker Composer (optional)

### Configuration

Please create a .env file and name it variable.env in the `build/docker` folder.
Insert the following variable into the file:

- `PREFIX_FILENAME`: The prefix of output filename (default: "")
- `DBHOST`: Database Host (default: "localhost")
- `DBPORT`: Database Port (default: "3306")
- `DBUSER`: Database Username (default: "root")
- `DBPASS`: Database Password (default: "password")
- `DBNAME`: Database Name (default: "anonymous")
- `GOOGLE_SERVICE_ACCOUNT`\*: Json of service account which encode by base64 encoded
- `GOOGLE_FILE_SHARE_ID`\*: ID of sharing file destination
- `CRON_HOUR`: What time that you want to run the backup every day (default: 10)
- `TIME_ZONE`: Timezone (default: "Asia/Jakarta")

### Install Project

Download the DB Backuper Project and Install Dependencies with the `yarn install` command.

# Usage

You can choose one of the following instructions.

### Local

You can use `yarn start` to start the project.

### Docker

if you want to use Docker, you can use the following command:

- `cd ./build/docker`
- `docker-compose up -d`

# License

The Backuper project is open-source software licensed under the MIT License. See the LICENSE file for more details.
