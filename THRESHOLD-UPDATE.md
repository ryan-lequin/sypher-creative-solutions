# Updated Sypher automatic performance thresholds

The adaptive website now categorizes the estimated score into three bands:

| Estimated score | Automatically selected visual mode |
| --- | --- |
| 0 through 70 | Basic |
| 71 through 80 | Medium |
| 81 through 100 | High |

The floating Performance Dashboard shows the updated bands in its legend and score explanation. Scores use the existing browser-based heuristic, not a measured hardware benchmark. Manual choices for Auto, High, Medium, or Basic still work. Reduced-motion preferences continue to override decorative animations.

## Applying the small update
Copy the three files from the hotfix into the corresponding location in your GitHub-connected Sypher folder:

- `public/js/device-detector.js`
- `public/js/adaptive-insights.js`
- `public/index.html`

Then run in PowerShell:

```powershell
git add public/js/device-detector.js public/js/adaptive-insights.js public/index.html
git commit -m "Adjust automatic performance thresholds"
git push origin main
```

Vercel automatically builds the next deployment if the repository is connected. Wait for Ready, and hard-refresh the website if you still see the old labels. Saved Supabase data, Vercel environment variables, and admin information are untouched.
