import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlFile = path.join(__dirname, '../database_setup.sql')

async function migrate() {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        console.error('Error: DATABASE_URL not found in .env')
        process.exit(1)
    }

    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    })

    try {
        console.log('Connecting to database...')
        await client.connect()

        console.log('Reading database_setup.sql...')
        const sql = fs.readFileSync(sqlFile, 'utf8')

        console.log('Executing migration...')
        await client.query(sql)

        console.log('Migration successful!')
    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await client.end()
    }
}

migrate()
