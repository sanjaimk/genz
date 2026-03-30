# Cache.js API Reference

## Overview
`js/cache.js` is a performance utility module that provides:
- localStorage/sessionStorage caching with TTL
- Firestore data caching
- Image URL optimization
- Debounce/throttle utilities
- Listener tracking to prevent duplicates

---

## Installation

```javascript
import { cache, optimizeCloudinaryUrl, debounce, throttle } from './js/cache.js';
```

---

## CacheManager Class

### Properties
- `memoryCache` - In-memory Map (fastest, session-only)

### Methods

#### `set(namespace, identifier, data, ttlMs)`
Store data in cache with optional TTL.

**Parameters:**
- `namespace` (string) - Category (e.g., 'posts', 'users', 'feedback')
- `identifier` (string) - Unique key (e.g., 'all', 'userId123')
- `data` (any) - Data to cache
- `ttlMs` (number, optional) - Time-to-live in milliseconds

**Returns:** `data`

**Example:**
```javascript
cache.set('posts', 'all', postsArray);
cache.set('users', 'uid123', userData, 10 * 60 * 1000); // 10 min TTL
```

#### `get(namespace, identifier)`
Retrieve data from cache if not expired.

**Parameters:**
- `namespace` (string) - Category
- `identifier` (string) - Unique key

**Returns:** `data` or `null` if expired/missing

**Example:**
```javascript
const posts = cache.get('posts', 'all');
if (posts) {
  console.log('Using cached data');
} else {
  console.log('Cache miss - fetch from Firebase');
}
```

#### `has(namespace, identifier)`
Check if cache entry exists and is valid.

**Parameters:**
- `namespace` (string) - Category
- `identifier` (string) - Unique key

**Returns:** `boolean`

**Example:**
```javascript
if (cache.has('users', 'uid123')) {
  const user = cache.get('users', 'uid123');
}
```

#### `invalidate(namespace, identifier)`
Remove specific cache entry.

**Parameters:**
- `namespace` (string) - Category
- `identifier` (string) - Unique key

**Returns:** `void`

**Example:**
```javascript
cache.invalidate('posts', 'all');
```

#### `clearNamespace(namespace)`
Clear all cache entries in a namespace.

**Parameters:**
- `namespace` (string) - Category

**Returns:** `void`

**Example:**
```javascript
cache.clearNamespace('posts'); // Clear all posts cache
```

#### `clearAll()`
Clear all cache (memory + localStorage).

**Returns:** `void`

**Example:**
```javascript
cache.clearAll(); // Nuclear option - clear everything
```

---

## Utility Functions

### `optimizeCloudinaryUrl(url)`
Add quality and format parameters to Cloudinary URLs.

**Parameters:**
- `url` (string) - Cloudinary image URL

**Returns:** `string` - Optimized URL

**Example:**
```javascript
const original = 'https://res.cloudinary.com/user/image/upload/v123/photo.jpg';
const optimized = optimizeCloudinaryUrl(original);
// Result: https://res.cloudinary.com/user/image/upload/w_auto,q_auto,f_auto/v123/photo.jpg
```

**Parameters Added:**
- `w_auto` - Responsive width
- `q_auto` - Automatic quality
- `f_auto` - Automatic format (WEBP for supported browsers)

### `cachedGetDocs(db, namespace, queryRef, shouldCache)`
Fetch multiple documents with caching.

**Parameters:**
- `db` - Firebase db instance
- `namespace` (string) - Cache category
- `queryRef` - Firestore query object
- `shouldCache` (boolean, optional) - Enable caching (default: true)

**Returns:** Promise<array> - Documents array

**Example:**
```javascript
import { cachedGetDocs } from './js/cache.js';
import { collection, query, where, orderBy } from 'firebase-firestore';

const q = query(
  collection(db, 'posts'),
  where('status', '==', 'approved'),
  orderBy('createdAt', 'desc')
);

const posts = await cachedGetDocs(db, 'posts', q);
```

### `cachedGetDoc(db, namespace, docRef, shouldCache)`
Fetch single document with caching.

**Parameters:**
- `db` - Firebase db instance
- `namespace` (string) - Cache category
- `docRef` - Firestore document reference
- `shouldCache` (boolean, optional) - Enable caching (default: true)

**Returns:** Promise<object> - Document data with id

**Example:**
```javascript
import { cachedGetDoc } from './js/cache.js';
import { doc } from 'firebase-firestore';

const userDoc = await cachedGetDoc(db, 'users', doc(db, 'users', 'uid123'));
```

### `debounce(func, waitMs)`
Debounce function - delays execution until wait period passes.

**Parameters:**
- `func` (function) - Function to debounce
- `waitMs` (number) - Wait time in milliseconds

**Returns:** `function` - Debounced function

**Example:**
```javascript
import { debounce } from './js/cache.js';

const debouncedSearch = debounce((query) => {
  // This won't fire until 500ms after last keystroke
  searchPosts(query);
}, 500);

input.addEventListener('keyup', (e) => {
  debouncedSearch(e.target.value);
});
```

### `throttle(func, limitMs)`
Throttle function - executes at most once per limit period.

**Parameters:**
- `func` (function) - Function to throttle
- `limitMs` (number) - Time limit in milliseconds

**Returns:** `function` - Throttled function

