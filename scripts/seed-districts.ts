/**
 * pnpm seed:districts — creates the 25 districts (English names). Safe to run again:
 * existing districts are left untouched. Sinhala/Tamil names are added in the admin by
 * editors and approved by native speakers (translationReview).
 */
import "dotenv/config";
import { getPayload } from "payload";
import config from "@payload-config";
import { DISTRICT_SEED, districtSlug } from "../src/collections/Districts";

const payload = await getPayload({ config });
let created = 0;
for (const d of DISTRICT_SEED) {
  const slug = districtSlug(d.name);
  const exists = await payload.find({ collection: "districts", where: { slug: { equals: slug } }, limit: 1, depth: 0 });
  if (exists.docs[0]) continue;
  await payload.create({
    collection: "districts",
    locale: "en",
    data: { name: d.name, slug, province: d.province as never },
  });
  created++;
}
console.log(`Districts: ${created} created, ${DISTRICT_SEED.length - created} already there.`);
process.exit(0);
