# Nostr Image Preview Troubleshooting

This document explains how image previews work in Nostr and what to check if images aren't displaying.

## How Our Implementation Works

When sharing a card to Nostr, we use **multiple approaches** to ensure maximum compatibility:

### Content Format
```
Card Title

https://example.com/card/naddr1...

https://example.com/image.jpg

#ecard #birthday
```

The content follows this structure:
1. **Card title** - The name of the card
2. **Card link** - Direct link to view the card
3. **Blossom image URL** - The image link for preview
4. **Hashtags** - Category tags for discoverability

### Tag Approaches
We include **4 different tag types** for maximum client compatibility:

1. **`image` tag**: `["image", "https://example.com/image.jpg"]`
   - Simple, widely supported approach
   - Used by many older clients

2. **`imeta` tag**: `["imeta", "url https://example.com/image.jpg", "m image/jpeg", "alt ...", "fallback ..."]`
   - NIP-92 standard for rich media
   - Supported by newer clients

3. **`r` tag**: `["r", "https://example.com/image.jpg"]`
   - Reference tag approach
   - Some clients use this for media detection

4. **`url` tag**: `["url", "https://example.com/image.jpg"]`
   - Alternative approach for some clients

## Troubleshooting Steps

### 1. Check Your Nostr Client
Different clients have varying levels of image support:

**Clients with Good Image Support:**
- Damus (iOS/macOS)
- Amethyst (Android)
- Iris (Web)
- Snort (Web)
- Nostrudel (Web)

**Clients with Limited Support:**
- Some web clients may not show images
- Older clients may only show links

### 2. Verify Image URL
Make sure the image URL:
- ✅ Is publicly accessible (no authentication required)
- ✅ Uses HTTPS (not HTTP)
- ✅ Has proper CORS headers
- ✅ Is a direct image URL (not a page containing an image)
- ✅ Uses a common format (JPG, PNG, GIF, WebP)

### 3. Test Image URL Directly
Copy the image URL and paste it in a browser to verify it loads correctly.

### 4. Check Network/Relay Issues
- Try different relays
- Check if other images from the same host work
- Verify your internet connection

### 5. Client-Specific Issues
Some clients may:
- Cache images aggressively
- Block certain image hosts
- Have size limits for images
- Require specific image formats

## Debug Information

In development mode, the share dialog includes a debug section showing:
- Exact content that will be posted
- All tags being included
- Image detection methods used

## Expected Behavior

**What Should Happen:**
1. Image appears inline in the post
2. Card title appears below the image
3. Card link appears below the title
4. Image is clickable/expandable in most clients

**If Images Don't Show:**
- The post should still be functional
- Users can click the image URL to view it
- The card link still works normally

## Common Issues

### Issue: "Image shows as link only"
**Cause:** Client doesn't support image previews or URL format
**Solution:** Try a different Nostr client

### Issue: "Image doesn't load"
**Cause:** Image host blocks requests or CORS issues
**Solution:** Check if image URL works in browser

### Issue: "Some images work, others don't"
**Cause:** Different image hosts have different policies
**Solution:** Use reliable image hosting services

## Recommended Image Hosts for Nostr

For best compatibility, use these image hosting services:
- nostr.build
- void.cat
- nostrcheck.me
- imgur.com
- Any CDN with proper CORS headers

## Technical Details

Our implementation follows these Nostr standards:
- **NIP-92**: Media Attachments
- **NIP-94**: File Metadata (for reference)
- **Kind 1**: Text Notes (standard post format)

The multi-tag approach ensures compatibility across the entire Nostr ecosystem, from basic clients to advanced ones with full NIP-92 support.