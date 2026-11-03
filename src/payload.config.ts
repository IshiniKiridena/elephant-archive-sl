import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { IntakeBatches, IntakeFiles } from './collections/IntakeBatches'
import { Candidates } from './collections/Candidates'
import { CheckRuns } from './collections/CheckRuns'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Elephant Archive admin' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Media gets credit/permission/alt-text fields in the core-collections step
  collections: [Users, Media, IntakeBatches, IntakeFiles, Candidates, CheckRuns],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
