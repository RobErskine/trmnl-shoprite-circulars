# ShopRite TRMNL Plugin - Complete Setup Guide

This guide will walk you through deploying the ShopRite Deals API and setting up your TRMNL plugin.

## Overview

```
┌─────────────┐
│ ShopRite.com│
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│ Cloudflare Worker    │  ← You deploy this
│ (Scrapes & caches    │
│  product data)       │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│ TRMNL eInk Display   │  ← Shows the deals!
└──────────────────────┘
```

## Part 1: Deploy the Cloudflare Worker

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for you to authenticate.

### Step 3: Deploy the Worker

```bash
cd cloudflare-worker
wrangler deploy
```

You'll get a URL like: `https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev`

**Save this URL!** You'll need it for the TRMNL plugin.

### Step 4: Test Your Worker

```bash
curl "https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev/shoprite-deals?store=641&category=meat-id-520692&limit=5"
```

You should see JSON data with ShopRite products.

## Part 2: Find Your Store ID

### Option A: Use the Script

```bash
cd ..  # back to main directory
node get_circular.js --list-stores
```

Find your store in the list and note its ID.

### Option B: Manual Method

1. Go to https://www.shoprite.com
2. Select your store
3. Browse to any category
4. Look at the URL: `https://www.shoprite.com/sm/planning/rsid/641/...`
5. The number after `rsid/` is your store ID (e.g., `641`)

## Part 3: Choose Your Category

Browse ShopRite.com and find the category you want to display. Copy the category slug from the URL.

**Examples:**
- Meat: `meat-id-520692`
- Produce: `produce-id-519971`
- Dairy: `dairy-eggs-id-519913`
- Bakery: `bakery-id-519977`

**URL Format:**
```
https://www.shoprite.com/sm/planning/rsid/641/categories/meat-id-520692
                                                          ^^^^^^^^^^^^^^
                                                        This is what you need
```

## Part 4: Create Your TRMNL Plugin

### Step 1: Create Private Plugin

1. Log in to https://usetrmnl.com
2. Go to **Plugins** → **Private Plugins**
3. Click **+ New Private Plugin**
4. Name it "ShopRite Weekly Deals"

### Step 2: Add Custom Fields

Add these custom fields to your plugin:

| Field Name | Type | Default Value | Description |
|------------|------|---------------|-------------|
| `api_endpoint` | Text | `https://shoprite-deals.YOUR-SUBDOMAIN.workers.dev/shoprite-deals` | Your Cloudflare Worker URL |
| `shoprite_store_id` | Text | `641` | Your store ID |
| `shoprite_category` | Text | `meat-id-520692` | Category to display |
| `product_limit` | Number | `12` | Max products to show |
| `subcategory` | Text | _(leave empty)_ | Optional: filter by subcategory |

**Important:** Replace `YOUR-SUBDOMAIN` with your actual Cloudflare Workers subdomain!

### Step 3: Choose Your Layout

Pick ONE of these markup files to use:

#### Option A: Grid View (Recommended)
Best for showing products with images.

Copy the contents of: `trmnl-plugin/markup-deals.html`

#### Option B: List View
Compact, shows more items at once.

Copy the contents of: `trmnl-plugin/markup-deals-list.html`

### Step 4: Add Markup to Plugin

1. In your TRMNL private plugin, go to the **Markup** tab
2. Paste the markup you chose
3. Click **Save**

### Step 5: Configure Plugin Settings (Optional)

- **Refresh Interval**: Set to 30-60 minutes (deals don't change often)
- **Active Hours**: Optionally limit when the plugin shows

### Step 6: Add to Playlist

1. Go to your TRMNL dashboard
2. Add "ShopRite Weekly Deals" to your playlist
3. Save your playlist

## Customization Options

### Display Different Categories

Want to show produce instead of meat? Update the custom fields:

```
shoprite_category: produce-id-519971
```

### Filter by Subcategory

Only want to see beef products? Add to custom fields:

```
subcategory: Beef
```

Available subcategories vary by category. Common ones:
- Meat: `Beef`, `Chicken`, `Pork`, `Turkey`
- Produce: `Fruits`, `Vegetables`, `Organic`

### Adjust Number of Products

Change the `product_limit` custom field:
- Grid View: 9-12 products works best
- List View: 12-20 products works best

## Multiple Stores/Categories

Want to show different categories? Create multiple plugin instances:

1. Duplicate your private plugin
2. Change the `shoprite_category` in custom fields
3. Add both to your playlist

## Troubleshooting

### "Error Loading Deals"

**Check:**
1. Is your Cloudflare Worker URL correct?
2. Did you deploy the worker successfully?
3. Test the worker URL in your browser

### "No products found"

**Check:**
1. Is the category slug correct?
2. Does the category have products on ShopRite.com?
3. Try removing the subcategory filter

### Plugin not refreshing

**Check:**
1. TRMNL refresh settings
2. Cloudflare Worker cache (clears automatically after 1 hour)

### Products showing wrong store

**Check:**
1. Verify `shoprite_store_id` in custom fields
2. Ensure you're using the correct store ID

## Cost

**Cloudflare Workers:** FREE
- 100,000 requests/day free tier
- Your TRMNL plugin will use ~48-96 requests/day
- Well within free limits!

**TRMNL:** Whatever your subscription plan is

## Need Help?

1. Check the Worker is responding: Test the URL in your browser
2. Check TRMNL plugin logs (if available)
3. Verify all custom field values are correct

## Example Custom Field Values

For a complete working example:

```
api_endpoint: https://shoprite-deals.your-subdomain.workers.dev/shoprite-deals
shoprite_store_id: 641
shoprite_category: meat-id-520692
product_limit: 12
subcategory: (empty)
```

## Next Steps

- Experiment with different categories
- Try the list view vs grid view
- Set up multiple instances for different sections
- Adjust refresh timing to your preferences

Enjoy your ShopRite deals on TRMNL! 🛒
