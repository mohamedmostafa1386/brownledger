---
description: Deploy changes to GitHub/Vercel and verify the live URL
---

1. **Check Git Status**
    * Run `git status` to see what files have changed.

2. **Commit & Push**
    * Run `git add .` to stage all changes.
    * Run `git commit -m "feat: <description of changes>"` (Use a descriptive message).
    * Run `git push origin main` to upload to GitHub.

3. **Wait for Deployment**
    * *Note: Vercel usually takes 1-2 minutes to deploy.*
    * Run `npm run dev` in the background if needed, but for this workflow, we primarily rely on the Vercel URL.

4. **Verify Deployed URL**
    * Use `read_url_content` (or `browser_subagent` if available) on `https://brownledger-v2.vercel.app/`.
    * Check specifically for the text/features that were just modified.

5. **Assessment of Results**
    * Create a brief summary:
        * **Changes Deployed**: List of what was pushed.
        * **Verification**: "Confirmed X is visible on production".
        * **Status**: SUCCESS/FAILURE.
    * Report this assessment to the user.
