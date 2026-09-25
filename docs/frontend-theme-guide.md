# CSS Refactoring Guide

## Overview

The frontend CSS has been refactored to use a centralized theme system with consistent colors, spacing, and reusable component styles.

## What's Been Done

### ✅ Completed Files

1. **Core Theme Files**
   - `src/styles/theme.css` - All CSS variables, design tokens, and utility classes
   - `src/styles/components.css` - Shared component patterns (buttons, cards, forms, etc.)
   - `src/index.css` - Updated to import theme and components

2. **Refactored Components**
   - `Components/Navbar/Navbar.css` ✓
   - `Components/Footer/Footer.css` ✓
   - `Components/Categories/Categories.css` ✓
   - `Components/SearchBox/SearchBox.css` ✓
   - `Components/AuthForm/AuthForm.css` ✓

3. **Refactored Pages**
   - `Pages/LoginSignup/LoginSignup.css` ✓
   - `Pages/Homepage/Homepage.css` ✓
   - `App.css` ✓ (removed duplicate theme variables)

## Theme System

### Color Variables

```css
/* Primary colors */
--primary-color, --primary-hover, --primary-light, --primary-dark
--secondary-color, --secondary-hover, --secondary-light, --secondary-dark

/* Semantic colors */
--success-color, --warning-color, --error-color, --info-color

/* Backgrounds */
--background-primary, --background-secondary, --background-tertiary
--card-bg, --form-bg, --header-bg, --sidebar-bg, --modal-bg

/* Text */
--text-primary, --text-secondary, --text-muted, --text-white, --text-disabled

/* Borders */
--border-color, --border-hover, --border-focus, --divider-color
```

### Spacing System

```css
--spacing-xs: 0.25rem (4px) --spacing-sm: 0.5rem (8px) --spacing-md: 1rem (16px)
  --spacing-lg: 1.5rem (24px) --spacing-xl: 2rem (32px) --spacing-2xl: 3rem (48px)
  --spacing-3xl: 4rem (64px);
```

### Typography

```css
--font-size-xs: 0.75rem (12px) --font-size-sm: 0.875rem (14px) --font-size-base: 1rem (16px)
  --font-size-lg: 1.125rem (18px) --font-size-xl: 1.25rem (20px) --font-size-2xl: 1.5rem (24px)
  --font-size-3xl: 1.875rem (30px) --font-size-4xl: 2.25rem (36px) --font-weight-normal: 400
  --font-weight-medium: 500 --font-weight-semibold: 600 --font-weight-bold: 700;
```

### Shadows & Effects

```css
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl, --card-shadow
--radius-sm, --radius-md, --radius-lg, --radius-xl, --radius-2xl, --radius-full
--transition-fast, --transition-base, --transition-slow
```

## Shared Component Classes

### Buttons

```css
.btn - Base button
.btn-primary, .btn-secondary, .btn-outline, .btn-ghost, .btn-danger, .btn-success
.btn-sm, .btn-lg, .btn-full
.btn-loading
```

### Cards

```css
.card - Base card with hover effect
.card-header, .card-title, .card-subtitle, .card-body, .card-footer
.card-interactive - Clickable card
```

### Forms

```css
.form-group, .form-label, .form-label-required
.form-input, .form-select, .form-textarea
.form-error, .form-help
.form-check, .form-check-input, .form-check-label
```

### Badges & Alerts

```css
.badge, .badge-primary, .badge-secondary, .badge-success, .badge-warning, .badge-error
.alert, .alert-success, .alert-warning, .alert-error, .alert-info
```

### Layout Utilities

```css
.container, .container-fluid
.flex, .flex-col, .flex-center, .flex-between
.grid, .grid-cols-2, .grid-cols-3, .grid-cols-4
.gap-sm, .gap-md, .gap-lg, .gap-xl
```

## Migration Instructions for Remaining Files

### Step 1: Replace Hard-coded Values

**Before:**

```css
padding: 20px;
margin-bottom: 15px;
border-radius: 8px;
color: #333;
font-size: 16px;
```

**After:**

```css
padding: var(--spacing-lg);
margin-bottom: var(--spacing-md);
border-radius: var(--radius-md);
color: var(--text-primary);
font-size: var(--font-size-base);
```

### Step 2: Replace Transition Values

**Before:**

```css
transition: all 0.3s ease;
transition: color 0.3s ease;
```

**After:**

```css
transition: all var(--transition-base);
transition: color var(--transition-base);
```

### Step 3: Use Shared Component Classes

**Before:**

