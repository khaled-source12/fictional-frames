# Fictional Frames

A minimalist photography journal built with Next.js 15, React 19, Tailwind CSS 4 and jsPDF.

## Run locally

1. Install Node.js 20.9 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open http://localhost:3000.

## Publish a new issue

1. Copy your JPEG photos into `public/photos/` (prefer high quality, web-optimized images).
2. Edit `lib/content.ts`: add an issue to `issues`, then add photo entries with unique slugs, paths, descriptions, ideas, and accurate camera settings. Example content/settings are placeholders and must be replaced.
3. The archive, issue pages, individual photo pages, and PDF endpoint automatically use this data.
4. Test locally with `npm run build` and `npm run dev`.
5. Commit and push changes to GitHub; Vercel will redeploy automatically.

## GitHub

Create an empty GitHub repository called `fictional-frames`. In this project folder:

```bash
git init
git add .
git commit -m "Initial Fictional Frames website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fictional-frames.git
git push -u origin main
```

## Vercel

1. Sign in to vercel.com using GitHub.
2. Choose Add New > Project and import `fictional-frames`.
3. Keep the detected Next.js framework, leave build settings at defaults, and click Deploy.
4. Add your own domain in Project > Settings > Domains if desired.

## Notes

- PDF files are generated on demand from the issue content and JPEG/PNG images. No separate PDF uploads are needed.
- This starter does not include a web-based admin panel or automated EXIF extraction. Enter metadata manually in `lib/content.ts`.
- Do not upload original full-resolution RAW files to the public folder; use optimized JPEG exports.
- Only use images you own or have permission to publish.
