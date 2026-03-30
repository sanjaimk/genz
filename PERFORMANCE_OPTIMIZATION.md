# Performance Optimization Guide

## Overview
This document outlines all performance optimizations implemented to maximize loading speed, minimize Firebase reads, and improve user experience.

---

## 1. Image Optimization

### Preloading Critical Images
Added `<link rel="preload">` tags in HTML `<head>` for above-the-fold images:

**index.html:**
- `assets/logo.png` - Site logo (header)
- `assets/step1.png`, `step2.png`, `step3.png`, `step4.png` - How-it-works section
- `assets/drive1.jpg` - Featured cleanup image

**dashboard.html:**
- `assets/logo.png` - Site logo

### Eager Loading
Updated all above-the-fold images to use `loading="eager"` and `fetchpriority="high"`:
- Header logo
- Header profile image
- Home page step images
- User avatars in critical sections

Mobile navigation images use `loading="lazy"` to avoid unnecessary downloads.

### Cloudinary Optimization
Use the `optimizeCloudinaryUrl()` function from `js/cache.js` to add:
- `w_auto` - Automatic width optimization
- `q_auto` - Automatic quality optimization
- `f_auto` - Automatic format (WEBP for modern browsers)

**Example:**
```javascript
import { optimizeCloudinaryUrl } from './js/cache.js';
const optimizedUrl = optimizeCloudinaryUrl(imageUrl);
```

---

## 2. Firebase Optimization

### Removed Real-Time Listeners
Replaced all `onSnapshot()` listeners with one-time `getDocs()` / `getDoc()` calls:

**Modified Files:**
- `js/admin.js` - Removed pending posts and community posts real-time listeners
- `js/dashboard-data.js` - Removed profile, cleanups, and enrolled posts listeners
- `js/posts.js` - Replaced `listenToPosts()` with `fetchApprovedPosts()`

### Cache Strategy
Implemented 3-tier caching in `js/cache.js`:
1. **Memory Cache** - Session-based, fastest access
2. **localStorage** - Persists across page reloads
3. **Firebase** - On-demand fetching if cache misses

**Cache TTLs:**
- Posts: 5 minutes
- Users: 10 minutes
- Feedback: 10 minutes
- Stats: 5 minutes
- Images: 24 hours

### Data Fetching
- Firestore data loads **once** per page refresh
- Users can manually refresh browser for latest data
- All caching is automatic via `cache.js`

---

## 3. Script Optimization

### Deferred Script Loading
Added `defer` attribute to non-critical scripts to prevent render blocking:

**index.html:**
- `js/config.js` - Deferred
- Botpress Webchat - Deferred

**dashboard.html:**
- `js/layout.js` - Deferred
- Dashboard module - Deferred
- Botpress Webchat - Deferred

### Module Loading Strategy
- `js/layout.js` loads header/footer asynchronously
- Dashboard data loads after DOM is ready
- Firebase auth state checked before showing content

---

## 4. Implementation Guide

### Using the Cache Manager

```javascript
import { cache, optimizeCloudinaryUrl } from './js/cache.js';

// Store data in cache
cache.set('posts', 'all', postsArray, 5 * 60 * 1000); // 5 minute TTL

// Retrieve from cache
const cachedPosts = cache.get('posts', 'all');
if (cachedPosts) {
  console.log('Using cached data');
} else {
  // Fetch from Firebase if not cached
  const posts = await getDocs(query(...));
  cache.set('posts', 'all', posts);
}

// Optimize image URLs
const optimizedUrl = optimizeCloudinaryUrl(cloudinaryUrl);
```

### Converting onSnapshot to One-Time Reads

**Before (Real-time):**
```javascript
onSnapshot(postsRef, (snapshot) => {
  console.log('Posts updated!');
  // Loads every time data changes
});
```

**After (One-time):**
```javascript
const snapshot = await getDocs(postsRef);
const posts = snapshot.docs.map(doc => ({...}));
cache.set('posts', 'all', posts);
```

---

## 5. Performance Metrics

### Expected Improvements
- **First Contentful Paint (FCP)**: ↓ ~30-40% (images load immediately)
- **Largest Contentful Paint (LCP)**: ↓ ~25-35% (defer non-critical scripts)
- **Firebase Reads**: ↓ ~95% (no real-time listeners, one-time per refresh)
- **Time to Interactive**: ↓ ~20-30% (deferred scripts)

### Before Optimization
- Multiple onSnapshot listeners creating continuous reads
- Scripts blocking render until Firebase data loaded
- Lazy loading delays initial image display
- No caching strategy

### After Optimization
- ✅ Images load immediately (preload + eager)
- ✅ Firebase data loads once per refresh
- ✅ All data cached in memory and localStorage
- ✅ Non-critical scripts deferred
- ✅ Cloudinary URLs optimized for format/quality

---

## 6. Maintenance

### Invalidating Cache
```javascript
// Clear specific cache entry
cache.invalidate('posts', 'all');

// Clear all posts cache
cache.clearNamespace('posts');

// Clear everything
cache.clearAll();
```

### Manual Refresh
Users can press `F5` or `Ctrl+R` to:
1. Fetch fresh data from Firestore
2. Load latest images
3. Update cache with new TTLs

### Adding New Cache Keys
When adding new Firestore collections, define cache TTL:
```javascript
const CACHE_TTL = {
  POSTS: 5 * 60 * 1000,
  USERS: 10 * 60 * 1000,
  YOUR_COLLECTION: 10 * 60 * 1000, // Add here
};
```

---

## 7. Browser DevTools

### Check FCP/LCP
```
Lighthouse → Performance tab
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
```

### Monitor Firebase Reads
```
Firebase Console → Firestore → Usage
- Before: 10-50 reads per minute (real-time listeners)
- After: 1-3 reads per minute (one-time per refresh)
```

### Verify Image Optimization
```
Network tab → Images
- Look for "?w_auto&q_auto&f_auto" in Cloudinary URLs
- PNG images should be <100KB
- JPEG should be <50KB
```

---

## 8. Rollback Strategy

If performance issues occur:

1. **Restore real-time listeners:**
   - Revert `admin.js`, `dashboard-data.js`, `posts.js` changes
   - Uncomment `onSnapshot` imports

2. **Restore lazy loading:**
   - Remove `loading="eager"` from images
   - Restore default lazy loading behavior

3. **Clear cache:**
   ```javascript
   cache.clearAll();
   localStorage.clear();
   ```

---

## 9. Testing Checklist

- [ ] Images load before Firebase data
- [ ] No duplicate Firebase calls (check Firestore usage)
- [ ] Cache persists across page reloads
- [ ] Manual refresh fetches fresh data
- [ ] All features work (no UI broken)
- [ ] Mobile performance improved
- [ ] Lighthouse score >85 on Performance
- [ ] Firebase free tier sufficient (<5M reads/month)

---

## 10. Future Optimizations

1. **Service Worker Caching** - Cache entire page for offline support
2. **Image CDN** - Use Cloudinary Pro for better image delivery
3. **Pagination** - Limit Firebase queries to 50 docs at a time
4. **Incremental Loading** - Load data as user scrolls
5. **GraphQL** - Consider Firebase Realtime Database GraphQL API for efficient queries

---

**Last Updated:** February 3, 2026
**Framework:** Firebase + Cloudinary + Vanilla JS
**Performance Goal:** <2s FCP on 4G networks
