# ShopRite Weekly Circular Plugin for TRMNL

This plugin displays the first page of your local ShopRite weekly circular on your TRMNL eInk display.

## Files

- `markup.html` - Standard version with title bar
- `markup-fullscreen.html` - Full-screen version for maximum readability (recommended)

## Setup Instructions

### Step 1: Create a Private Plugin

1. Log in to your TRMNL account at https://usetrmnl.com
2. Navigate to **Plugins** > **Private Plugins**
3. Click **+ New Private Plugin**
4. Give it a name like "ShopRite Circular"

### Step 2: Add Custom Field for Store ID

1. In the plugin settings, look for **Custom Fields** section
2. Add a new custom field:
   - **Field Name**: `shoprite_store_id`
   - **Field Type**: Text
   - **Default Value**: `630` (or your preferred store ID)

### Step 3: Configure Plugin Settings

1. **Polling Strategy**: Set to refresh daily (circulars update weekly)
2. **No Bleed**: Enable this option for the fullscreen version to remove padding
3. **Orientation**: Landscape works best for circular images

### Step 4: Add the Markup

1. Navigate to the **Markup** tab in your private plugin
2. Copy the entire contents of `markup-fullscreen.html` (recommended) or `markup.html`
3. Paste it into the markup editor
4. Click **Save**

### Step 5: Find Your Store ID

Run the included script to find your store's ID:

```bash
# List all available stores
node get_circular.js --list-stores

# Search by city name
node get_circular.js --city "Your City Name"
```

Common Store IDs (New Jersey):
- `630` - Manasquan/Wall Township
- Other stores can be found using the --list-stores command

### Step 6: Add to Your Playlist

1. Go to your TRMNL dashboard
2. Add the ShopRite Circular plugin to your playlist
3. Configure the store ID in the instance settings if different from the default

## How It Works

The plugin:
1. Fetches store location data from the RedPepper Digital API (ShopRite's circular provider)
2. Finds the current weekly circular for your store ID
3. Retrieves the first page image URL
4. Displays it on your TRMNL device

The circular images are served from CloudFront CDN and update automatically when ShopRite publishes a new weekly circular (typically Wednesday/Sunday).

## Troubleshooting

### "No weekly circular found"
- Verify your store ID is correct using `node get_circular.js --store-id YOUR_ID`
- Some stores may have different circular schedules

### Image not loading
- Check that the store has an active circular
- TRMNL renders the plugin as a screenshot; ensure JavaScript has time to execute

### Wrong circular displayed
- The plugin filters for "Week of" titled circulars (main weekly circular)
- It automatically selects the most recent one

## API Reference

The plugin uses these RedPepper Digital API endpoints:
- Store locations: `https://app.redpepper.digital/client/4573/catalogue/geo_location/json`
- Page images: `https://app.redpepper.digital/catalogue/{ID}/page-images/json`
- Metadata: `https://app.redpepper.digital/node/{ID}`

## Customization

### Displaying a Different Page

To show a different page (e.g., page 2 for more deals), modify the `getFirstPage` function in the markup to return a different page from the array.

### Multiple Stores

Create multiple plugin instances, each with a different `shoprite_store_id` in the custom fields.

### Circular Type

The plugin is configured for the main "Week of" circular. You could modify the code to show:
- Wellness circulars (title contains "wellness")
- Hispanic circulars (title contains "hispanic")
