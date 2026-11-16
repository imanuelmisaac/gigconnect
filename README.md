# GigConnect Botswana | Production

GigConnect is Botswana's premier musical talent and event ticketing marketplace.

## 🚀 Deployment Instructions

If you encounter a `task type` error when clicking the "Deploy" button in the UI, use the terminal to trigger the deployment manually:

### 1. Ensure correct project context
```bash
firebase use gigconnect-ac1f9
```

### 2. Manual Build
```bash
npm run build
```

### 3. Manual Deployment
```bash
firebase deploy
```

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **AI**: Google Genkit

## 🌍 SEO & Live Access
The site is configured for the Botswana market with dynamic sitemaps and specialized JSON-LD structured data.

© 2024 GigConnect Team. Made for Batswana.