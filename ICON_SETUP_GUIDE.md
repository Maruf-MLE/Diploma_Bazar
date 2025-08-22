# Icon Setup Guide for Diploma Bazar

## Current Setup
Your site now uses `/images/Logo.png` as the primary logo for:
- ✅ Browser tab favicon
- ✅ PWA manifest icons
- ✅ Apple touch icons
- ✅ Open Graph social media previews
- ✅ Twitter card images

## Recommended Icon Sizes for Optimal PWA Support

For best PWA experience, create these icon sizes from your main logo:

### Required Icon Sizes:
1. **192x192px** - For PWA installation
2. **512x512px** - For PWA splash screen
3. **180x180px** - For Apple touch icon
4. **32x32px** - For browser favicon
5. **16x16px** - For browser favicon

### How to Generate Icons:
1. Use your original `/images/Logo.png` file
2. Create square versions in the sizes above
3. Save them as:
   - `/images/logo-192.png`
   - `/images/logo-512.png`
   - `/images/logo-180.png`
   - `/images/logo-32.png`
   - `/images/logo-16.png`

### Online Tools for Icon Generation:
- https://realfavicongenerator.net/
- https://favicon.io/
- https://www.pwabuilder.com/imageGenerator

## Current Configuration Files Updated:
- ✅ `index.html` - Updated favicon and apple-touch-icon
- ✅ `public/manifest.json` - Updated PWA icons
- ✅ Meta tags updated for social media

## Testing PWA Installation:
1. Open your site in Chrome/Edge
2. Open DevTools (F12) → Application → Manifest
3. Check if icons are loading correctly
4. Test "Add to Home Screen" functionality