#!/usr/bin/env node
/**
 * ShopRite Weekly Circular Fetcher
 *
 * This script fetches the current weekly circular images from ShopRite via the
 * RedPepper Digital API. The circular pages are returned as JPEG image URLs.
 *
 * Usage:
 *   node get_circular.js                    # Uses default store (Manasquan/Wall Township)
 *   node get_circular.js --store-id 630     # Specify store by ID
 *   node get_circular.js --city Manasquan   # Find store by city name
 *   node get_circular.js --list-stores      # List all available stores
 */

// ShopRite client ID on RedPepper
const CLIENT_ID = "4573";

// Default store - Manasquan/Wall Township, NJ
const DEFAULT_STORE_ID = "630";

// RedPepper API endpoints
const GEO_LOCATION_API = `https://app.redpepper.digital/client/${CLIENT_ID}/catalogue/geo_location/json?_format=json`;
const PAGES_API = (catalogueId) =>
  `https://app.redpepper.digital/catalogue/${catalogueId}/page-images/json?_format=json`;
const METADATA_API = (catalogueId) =>
  `https://app.redpepper.digital/node/${catalogueId}?_format=json`;

/**
 * Fetch JSON from a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<object|array|null>}
 */
async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ShopRite-Circular-Fetcher/1.0",
      },
    });

    if (!response.ok) {
      console.error(`HTTP error fetching ${url}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

/**
 * Get all store locations with their catalogue mappings
 * @returns {Promise<array|null>}
 */
async function getStoreLocations() {
  const data = await fetchJson(GEO_LOCATION_API);
  if (!data) return null;
  return data;
}

/**
 * Find the current catalogue ID for a given store
 * Filters to find the main "Week of" circular by default, not wellness/specialty circulars
 * @param {string} storeId - The store ID to look up
 * @param {string} catalogueType - Type filter: "weekly" (default), "wellness", "hispanic", or "all"
 * @returns {Promise<object|null>} - Store info with current catalogue ID
 */
async function findStoreAndCatalogue(storeId, catalogueType = "weekly") {
  const locations = await getStoreLocations();
  if (!locations) return null;

  // Find all entries for this store
  const storeEntries = locations.filter(
    (loc) => loc.field_store_id === storeId
  );

  if (storeEntries.length === 0) {
    console.error(`Store ID ${storeId} not found`);
    return null;
  }

  // Get catalogue IDs and fetch their metadata to filter by type
  const uniqueCatalogueIds = [...new Set(storeEntries.map((e) => e.field_version))];

  // Fetch metadata for each catalogue to determine type
  const cataloguesWithMeta = await Promise.all(
    uniqueCatalogueIds.map(async (catId) => {
      const meta = await getCatalogueMetadata(catId);
      return { catalogueId: catId, meta };
    })
  );

  // Filter based on catalogue type
  let filteredCatalogues = cataloguesWithMeta.filter((c) => c.meta !== null);

  if (catalogueType === "weekly") {
    // Main weekly circular titles start with "Week of"
    filteredCatalogues = filteredCatalogues.filter((c) =>
      c.meta.title.toLowerCase().startsWith("week of")
    );
  } else if (catalogueType === "wellness") {
    filteredCatalogues = filteredCatalogues.filter((c) =>
      c.meta.title.toLowerCase().includes("wellness")
    );
  } else if (catalogueType === "hispanic") {
    filteredCatalogues = filteredCatalogues.filter((c) =>
      c.meta.title.toLowerCase().includes("hispanic")
    );
  }
  // "all" type keeps everything

  if (filteredCatalogues.length === 0) {
    console.error(`No ${catalogueType} catalogues found for store ${storeId}`);
    return null;
  }

  // Sort by catalogue ID (higher = more recent) and get the latest
  filteredCatalogues.sort(
    (a, b) => parseInt(b.catalogueId) - parseInt(a.catalogueId)
  );

  const latestCatalogue = filteredCatalogues[0];
  const storeInfo = storeEntries.find(
    (e) => e.field_version === latestCatalogue.catalogueId
  ) || storeEntries[0];

  return {
    storeId: storeInfo.field_store_id,
    storeName: storeInfo.field_store_name,
    city: storeInfo.field_city,
    state: storeInfo.field_state,
    address: storeInfo.field_contact_address,
    zipcode: storeInfo.field_zipcode,
    phone: storeInfo.field_phone_number,
    catalogueId: latestCatalogue.catalogueId,
    catalogueTitle: latestCatalogue.meta.title,
    dma: storeInfo.field_dma,
  };
}

/**
 * Find a store by city name
 * @param {string} cityName - City name to search for
 * @param {string} catalogueType - Type filter: "weekly" (default), "wellness", "hispanic", or "all"
 * @returns {Promise<object|null>}
 */
async function findStoreByCity(cityName, catalogueType = "weekly") {
  const locations = await getStoreLocations();
  if (!locations) return null;

  const normalizedSearch = cityName.toLowerCase().trim();

  // Find matching stores
  const matches = locations.filter(
    (loc) =>
      loc.field_city?.toLowerCase().includes(normalizedSearch) ||
      loc.title?.toLowerCase().includes(normalizedSearch)
  );

  if (matches.length === 0) {
    console.error(`No stores found matching "${cityName}"`);
    return null;
  }

  // Get unique store IDs
  const uniqueStoreIds = [...new Set(matches.map((m) => m.field_store_id))];

  if (uniqueStoreIds.length > 1) {
    console.log(`Multiple stores found matching "${cityName}":`);
    for (const id of uniqueStoreIds) {
      const store = matches.find((m) => m.field_store_id === id);
      console.log(`  - ${store.field_store_name} (ID: ${id})`);
    }
    console.log(`Using first match: ${uniqueStoreIds[0]}`);
  }

  return findStoreAndCatalogue(uniqueStoreIds[0], catalogueType);
}

/**
 * List all unique stores
 * @returns {Promise<array|null>}
 */
async function listAllStores() {
  const locations = await getStoreLocations();
  if (!locations) return null;

  // Get unique stores by store ID
  const storeMap = new Map();
  for (const loc of locations) {
    if (!storeMap.has(loc.field_store_id)) {
      storeMap.set(loc.field_store_id, {
        storeId: loc.field_store_id,
        storeName: loc.field_store_name,
        city: loc.field_city,
        state: loc.field_state,
      });
    }
  }

  return Array.from(storeMap.values()).sort((a, b) =>
    a.storeName.localeCompare(b.storeName)
  );
}

/**
 * Get metadata about a catalogue (dates, title, etc.)
 * @param {string} catalogueId - The catalogue ID
 * @returns {Promise<object|null>}
 */
async function getCatalogueMetadata(catalogueId) {
  const data = await fetchJson(METADATA_API(catalogueId));
  if (!data) return null;

  return {
    id: catalogueId,
    title: data.title?.[0]?.value ?? "Unknown",
    client: data.field_catalogue_client_name?.[0]?.value ?? "Unknown",
    startDate: data.field_catalogue_start_date?.[0]?.value ?? "Unknown",
    endDate: data.field_catalogue_finish_date?.[0]?.value ?? "Unknown",
    pageCount: data.field_catalogue_pagecount?.[0]?.value ?? 0,
  };
}

/**
 * Get all pages of a circular with their image URLs
 * @param {string} catalogueId - The catalogue ID
 * @returns {Promise<array|null>}
 */
async function getCircularPages(catalogueId) {
  const data = await fetchJson(PAGES_API(catalogueId));
  if (!data) return null;

  const pages = data.map((pageData) => ({
    pageNumber: parseInt(pageData.page || "0", 10),
    imageUrl: (pageData.image || "").replace(/\\\//g, "/"),
    width: pageData.field_page_image_original_width || "",
    height: pageData.field_page_image_original_height || "",
  }));

  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Get the first page image URL for a store (useful for TRMNL display)
 * @param {string} storeId - The store ID (defaults to Manasquan)
 * @returns {Promise<string|null>}
 */
async function getFirstPageUrl(storeId = DEFAULT_STORE_ID) {
  const store = await findStoreAndCatalogue(storeId);
  if (!store) return null;

  const pages = await getCircularPages(store.catalogueId);
  if (pages && pages.length > 0) {
    return pages[0].imageUrl;
  }
  return null;
}

/**
 * Get complete circular data for a store
 * @param {string} storeId - The store ID (defaults to Manasquan)
 * @returns {Promise<object|null>}
 */
async function getCircularForStore(storeId = DEFAULT_STORE_ID) {
  const store = await findStoreAndCatalogue(storeId);
  if (!store) return null;

  const [metadata, pages] = await Promise.all([
    getCatalogueMetadata(store.catalogueId),
    getCircularPages(store.catalogueId),
  ]);

  return {
    store,
    metadata,
    pages,
  };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    storeId: DEFAULT_STORE_ID,
    city: null,
    listStores: false,
    catalogueType: "weekly",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--store-id":
        options.storeId = args[++i];
        break;
      case "--city":
        options.city = args[++i];
        break;
      case "--list-stores":
        options.listStores = true;
        break;
      case "--type":
        options.catalogueType = args[++i];
        break;
      case "--help":
      case "-h":
        console.log(`
ShopRite Weekly Circular Fetcher

Usage:
  node get_circular.js                    # Uses default store (Manasquan/Wall Township)
  node get_circular.js --store-id 630     # Specify store by ID
  node get_circular.js --city Manasquan   # Find store by city name
  node get_circular.js --list-stores      # List all available stores
  node get_circular.js --type wellness    # Get wellness circular instead of weekly

Options:
  --store-id <id>   Specify store by numeric ID
  --city <name>     Find store by city name (partial match)
  --type <type>     Circular type: weekly (default), wellness, hispanic, or all
  --list-stores     List all available ShopRite stores
  --help, -h        Show this help message
        `);
        process.exit(0);
    }
  }

  return options;
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  // List stores mode
  if (options.listStores) {
    console.log("Fetching store list...\n");
    const stores = await listAllStores();
    if (!stores) {
      console.error("Failed to fetch store list");
      process.exit(1);
    }

    console.log("Available ShopRite Stores:");
    console.log("=".repeat(60));
    for (const store of stores) {
      console.log(
        `${store.storeId.padStart(4)}  ${store.storeName} (${store.city}, ${store.state})`
      );
    }
    console.log(`\nTotal: ${stores.length} stores`);
    return;
  }

  // Find store by city if specified
  let store;
  if (options.city) {
    store = await findStoreByCity(options.city, options.catalogueType);
  } else {
    store = await findStoreAndCatalogue(options.storeId, options.catalogueType);
  }

  if (!store) {
    console.error("Could not find store");
    process.exit(1);
  }

  console.log("ShopRite Weekly Circular Fetcher");
  console.log("=".repeat(40));
  console.log(`\nStore: ${store.storeName}`);
  console.log(`Address: ${store.address}, ${store.city}, ${store.state} ${store.zipcode}`);
  console.log(`Phone: ${store.phone}`);
  console.log(`Store ID: ${store.storeId}`);
  console.log(`Catalogue ID: ${store.catalogueId}`);

  // Get metadata
  const metadata = await getCatalogueMetadata(store.catalogueId);
  if (metadata) {
    console.log(`\nCircular: ${metadata.title}`);
    console.log(`Valid: ${metadata.startDate} to ${metadata.endDate}`);
    console.log(`Pages: ${metadata.pageCount}`);
  }

  // Get pages
  console.log("\n" + "=".repeat(40));
  console.log("Circular Pages:");
  console.log("=".repeat(40));

  const pages = await getCircularPages(store.catalogueId);
  if (!pages) {
    console.log("Failed to fetch circular pages!");
    process.exit(1);
  }

  for (const page of pages) {
    console.log(`Page ${page.pageNumber}: ${page.imageUrl}`);
  }

  // Output first page for easy use
  console.log("\n" + "=".repeat(40));
  console.log("First page URL (for TRMNL):");
  console.log(pages[0].imageUrl);
}

// Export functions for use as a module
module.exports = {
  CLIENT_ID,
  DEFAULT_STORE_ID,
  fetchJson,
  getStoreLocations,
  findStoreAndCatalogue,
  findStoreByCity,
  listAllStores,
  getCatalogueMetadata,
  getCircularPages,
  getFirstPageUrl,
  getCircularForStore,
};

// Run main if executed directly
if (require.main === module) {
  main().catch(console.error);
}
