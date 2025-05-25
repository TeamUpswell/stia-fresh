// Find line 161 and add a fallback check:

// Before (causing error):
{navigationItems.map((section) =>
  section.items.map((item) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }
    // ... rest of code
  })
)}

// After (with fallback):
{navigationItems.map((section) =>
  section.items.map((item) => {
    if (item.permission && typeof hasPermission === 'function' && !hasPermission(item.permission)) {
      return null;
    }
    // ... rest of code
  })
)}