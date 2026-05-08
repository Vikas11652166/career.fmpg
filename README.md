# Careers FMPG

This repository contains a full-stack web application for managing careers, job applications, certificates, notifications, and more for FMPG.

# Careers FMPG

This repository contains a full-stack web application for managing careers, job applications, certificates, notifications, and more for FMPG.

## Project Structure

- **exit.js**: Exit script
- **README.md**: Project documentation

- **backend/**: Node.js/Express REST API server
  - `api/`: Main API entry point
  - `assets/`: Images and certificates
    - `condensed/`: Condensed assets
    - `fonts/`: Font files
  - `config/`: Configuration files (auth, database, cloudinary, email transporter)
  - `Controllers/`: Business logic for applications, jobs, certificates, notifications, etc.
  - `middleware/`: Express middlewares
  - `models/`: Mongoose models for MongoDB
  - `Routes/`: Express route definitions
  - `scripts/`: Utility scripts (generate slugs)
  - `services/`: Utility services (email, PDF, recaptcha, resume parsing)
  - `utils/`: Utility functions (canvas adapter, currency formatter, font manager)
  - `download-fonts.sh`: Script to download fonts
  - `package.json`: Backend dependencies and scripts
  - `seed.js`: Database seeding script
  - `vercel.json`: Vercel deployment configuration

- **frontend/**: React + Vite client application
  - `public/`: Static assets and images
    - `images/`: Image files
    - `sitemap.xml`: Sitemap for SEO
  - `src/`: Source code
    - `components/`: Reusable React components (dashboard, certificates, notifications, etc.)
      - `certificates/`: Certificate-related components
      - `common/`: Common components
      - `dashboard/`: Dashboard components
      - `hero/`: Hero section components
      - `layout/`: Layout components
      - `notifications/`: Notification components
      - `provides/`: Provider components
      - `reviews/`: Review components
    - `config/`: Frontend configuration
    - `contexts/`: React context providers
    - `hooks/`: Custom React hooks
    - `pages/`: Main pages (Dashboard, Jobs, Applications, Certificates, etc.)
    - `services/`: API and notification services
    - `utils/`: Utility functions
  - `index.html`: Main HTML file
  - `package.json`: Frontend dependencies and scripts
  - `tailwind.config.js`, `postcss.config.js`: Styling configuration
  - `vite.config.js`: Vite configuration
  - `vercel.json`: Vercel deployment configuration
  - `eslint.config.js`: ESLint configuration
  - `OPTIMIZATIONS.md`: Optimization notes
  - `README.md`: Frontend-specific documentation

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or cloud)

### Setup

1. **Backend setup:**
   - Install dependencies:
     ```bash
     cd backend
     npm install
     ```
   - Start backend server:
     ```bash
     npm start
     ```
2. **Frontend setup:**
   - Install dependencies:
     ```bash
     cd ../frontend
     npm install
     ```
   - Start frontend dev server:
     ```bash
     npm run dev
     ```

### Seed Data
- To seed initial data, run:
  ```bash
  node backend/seed.js
  ```

## Features
- User authentication (register, login, forgot password)
- Job listings and applications
- Certificate management and verification
- Offer letters and contracts
- Notifications system
- Admin dashboard
- Responsive UI with Tailwind CSS

## Deployment

### Backend (Vercel)
1. Import the `backend` folder as a Vercel project.
2. Framework preset: `Other`.
3. Build command: leave empty.
4. Output directory: leave empty.
5. Ensure server entry is `api/index.js` (already wired in `backend/vercel.json`).

Set these Environment Variables in Vercel Project Settings:

- Required
  - `MONGO_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `JWT_COOKIE_EXPIRES_IN`
  - `NODE_ENV=production`
- Email (Gmail)
  - `EMAIL_USER` (full Gmail address)
  - `EMAIL_PASS` (Google App Password, 16 chars, no spaces)
- Optional SMTP (for non-Gmail providers)
  - `MAIL_HOST`
  - `MAIL_PORT`
  - `MAIL_SECURE` (`true` for 465, `false` for 587)
  - `MAIL_USER`
  - `MAIL_PASS`
- Other app vars
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_URL`
  - `FRONTEND_URL`
  - `RECAPTCHA_SECRET_KEY`

### Frontend (Vercel)
1. Import the `frontend` folder as a separate Vercel project.
2. Framework preset: `Vite`.
3. Add frontend API base URL env vars as required by your frontend config.

### Post-deploy check
- Hit backend health/root route once so startup logs confirm `Email transport verified`.
- Trigger one test email flow (certificate/offer letter) to confirm delivery in production.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

## Contact
For questions or support, contact [FMPG](https://fmpg.vercel.app/).
