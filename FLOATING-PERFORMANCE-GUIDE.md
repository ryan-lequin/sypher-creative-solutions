# Sypher Floating Adaptive Experience

The original 07 / ADAPTIVE EXPERIENCE page section has been converted into a floating panel.

## Controls
- Click the lower-right **LIVE PERFORMANCE** shortcut to expand or minimize the dashboard.
- Click **−** to minimize the open panel. The shortcut stays available.
- Click **×** to completely hide the floating shortcut. Choose **Performance** in the site navigation or **See how this site adapts** in About to show it again.
- Press **Escape** when the panel is focused to minimize it.
- Choices are saved in the current browser: `open`, `minimized`, or `hidden`.
- The panel scrolls independently so all device metrics, mode controls, effect status, and device-test CSV export remain usable.
- Auto, High, Medium, Basic, and reduced-motion handling remain intact.

## Install into your existing deployed Sypher project
1. Make a backup of your existing repository files.
2. Copy the hotfix's `public/index.html`, `public/css/floating-performance.css`, `public/js/floating-performance.js`, and `public/js/adaptive-insights.js` into matching locations in your GitHub-connected project.
3. In VS Code PowerShell, from the inner `sypher-creative-solutions` folder, run:

```
git add public/index.html public/css/floating-performance.css public/js/floating-performance.js public/js/adaptive-insights.js
git commit -m "Make adaptive performance dashboard floating and collapsible"
git push origin main
```

4. Vercel will automatically redeploy the GitHub `main` branch (if connected); wait for **Ready** and hard-refresh the site (Ctrl + Shift + R).

This update only changes public UI files. It does not overwrite Supabase data or Vercel environment variables.
