import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';

const DIRECTUS_TOKEN = 'FHSqhqx84zCUm3eM-UHpqjISY2bCSDcY';
const DIRECTUS_URL = 'http://coqs.freeboxos.fr:16400';

const directus = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

async function test() {
  try {
    console.log("Testing search...");
    const items = await directus.request(readItems('components', {
      search: 'tp4056',
      limit: 5,
      fields: ['name', 'quantity_available', 'description', 'type.name'] as any
    }));
    console.log("Success:", items);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
