/**
 * Cloudflare Worker: ShopRite Deals API
 *
 * Fetches ShopRite category pages and extracts product deals from embedded JSON data.
 *
 * Usage:
 *   https://your-worker.workers.dev/shoprite-deals?store=641&category=meat-id-520692&limit=10
 *
 * Query Parameters:
 *   - store: Store ID (required, e.g., "641")
 *   - category: Category slug (required, e.g., "meat-id-520692")
 *   - limit: Max number of products to return (optional, default 20)
 *   - subcategory: Filter by subcategory (optional, e.g., "Beef")
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(request.url)
    const store = url.searchParams.get('store')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const subcategory = url.searchParams.get('subcategory')

    // Validate required params
    if (!store || !category) {
      return jsonResponse(
        { error: 'Missing required parameters: store and category' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Build ShopRite URL
    const shopriteUrl = `https://www.shoprite.com/sm/planning/rsid/${store}/categories/${category}`

    // Check cache first (24 hour TTL)
    const cacheKey = new Request(shopriteUrl, request)
    const cache = caches.default
    let response = await cache.match(cacheKey)

    let html
    if (response) {
      html = await response.text()
    } else {
      // Fetch the page
      const fetchResponse = await fetch(shopriteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShopRite-Deals-API/1.0)',
        }
      })

      if (!fetchResponse.ok) {
        return jsonResponse(
          { error: `Failed to fetch ShopRite page: ${fetchResponse.status}` },
          { status: fetchResponse.status, headers: corsHeaders }
        )
      }

      html = await fetchResponse.text()

      // Cache the HTML for 24 hours
      const cacheResponse = new Response(html, {
        headers: { 'Cache-Control': 'public, max-age=86400' }
      })
      await cache.put(cacheKey, cacheResponse)
    }

    // Extract JSON from window.__PRELOADED_STATE__
    const jsonData = extractPreloadedState(html)
    if (!jsonData) {
      return jsonResponse(
        { error: 'Could not extract product data from page' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Parse and filter products
    const products = parseProducts(jsonData, subcategory, limit)

    // Return formatted response
    return jsonResponse(
      {
        store,
        category,
        subcategory: subcategory || null,
        count: products.length,
        products,
        categoryInfo: jsonData.departments?.subCategory || null,
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=3600' } }
    )

  } catch (error) {
    return jsonResponse(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

/**
 * Extract window.__PRELOADED_STATE__ from HTML
 */
function extractPreloadedState(html) {
  try {
    // Find the script tag with window.__PRELOADED_STATE__
    const match = html.match(/window\.__PRELOADED_STATE__\s*=\s*({.+?});?\s*<\/script>/s)
    if (!match) return null

    return JSON.parse(match[1])
  } catch (error) {
    console.error('Error parsing preloaded state:', error)
    return null
  }
}

/**
 * Parse products from the JSON data
 */
function parseProducts(data, subcategoryFilter, limit) {
  const products = []
  const productDict = data.productCardDictionary || {}
  const subCategories = data.departments?.subCategory?.subCategories || {}

  // If subcategory filter is specified, only get products from that subcategory
  let productSkus = []
  if (subcategoryFilter && subCategories[subcategoryFilter]) {
    productSkus = subCategories[subcategoryFilter].products || []
  } else {
    // Get all products from all subcategories
    Object.values(subCategories).forEach(subcat => {
      if (subcat.products) {
        productSkus.push(...subcat.products)
      }
    })
  }

  // Deduplicate SKUs
  productSkus = [...new Set(productSkus)]

  // Limit results
  productSkus = productSkus.slice(0, limit)

  // Build product list
  for (const sku of productSkus) {
    const product = productDict[sku]
    if (!product) continue

    products.push({
      sku: product.sku,
      name: product.name,
      description: product.description,
      brand: product.brand,
      price: product.price,
      unitPrice: product.unitPrice,
      wasPrice: product.wasPrice,
      priceLabel: product.priceLabel,
      isDiscounted: product.isDiscounted,
      image: product.image?.cell || product.image?.default,
      imageZoom: product.image?.zoom,
      available: product.available,
      sellBy: product.sellBy,
      category: product.defaultCategory?.[0]?.category || product.category,
    })
  }

  return products
}

/**
 * Create JSON response
 */
function jsonResponse(data, options = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}
