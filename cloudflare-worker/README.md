# ShopRite Deals API - Cloudflare Worker

A serverless API that extracts ShopRite product deals from their website and serves them as clean JSON.

## Features

- ✅ Extracts embedded JSON data from ShopRite category pages
- ✅ Returns clean, formatted product information
- ✅ Supports filtering by subcategory
- ✅ Automatic caching (24hr page cache, 1hr API cache)
- ✅ CORS enabled for browser requests
- ✅ Fast edge deployment via Cloudflare Workers

## Deployment

### Prerequisites

1. A Cloudflare account (free tier works fine)
2. Wrangler CLI installed: `npm install -g wrangler`

### Steps

1. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

2. **Create wrangler.toml**
   ```bash
   cd cloudflare-worker
   ```

   Create `wrangler.toml`:
   ```toml
   name = "shoprite-deals"
   main = "shoprite-deals.js"
   compatibility_date = "2024-01-01"

   [env.production]
   workers_dev = false
   route = "shoprite-deals.YOUR-SUBDOMAIN.workers.dev/*"
   ```

3. **Deploy**
   ```bash
   wrangler deploy
   ```

4. **Test Your Deployment**
   ```bash
   curl "https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev/shoprite-deals?store=641&category=meat-id-520692&limit=5"
   ```

## API Usage

### Endpoint

```
GET https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev/shoprite-deals
```

### Query Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `store` | Yes | ShopRite store ID | `641` |
| `category` | Yes | Category slug from URL | `meat-id-520692` |
| `limit` | No | Max products to return (default: 20) | `10` |
| `subcategory` | No | Filter by subcategory name | `Beef` |

### Example Requests

**Get meat deals:**
```
https://your-worker.workers.dev/shoprite-deals?store=641&category=meat-id-520692&limit=12
```

**Get only beef products:**
```
https://your-worker.workers.dev/shoprite-deals?store=641&category=meat-id-520692&subcategory=Beef&limit=10
```

**Get produce deals:**
```
https://your-worker.workers.dev/shoprite-deals?store=641&category=produce-id-519971&limit=15
```

### Response Format

```json
{
  "store": "641",
  "category": "meat-id-520692",
  "subcategory": null,
  "count": 10,
  "products": [
    {
      "sku": "00200216000003",
      "name": "USDA Choice Beef Center Cut Rib Roast",
      "description": "USDA Choice Beef Center Cut Rib Roast, Bone In, Custom Cut, 2 Rib Order Minimum",
      "brand": "USDA Choice",
      "price": "$36.37 avg/ea",
      "unitPrice": "$12.99/lb",
      "wasPrice": "$44.77 avg/ea",
      "priceLabel": "On Sale! Limit 1",
      "isDiscounted": true,
      "image": "https://assets.wakefern.com/is/image/wakefern/20021600000-322-Sold-by-Rib?$Mi9Product_cell$",
      "imageZoom": "https://assets.wakefern.com/is/image/wakefern/20021600000-322-Sold-by-Rib?$Mi9Product_zoom$",
      "available": true,
      "sellBy": "eachunit",
      "category": "Roasts & Briskets"
    }
  ],
  "categoryInfo": {
    "title": "Meat",
    "retailerCategoryId": "520692"
  }
}
```

## Finding Store IDs and Categories

### Store IDs

Use the existing `get_circular.js` script:
```bash
node get_circular.js --list-stores
```

Or visit ShopRite.com, select your store, and look in the URL:
```
https://www.shoprite.com/sm/planning/rsid/641/...
                                          ^^^
                                       Store ID
```

### Category Slugs

Browse ShopRite.com and copy the category from the URL:
```
https://www.shoprite.com/sm/planning/rsid/641/categories/meat-id-520692
                                                          ^^^^^^^^^^^^^^
                                                        Category Slug
```

Common categories:
- `meat-id-520692` - Meat
- `produce-id-519971` - Produce
- `dairy-eggs-id-519913` - Dairy & Eggs
- `bakery-id-519977` - Bakery
- `deli-id-519992` - Deli

## Caching Strategy

- **HTML Pages**: Cached for 24 hours (deals update weekly)
- **API Responses**: Cached for 1 hour
- **Cache Key**: Based on the ShopRite URL (includes store + category)

This ensures fast responses while keeping data relatively fresh.

## Costs

Cloudflare Workers free tier includes:
- 100,000 requests/day
- 10ms CPU time per request

For a TRMNL plugin refreshing every 30 minutes, you'll use ~48 requests/day - well within the free tier!

## Troubleshooting

### "Could not extract product data"

ShopRite may have changed their page structure. Check:
1. Visit the ShopRite URL directly in a browser
2. View page source and search for `window.__PRELOADED_STATE__`
3. If the structure changed, update the regex in `extractPreloadedState()`

### CORS errors

The worker includes CORS headers. If you still see errors:
- Verify the worker URL is correct
- Check browser console for specific CORS error details

### No products returned

- Verify the category slug is correct
- Try without subcategory filter first
- Check if the category has products on ShopRite.com
