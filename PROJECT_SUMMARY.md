# ShopRite TRMNL Plugin - Project Summary

## What This Does

Displays current ShopRite sale items on your TRMNL eInk display, updating automatically throughout the week.

## Architecture

**Before (Didn't Work):**
- TRMNL plugin → RedPepper API → Download images → Too slow ❌

**Now (Fast & Reliable):**
- TRMNL plugin → Cloudflare Worker → Extract JSON → Display products ✅

## Components

### 1. Cloudflare Worker (`cloudflare-worker/`)
- **What**: Serverless API that scrapes ShopRite and returns clean JSON
- **How**: Fetches page, extracts `window.__PRELOADED_STATE__`, returns product data
- **Caching**: 24hr page cache, 1hr API cache
- **Cost**: FREE (within Cloudflare's generous limits)

### 2. TRMNL Plugin (`trmnl-plugin/`)
- **Grid View** (`markup-deals.html`): Product images in 3x3 grid
- **List View** (`markup-deals-list.html`): Compact text list, more items
- **How**: Calls Worker API, displays products with Liquid templating

### 3. Original Scripts (Still Useful!)
- **`get_circular.js`**: Find store IDs, test API, discover categories
- Now also useful for finding category IDs and testing

## Files Created

```
tallinn/
├── cloudflare-worker/
│   ├── shoprite-deals.js    # Main worker code
│   ├── wrangler.toml        # Cloudflare config
│   └── README.md            # Worker docs
├── trmnl-plugin/
│   ├── markup-deals.html         # Grid view (recommended)
│   ├── markup-deals-list.html    # List view (compact)
│   ├── markup-fullscreen.html    # Old circular image version
│   ├── markup.html               # Old circular image version
│   └── README.md                 # Plugin docs (old)
├── get_circular.js          # Store finder utility
├── SETUP.md                 # Step-by-step setup guide
└── PROJECT_SUMMARY.md       # This file
```

## Quick Start

1. **Deploy Worker**:
   ```bash
   cd cloudflare-worker
   wrangler login
   wrangler deploy
   ```

2. **Get Your Store ID**:
   ```bash
   node get_circular.js --list-stores
   ```

3. **Create TRMNL Plugin**:
   - Copy `markup-deals.html` into TRMNL private plugin
   - Set custom fields (API endpoint, store ID, category)
   - Add to playlist

4. **Done!** Deals show on your TRMNL display

## Configuration (TRMNL Custom Fields)

Required:
- `api_endpoint`: Your Cloudflare Worker URL
- `shoprite_store_id`: Your store (e.g., `641`)
- `shoprite_category`: Category to show (e.g., `meat-id-520692`)

Optional:
- `product_limit`: Max products (default: 12)
- `subcategory`: Filter (e.g., `Beef`)

## Finding Categories

Browse ShopRite.com, look at URL:
```
https://www.shoprite.com/sm/planning/rsid/641/categories/meat-id-520692
                                                          ^^^^^^^^^^^^^^
```

Common categories:
- `meat-id-520692` - Meat
- `produce-id-519971` - Produce
- `dairy-eggs-id-519913` - Dairy & Eggs
- `bakery-id-519977` - Bakery

## Why This Approach?

**Original Problem**: Circular image took too long to load
**Solution**: Extract JSON directly, show product list instead

**Benefits**:
- ⚡ Fast loading (pre-scraped data)
- 💰 Free to run (Cloudflare Workers)
- 🎯 More flexible (filter categories, subcategories)
- 🔄 Better caching (updates only when needed)
- 📱 Mobile-friendly format

## Data Flow

```
1. ShopRite.com has embedded JSON: window.__PRELOADED_STATE__
2. Worker fetches page, extracts JSON, caches for 24hr
3. TRMNL plugin calls Worker API (cached for 1hr)
4. Products display on eInk screen
5. Updates automatically per TRMNL schedule
```

## Example API Response

```json
{
  "store": "641",
  "category": "meat-id-520692",
  "count": 12,
  "products": [
    {
      "name": "USDA Choice Beef Rib Roast",
      "price": "$36.37 avg/ea",
      "unitPrice": "$12.99/lb",
      "wasPrice": "$44.77 avg/ea",
      "isDiscounted": true,
      "image": "https://assets.wakefern.com/...",
      "priceLabel": "On Sale! Limit 1"
    }
  ]
}
```

## Performance

- **Worker Response**: ~100-500ms (cached), ~1-2s (uncached)
- **TRMNL Render**: ~2-3s total (much faster than old method)
- **API Calls/Day**: ~48-96 (well within free tier)

## Future Enhancements

Possible additions:
- [ ] Support multiple stores/categories in one view
- [ ] Add price tracking (save best deals)
- [ ] Weekly deals digest (email/notification)
- [ ] Compare prices across stores
- [ ] Filter by dietary restrictions (from attributes)
- [ ] Show circular page images as fallback

## What We Learned

1. ShopRite embeds ALL data in `window.__PRELOADED_STATE__`
2. This is faster and more reliable than image loading
3. Cloudflare Workers are perfect for web scraping APIs
4. TRMNL works best with pre-processed data (not live scraping)

## Gift Impact

Your family will see:
- Current weekly deals from their local ShopRite
- Updated automatically
- Easy to read on eInk display
- Actually useful for meal planning! 🎄