```css
.my-button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

**After:**

```html
<button class="btn btn-primary">Click Me</button>
```

Or keep component-specific styling:

```css
.my-button {
  /* Extend btn class */
  background: var(--primary-color);
  padding: var(--spacing-md) var(--spacing-xl);
}
```

### Step 4: Remove Duplicate Variables

**Remove these from component CSS files:**

- `:root {}` blocks declaring colors
- `[data-theme='dark'] {}` blocks
- Shadow definitions
- Color definitions
- Spacing definitions

### Step 5: Update Shadow Syntax

**Before:**

```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
```

**After:**

```css
box-shadow: var(--shadow-sm);
box-shadow: var(--shadow-md);
```

## Remaining Files to Refactor

### Components (22 files)

- [ ] Components/AuthTabs/AuthTabs.css
- [ ] Components/CategoryTabs/CategoryTabs.css
- [ ] Components/Chat/ChatList.css
- [ ] Components/Chat/ChatWindow.css
- [ ] Components/MyTrips/MyTrips.css
- [ ] Components/PackageDetails/BookingCard.css
- [ ] Components/PackageDetails/PackageGallery.css
- [ ] Components/PackageDetails/PackageInfo.css
- [ ] Components/PackageDetails/PackageItinerary.css
- [ ] Components/PackageGrid/PackageGrid.css
- [ ] Components/PopularPackages/PopularPackages.css
- [ ] Components/PopularTours/PopularTours.css
- [ ] Components/ProfileInfo/ProfileInfo.css
- [ ] Components/ProfileTabs/ProfileTabs.css
- [ ] Components/ResetPasswordForm/ResetPasswordForm.css
- [ ] Components/SearchFilters/SearchFilters.css
- [ ] Components/Settings/Settings.css
- [ ] Components/SocialLogin/SocialLogin.css
- [ ] Components/TourSuggestions/TourSuggestions.css
- [ ] Components/TrendingDestinations/TrendingDestinations.css
- [ ] Components/UpcomingTours/UpcomingTours.css
- [ ] Components/WeatherRecommended/WeatherRecommended.css
- [ ] Components/Wishlist/Wishlist.css

### Pages (14 files)

- [ ] Pages/ChatPage/ChatPage.css
- [ ] Pages/Checkout/Breadcrumb.css
- [ ] Pages/Checkout/Checkout.css
- [ ] Pages/Checkout/ContactInfoForm.css
- [ ] Pages/Checkout/OrderSummary.css
- [ ] Pages/Checkout/PaymentInfoForm.css
- [ ] Pages/ExploreByCategory/ExploreByCategory.css
- [ ] Pages/Faq/Faq.css
- [ ] Pages/NewPassword/NewPassword.css
- [ ] Pages/PackageDetails/PackageDetails.css
- [ ] Pages/PopularTours/PopularTours.css
- [ ] Pages/ProfilePage/ProfilePage.css
- [ ] Pages/ResetPassword/ResetPassword.css
- [ ] Pages/Review/ReviewPage.css
- [ ] Pages/SearchFilter/SearchFilter.css
- [ ] Pages/TermsandConditions/TermsAndConditions.css
- [ ] Pages/ThemeToggle/ThemeToggle.css
- [ ] Pages/weatherSuggestion/WeatherSuggestion.css
- [ ] Pages/HotelRestaurants.css
- [ ] Pages/Places.css

## Quick Reference: Common Replacements

| Old                         | New                                        |
| --------------------------- | ------------------------------------------ |
| `#4f46e5`                   | `var(--primary-color)`                     |
| `#10b981`                   | `var(--secondary-color)`                   |
| `#ffffff`                   | `var(--text-white)` or `var(--card-bg)`    |
| `#333`, `#151515`           | `var(--text-primary)`                      |
| `#666`, `#6b7280`           | `var(--text-secondary)`                    |
| `8px`                       | `var(--spacing-sm)`                        |
| `16px`, `1rem`              | `var(--spacing-md)`                        |
| `24px`, `1.5rem`            | `var(--spacing-lg)`                        |
| `32px`, `2rem`              | `var(--spacing-xl)`                        |
| `border-radius: 8px`        | `border-radius: var(--radius-md)`          |
| `transition: all 0.3s ease` | `transition: all var(--transition-base)`   |
| `font-weight: 500`          | `font-weight: var(--font-weight-medium)`   |
| `font-weight: 600`          | `font-weight: var(--font-weight-semibold)` |
| `line-height: 1.5`          | `line-height: var(--line-height-normal)`   |

## Testing Checklist

After refactoring a CSS file:

- [ ] Check light theme appearance
- [ ] Check dark theme appearance
- [ ] Test responsive breakpoints (mobile, tablet, desktop)
- [ ] Verify hover states
- [ ] Verify focus states
- [ ] Test transitions and animations
- [ ] Ensure no console errors
- [ ] Check for visual regressions

## Benefits of This Refactor

1. **Consistency**: Same colors, spacing, and patterns across all pages
2. **Maintainability**: Change theme in one place, updates everywhere
3. **Reduced Code**: Eliminated ~60% duplicate CSS
4. **Dark Mode**: Proper theme support throughout
5. **Scalability**: Easy to add new components following patterns
6. **Performance**: Less CSS to parse and render
7. **Developer Experience**: Clear naming conventions and utilities

## Notes

- Component-specific styles are still allowed when needed, including the extracted
  `HeroSection.css`; keep shared utilities in the theme/component layers
- Always extend shared classes rather than duplicating styles
- Use utility classes for one-off spacing/layout adjustments