**Example:**
```javascript
import { throttle } from './js/cache.js';

const throttledScroll = throttle(() => {
  // This fires at most once per 100ms
  loadMorePostsIfNeeded();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### `isListenerActive(namespace)`
Check if listener is already registered.

**Parameters:**
- `namespace` (string) - Listener category

**Returns:** `boolean`

**Example:**
```javascript
if (!isListenerActive('posts')) {
  registerListener('posts');
  // Setup listener
}
```

### `registerListener(namespace)`
Mark listener as active (prevents duplicates).

**Parameters:**
- `namespace` (string) - Listener category

**Returns:** `void`

### `unregisterListener(namespace)`
Mark listener as inactive.

**Parameters:**
- `namespace` (string) - Listener category

**Returns:** `void`

---

## Cache TTLs (Time-To-Live)

Default TTLs defined in `cache.js`:

```javascript
const CACHE_TTL = {
  POSTS: 5 * 60 * 1000,           // 5 minutes
  USERS: 10 * 60 * 1000,          // 10 minutes
  FEEDBACK: 10 * 60 * 1000,       // 10 minutes
  STATS: 5 * 60 * 1000,           // 5 minutes
  IMAGES: 24 * 60 * 60 * 1000     // 24 hours
};
```

Adjust these values based on your needs:
- **Frequently updated data** (posts): 3-5 min
- **Stable data** (users): 10-30 min
- **Images**: 1-24 hours

---

## Common Patterns

### Pattern 1: Fetch with Cache Fallback
```javascript
// Check cache first
let posts = cache.get('posts', 'all');

if (!posts) {
  // Cache miss - fetch from Firebase
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Store in cache
  cache.set('posts', 'all', posts);
}

return posts;
```

### Pattern 2: Search with Debounce
```javascript
const debouncedSearch = debounce(async (query) => {
  const results = await searchFirestore(query);
  cache.set('search_results', query, results);
  updateUI(results);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Pattern 3: Infinite Scroll with Throttle
```javascript
const throttledScroll = throttle(() => {
  if (isNearBottom()) {
    loadNextBatch();
  }
}, 1000);

window.addEventListener('scroll', throttledScroll);
```

### Pattern 4: Update Single Cache Entry
```javascript
// Get user from cache
let user = cache.get('users', 'uid123');

// Update properties
user.points += 100;

// Re-cache updated user
cache.set('users', 'uid123', user);
```

### Pattern 5: Bulk Cache Operations
```javascript
// Get all posts and users
const posts = cache.get('posts', 'all');
const users = cache.get('users', 'all');

// Combine and process
const enrichedPosts = posts.map(post => ({
  ...post,
  author: users.find(u => u.id === post.userId)
}));
```

---

## Debugging

### Enable Cache Logging
Add to `js/cache.js`:
```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('[Cache] Stored:', namespace, identifier);
  console.log('[Cache] Retrieved:', data);
}
```

### Check Cache Contents
```javascript
// In browser console:
console.log(cache.memoryCache);
console.log(localStorage);
```

### Monitor Cache Hits/Misses
```javascript
let cacheHits = 0;
let cacheMisses = 0;

const originalGet = cache.get;
cache.get = function(namespace, identifier) {
  const result = originalGet.call(this, namespace, identifier);
  if (result) cacheHits++;
  else cacheMisses++;
  console.log(`Cache Stats: ${cacheHits} hits, ${cacheMisses} misses`);
  return result;
};
```

---

## Best Practices

1. **Always check cache before Firebase**
   ```javascript
   const data = cache.get(ns, id) || await fetchFromFirebase();
   ```

2. **Use appropriate namespaces**
   ```javascript
   cache.set('posts', 'all', ...) // Good
   cache.set('myData', 'stuff', ...) // Avoid - unclear
   ```

3. **Invalidate after mutations**
   ```javascript
   await createPost(newPost);
   cache.invalidate('posts', 'all'); // Clear stale data
   ```

4. **Use debounce for user inputs**
   ```javascript
   // Don't: Fires on every keystroke
   input.addEventListener('input', search);
   
   // Do: Fires only after user stops typing
   input.addEventListener('input', debounce(search, 300));
   ```

5. **Set appropriate TTLs**
   ```javascript
   // Real-time data needs shorter TTL
   cache.set('stats', 'all', stats, 2 * 60 * 1000); // 2 min
   
   // Static data can have longer TTL
   cache.set('categories', 'all', categories, 24 * 60 * 60 * 1000); // 1 day
   ```

---

## Troubleshooting

### Cache not persisting across reloads
- Check if localStorage is enabled
- Check browser privacy mode (may disable localStorage)
- Check if TTL has expired

### "localStorage quota exceeded" error
- Clear cache: `cache.clearAll()`
- Reduce cache TTL values
- Store smaller data

### Cache showing stale data
- Reduce TTL for that namespace
- Call `cache.invalidate()` after mutations
- Manually refresh page (F5)

### Memory leak concerns
- Cache is automatically cleaned by TTL expiration
- localStorage has built-in quota limits
- Unregister listeners when done

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 3, 2026 | Initial release |

---

**Last Updated:** February 3, 2026  
**Compatibility:** Modern browsers with ES6 module support  
**License:** MIT (same as GenZcleaning project)
