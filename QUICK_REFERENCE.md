# ShopRite TRMNL Plugin - Quick Reference

## 🚀 Deployment Checklist

- [ ] Deploy Cloudflare Worker
- [ ] Test Worker API
- [ ] Find your store ID
- [ ] Choose your category
- [ ] Create TRMNL private plugin
- [ ] Add custom fields
- [ ] Copy markup
- [ ] Add to playlist

## 📝 Essential Commands

```bash
# Deploy worker
cd cloudflare-worker && wrangler deploy

# Find store ID
node get_circular.js --list-stores

# Find store by city
node get_circular.js --city "Manasquan"

# Test worker locally
wrangler dev
```

## 🔧 TRMNL Custom Fields

```
api_endpoint: https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev/shoprite-deals
shoprite_store_id: 641
shoprite_category: meat-id-520692
product_limit: 12
subcategory: (optional)
```

## 📂 File Guide

| File | Purpose |
|------|---------|
| `cloudflare-worker/shoprite-deals.js` | Main API code |
| `trmnl-plugin/markup-deals.html` | Grid view (recommended) |
| `trmnl-plugin/markup-deals-list.html` | List view (compact) |
| `get_circular.js` | Utility to find stores |
| `SETUP.md` | Detailed setup guide |

## 🏪 Common Store IDs (NJ)

```
630 - Manasquan/Wall Township
641 - Brick Township
(Run get_circular.js --list-stores for full list)
```

## 📦 Popular Categories

```
meat-id-520692          Meat
produce-id-519971       Produce
dairy-eggs-id-519913    Dairy & Eggs
bakery-id-519977        Bakery
deli-id-519992          Deli
seafood-id-520071       Seafood
```

## 🎯 Subcategory Filters

**Meat:**
- Beef
- Chicken
- Pork
- Turkey

**Produce:**
- Fruits
- Vegetables
- Organic

## 🔍 Finding Category IDs

1. Go to ShopRite.com
2. Select your store
3. Click into a category
4. Copy from URL: `categories/CATEGORY-ID-HERE`

Example:
```
https://www.shoprite.com/sm/planning/rsid/641/categories/meat-id-520692
                                                          ^^^^^^^^^^^^^^
```

## 🧪 Testing Your Worker

```bash
# Test meat category
curl "https://YOUR-WORKER.workers.dev/shoprite-deals?store=641&category=meat-id-520692&limit=5"

# Test with subcategory
curl "https://YOUR-WORKER.workers.dev/shoprite-deals?store=641&category=meat-id-520692&subcategory=Beef&limit=5"

# Test produce
curl "https://YOUR-WORKER.workers.dev/shoprite-deals?store=641&category=produce-id-519971&limit=10"
```

## 💡 Pro Tips

- **Grid View**: Shows 9-12 products with images (best for visual appeal)
- **List View**: Shows 15-20 products as text (best for more info)
- **Refresh Rate**: 30-60 minutes is plenty (deals update weekly)
- **Subcategories**: Leave blank to show all, or filter to specific type
- **Multiple Categories**: Create multiple plugin instances!

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Error Loading Deals" | Check Worker URL is correct |
| "No products found" | Verify category ID, try without subcategory |
| Wrong store | Check `shoprite_store_id` value |
| Products not updating | Wait for cache to expire (1hr) or redeploy worker |

## 📊 Example Setups

### Weekly Meat Deals
```
category: meat-id-520692
subcategory: (empty)
limit: 12
```

### Produce Only
```
category: produce-id-519971
subcategory: (empty)
limit: 15
```

### Just Chicken
```
category: meat-id-520692
subcategory: Chicken
limit: 12
```

## 🔗 Useful Links

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [TRMNL Dashboard](https://usetrmnl.com/dashboard)
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)

## 💰 Costs

- **Cloudflare Workers**: FREE (100k requests/day)
- **Your Usage**: ~48-96 requests/day
- **Margin**: You'll use < 0.1% of free tier!

## 🎁 Gift Ready!

Once deployed:
1. Add to TRMNL playlist
2. Set refresh to 30-60 min
3. Your family sees fresh deals automatically
4. Perfect for meal planning!
