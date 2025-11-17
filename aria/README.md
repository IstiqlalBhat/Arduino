# Aria - AI Watch Assistant

A beautiful web interface for Aria, your Muslim AI companion.

## Deployment to Vercel

### Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Vercel CLI installed (optional, but recommended)

### Method 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Navigate to the aria directory**:
   ```bash
   cd aria
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   
   For production deployment:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub** (if not already):
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Set the **Root Directory** to `aria` (important!)
   - Click "Deploy"

3. **Configure (if needed)**:
   - Vercel will automatically detect the `vercel.json` configuration
   - The project will be deployed as a static site

### Method 3: Deploy via GitHub Integration

1. **Connect GitHub to Vercel**:
   - Go to Vercel Dashboard → Settings → Git
   - Connect your GitHub account

2. **Import Project**:
   - Click "Add New Project"
   - Select your repository
   - Set Root Directory to `aria`
   - Deploy

### After Deployment

- Your site will be live at a URL like: `https://your-project-name.vercel.app`
- Vercel will automatically deploy on every push to your main branch
- You can add a custom domain in the Vercel dashboard

## Project Structure

```
aria/
├── index.html      # Main HTML file
└── vercel.json     # Vercel configuration
```

## Notes

- The API key is stored in the browser's localStorage (client-side only)
- No backend server is required - this is a pure static site
- The `vercel.json` configures the project to serve `index.html` as a static file


