# GigConnect Botswana | Production

GigConnect is Botswana's premier musical talent and event ticketing marketplace.

## 🚀 Project Selection & Deployment

To select or switch the project you are using for deployment, follow these steps:

### 1. Select Project via CLI
If you are shifting from an old project (like `keifirebase`) to the production project, run this in the terminal:
```bash
firebase use gigconnect-ac1f9
```

### 2. Manual Build & Deploy
If the UI "Deploy" button throws an error, use the manual path:
```bash
npm run build
firebase deploy
```

### 3. Verify Configuration
Ensure `src/firebase/config.ts` matches your active Firebase project credentials.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **AI**: Google Genkit

## 🌍 SEO & Live Access
The site is configured for the Botswana market with dynamic sitemaps and specialized JSON-LD structured data.

© 2024 GigConnect Team. Made for Batswana.