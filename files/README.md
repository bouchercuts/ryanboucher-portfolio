# Ryan Boucher — Portfolio Site
## Deployment & CMS Setup Guide

---

## File Structure

```
/
├── index.html              ← Your website
├── admin/
│   ├── index.html          ← CMS login page (visit /admin to use)
│   └── config.yml          ← CMS field definitions
├── _data/
│   ├── projects/           ← One JSON file per project
│   │   └── manifest.json   ← List of project files (update when adding projects)
│   ├── keywords/           ← One JSON file per advertising keyword
│   │   └── manifest.json   ← List of keyword files
│   └── contact/
│       ├── representatives.json
│       └── direct.json
└── images/
    └── uploads/            ← Thumbnail images go here (created by CMS)
```

---

## Step 1 — Create a GitHub repository

1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click **New repository**
3. Name it e.g. `ryanboucher-portfolio`
4. Set it to **Public** (required for free Netlify hosting)
5. Click **Create repository**
6. Upload all these files to the repository (drag and drop onto the GitHub page)

---

## Step 2 — Update the CMS config

Open `admin/config.yml` and change this line at the top:

```yaml
repo: YOUR-GITHUB-USERNAME/YOUR-REPO-NAME
```

To your actual GitHub username and repo name, e.g.:

```yaml
repo: ryanboucher/ryanboucher-portfolio
```

Commit and push the change.

---

## Step 3 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with your GitHub account
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and select your repository
4. Leave build settings blank (this is a static site — no build step needed)
5. Click **Deploy site**

Your site will be live at a URL like `https://amazing-name-123.netlify.app`

To use a custom domain (e.g. ryanboucher.com), go to **Domain settings** in Netlify and follow the instructions.

---

## Step 4 — Enable Netlify Identity (for CMS login)

1. In your Netlify dashboard, go to **Site configuration → Identity**
2. Click **Enable Identity**
3. Under **Registration**, set to **Invite only** (so only you can log in)
4. Under **Services → Git Gateway**, click **Enable Git Gateway**
5. Go to **Identity → Invite users** and invite your own email address
6. Check your email and accept the invite — this sets your CMS password

---

## Step 5 — Log in to the CMS

1. Visit `https://your-site-url.netlify.app/admin`
2. Log in with the email and password you set up in Step 4
3. You'll see the full CMS interface

---

## Using the CMS

### Adding a project
1. Go to **Projects → New Project**
2. Fill in all fields (title, client, director, video URL, thumbnail, sections, keywords)
3. Click **Publish**
4. The site updates automatically within ~30 seconds

### Adding a new advertising keyword
1. Go to **Advertising Keywords → New Keyword**
2. Enter a display label (e.g. `Fashion`) and a slug (e.g. `fashion`)
3. Publish — the keyword will appear in the Advertising filter bar
4. Assign it to projects by editing each project and selecting the keyword

### Updating contact details
1. Go to **Contact Page → Representatives**
2. Edit any name, email, phone, or role
3. Publish

### Important — updating the manifest when adding projects
The site uses a `manifest.json` file to know which project files to load.
When you add a project via the CMS, you also need to add its filename to
`_data/projects/manifest.json` in GitHub. The filename is the project's
slug (lowercase, hyphens), e.g. `new-project-title.json`.

> **Tip:** This is the only manual step. Everything else is handled by the CMS.

---

## Connecting a contact form backend

The contact form currently shows a confirmation message but doesn't send emails.
To make it send real emails, the easiest option is Netlify Forms:

1. Add `data-netlify="true"` to the `<form>` element in `index.html`
2. Netlify will intercept submissions and forward them to your email
3. Configure the email address under **Forms** in your Netlify dashboard

---

## Updating the site manually

If you ever need to edit `index.html` or any data file directly:
1. Open the file on GitHub (click the pencil icon to edit)
2. Make your changes
3. Click **Commit changes**
4. Netlify redeploys automatically within ~30 seconds
