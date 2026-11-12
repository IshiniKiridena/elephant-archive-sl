import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
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
import { Sources } from './collections/Sources'
import { Districts } from './collections/Districts'
import { AuditLog } from './collections/AuditLog'
import { cloudinaryAdapter } from './storage/cloudinary-adapter'
import { cloudinaryFromEnv } from './storage/cloudinary-env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Uploads go to Cloudinary when CLOUDINARY_* are set; otherwise to local disk (dev, CI).
// Throws if the env is half-set, or unset on Vercel (see cloudinary-env.ts).
const cloudinaryEnv = cloudinaryFromEnv()
const cloudName = cloudinaryEnv?.cloudName ?? ''

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Elephant Archive admin' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    // Archive content
    Sources,
    Media,
    Districts,
    // Fact-check pipeline
    IntakeBatches,
    IntakeFiles,
    Candidates,
    CheckRuns,
    // Admin
    Users,
    AuditLog,
  ],
  // Three-language content. Fields marked `localized: true` hold si/ta/en values.
  // A missing si/ta value falls back to English; pages then render that text with lang="en".
  localization: {
    locales: [
      { label: 'සිංහල', code: 'si' },
      { label: 'தமிழ்', code: 'ta' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
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
  plugins: [
    cloudStoragePlugin({
      enabled: !!cloudinaryEnv,
      // Same schema with and without Cloudinary, so local and production databases match.
      alwaysInsertFields: true,
      collections: {
        // Public: served straight from Cloudinary (no Vercel bandwidth or image optimisation)
        media: {
          adapter: cloudinaryAdapter({ delivery: 'public', folder: 'media', cloudName }),
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
        },
        // Private: only through /api/intake-files/:id/signed-url or the file route, admins only
        'intake-files': {
          adapter: cloudinaryAdapter({ delivery: 'private', folder: 'intake', cloudName }),
          disableLocalStorage: true,
        },
      },
    }),
  ],
})
