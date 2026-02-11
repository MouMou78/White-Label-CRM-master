# White Label CRM Customization Guide

This document provides instructions for customizing the branding and appearance of your White Label CRM.

## Logo and Title Customization

The CRM supports customizable branding through environment variables that can be updated via the Management UI.

### Updating the Logo

**Current Status:** The `VITE_APP_LOGO` environment variable contains a broken image URL from the previous "1twenty" branding, causing a black box to appear in the sidebar.

**Step-by-Step Instructions:**

1. **Open the Management UI**
   - Click the panel/grid icon in the top-right corner of the Manus chat interface
   - Or click the "Dashboard" button on any checkpoint card

2. **Navigate to Settings → Secrets**
   - In the Management UI, click "Settings" in the left sidebar
   - Click "Secrets" in the settings sub-navigation

3. **Update VITE_APP_LOGO**
   - Find the `VITE_APP_LOGO` entry in the secrets list
   - Click the edit/pencil icon next to it
   
   **Option A (Recommended - Use text logo):**
   - Clear the value completely (delete the entire URL)
   - Click "Save"
   - The CRM will display a gradient text logo using your VITE_APP_TITLE
   
   **Option B (Use custom logo image):**
   - Upload your logo file using the command: `manus-upload-file /path/to/your/logo.png`
   - Copy the returned CDN URL (starts with `https://`)
   - Paste the URL into the VITE_APP_LOGO field
   - Click "Save"
   - Image recommendations:
     * Optimized for 32px height (width auto-scales)
     * Transparent background (PNG or SVG)
     * Supported formats: PNG, SVG, JPG, WebP

4. **Refresh the preview**
   - The logo should update automatically
   - If not, refresh the preview panel in the Management UI

**Logo Fallback Behavior:**
- If `VITE_APP_LOGO` is empty or invalid, the CRM displays a gradient text logo using `VITE_APP_TITLE`
- The logo component automatically handles broken images and falls back to text

### Updating the Application Title

**Current Value:** `1twentyCRM` (from previous branding)

**Step-by-Step Instructions:**

1. **Open the Management UI → Settings → Secrets**
   - Same navigation as above: Management UI → Settings → Secrets

2. **Update VITE_APP_TITLE**
   - Find the `VITE_APP_TITLE` entry in the secrets list
   - Click the edit/pencil icon next to it
   - Replace `1twentyCRM` with your preferred branding:
     * `White Label CRM` (generic white-label)
     * `[Your Company] CRM` (branded for your company)
     * `CRM` (minimal)
   - Click "Save"

3. **Where this title appears:**
   - Browser tab title
   - Sidebar logo text (when no image logo is set or image fails to load)
   - Default fallback text throughout the application

4. **Refresh the preview**
   - The title should update in the browser tab and sidebar
   - Refresh the preview panel if needed

**Recommended Values:**
- For white-label template: `White Label CRM`
- For your business: `[Your Company Name] CRM`
- For minimal branding: `CRM`

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
