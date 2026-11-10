# Website

Business landing page — plain HTML/CSS/JS, deployed to GitHub Pages.

## Structure
- `site/` — the published website (only this folder is deployed)
- `.github/workflows/pages.yml` — deploys `site/` on every push to `main`
- `_bmad/`, `_bmad-output/`, `.claude/` — BMAD planning tooling and artifacts (not published)

## Local preview
```
npx serve site
```

## Deploying
1. Push this repo to GitHub.
2. Repo → **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` deploys to `https://<user>.github.io/<repo>/`.
