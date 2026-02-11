# White Label CRM Customization Guide

This document provides instructions for customizing the branding and appearance of your White Label CRM.

## Logo and Title Customization

The CRM supports customizable branding through environment variables that can be updated via the Management UI.

### Updating the Logo

**Current Status:** The `VITE_APP_LOGO` environment variable contains a broken image URL from the previous "1twenty" branding.

**To fix this:**

1. Open the Management UI (click the panel icon in the top-right of the chat interface)
2. Navigate to **Settings** → **Secrets**
3. Find the `VITE_APP_LOGO` entry
4. **Option A (Use text logo):** Clear the value completely to use the default gradient text logo
5. **Option B (Use custom logo):** Replace with a valid image URL (must start with `https://`)
   - Recommended: Upload your logo to S3 using `manus-upload-file` and use the returned URL
   - Image should be optimized for 32px height (will auto-scale width)
   - Supported formats: PNG, SVG, JPG, WebP

**Logo Fallback Behavior:**
- If `VITE_APP_LOGO` is empty or invalid, the CRM displays a gradient text logo using `VITE_APP_TITLE`
- The logo component automatically handles broken images and falls back to text

### Updating the Application Title

**Current Value:** `1twentyCRM`

**To customize:**

1. Open the Management UI → **Settings** → **Secrets**
2. Find the `VITE_APP_TITLE` entry
3. Update to your preferred branding (e.g., "White Label CRM", "My Company CRM", etc.)
4. This title appears in:
   - Browser tab title
   - Sidebar logo (when no image logo is set)
   - Default fallback text

**Recommended Value:** `White Label CRM` or your company name

## Navigation Customization

The navigation has been cleaned up to remove non-functional placeholder pages:

**Removed from Engagement menu:**
- Sequences
- Email Generator
- Automation
- Workflow Automation
- Templates Marketplace
- Execution History

**Removed from Settings menu:**
- Integrations
- Custom Fields

**Current Navigation Structure:**
- **Main Menu:** Home, People, Accounts, Team Chat, Events, AI Assistant
- **Insights:** Funnel, Analytics, Activity Feed
- **Settings:** Lead Scoring

To add new features to the navigation, edit `client/src/components/DashboardLayout.tsx` and add items to the appropriate menu array (`menuItems`, `engagementItems`, `insightsItems`, or `settingsItems`).

## Dashboard Customization

The dashboard welcome message has been updated to generic text: "Your customer relationship management overview for today."

To customize the dashboard:
- Edit `client/src/pages/Home.tsx`
- Modify the welcome message, add/remove dashboard cards, or adjust the layout

## Theme Customization

The CRM uses a customizable theme system with CSS variables defined in `client/src/index.css`.

**Color Palette:**
- Primary colors: Blue to purple gradient (`from-blue-600 to-purple-600`)
- Background colors: Defined via CSS variables (`--background`, `--foreground`, etc.)
- Supports both light and dark modes

To customize colors, edit the CSS variables in `client/src/index.css` under the `.light` and `.dark` theme sections.

## Next Steps

1. **Update VITE_APP_LOGO** - Clear the broken image URL or replace with your logo
2. **Update VITE_APP_TITLE** - Change from "1twentyCRM" to your branding
3. **Test the changes** - Verify the logo and title appear correctly in the UI
4. **Customize colors** - Adjust the theme colors in `index.css` if needed
5. **Add features** - Implement new functionality as needed for your use case
