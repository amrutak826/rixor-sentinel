# Rixor Sentinel Frontend

React + TypeScript analyst console for Rixor Sentinel.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

For production:

```bash
npm run build
npm run start
```

The frontend uses Firebase Auth/Firestore and communicates with the Rixor risk-intelligence workflow. Firebase configuration is loaded through Vite environment variables.
