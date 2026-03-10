# ElectroStock

ElectroStock is a modern, responsive, and AI-powered electronic component inventory management system. Built with React, Tailwind CSS, and powered by Directus as a headless CMS, it provides a seamless experience for managing your electronic parts, generating barcodes, and finding components quickly.

## Features

- **Inventory Management**: Track components, quantities, locations, and categories.
- **AI-Powered Data Entry**: Automatically fetch component details, pinouts, and specifications using Google Gemini AI.
- **Barcode Generation & Scanning**: Generate printable A4 sheets of barcodes for your components. Scan barcodes directly from your smartphone camera or a USB scanner.
- **Web Image Search**: Find and attach datasheets and component images directly from the web.
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v18 or higher)
- npm or yarn
- A running instance of Directus (for the backend database)
- Google Gemini API Key (for AI features)
- SerpApi Key (for web image search)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd electrostock
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add the following variables:
   ```env
   VITE_DIRECTUS_URL=https://your-directus-instance.com
   GEMINI_API_KEY=your_gemini_api_key
   SERPAPI_API_KEY=your_serpapi_key
   ```

## Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production:

```bash
npm run build
```

The compiled files will be in the `dist` directory. You can start the production server using:

```bash
npm start
```

## Committing to the Project

We follow conventional commits. Please ensure your commit messages are clear and descriptive.

Example:
```bash
git commit -m "feat: add barcode scanner support for mobile devices"
git commit -m "fix: resolve print preview overflow issue on batch barcodes page"
```

## License

This project is licensed under the MIT License.
