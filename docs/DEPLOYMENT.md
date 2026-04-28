# ROTUS Deployment Guide

## Prerequisites
- Node.js >= 18
- npm or yarn
- For Docker: Docker and docker-compose
- For Android: JDK 17+, Android SDK
- For iOS: macOS with Xcode (or use cloud build)

## Environment Variables

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

### Required Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - `development` or `production`
- `DATABASE_PATH` - Path to SQLite database
- `CORS_ORIGIN` - Comma-separated allowed origins

## Deploy to Production

### Option 1: Node.js (Simple)

```bash
npm install --production
node webapp/server.js
```

For process management, use PM2:
```bash
npm install -g pm2
pm2 start webapp/server.js --name rotus
pm2 save
pm2 startup
```

### Option 2: Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t rotus .
docker run -p 3000:3000 -v $(pwd)/database:/app/database rotus
```

### Option 3: Cloud Platforms

#### Vercel
```bash
npm install -g vercel
vercel --prod
```

#### Render
1. Connect GitHub repo to Render
2. Set build command: `npm run build`
3. Set start command: `node webapp/server.js`

#### Heroku
```bash
heroku create
git push heroku main
```

## Mobile Build

### Android
```bash
# Install dependencies
sudo apt install openjdk-17-jdk

# Build
cd android
./gradlew assembleRelease

# APK location: app/build/outputs/apk/release/
```

### iOS (requires macOS)
```bash
cd ios
pod install
open App/App.xcworkspace
# Then build in Xcode
```

### Cloud Build for iOS
Use Codemagic, GitHub Actions, or Appflow:
- **Codemagic**: Free tier available
- **GitHub Actions**: macOS runners available

## Database

The SQLite database (`database/rotus.db`) is included. For production:
- Ensure write permissions on the database file
- Consider regular backups
- For high traffic, consider migrating to PostgreSQL

## Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure specific CORS origins
- [ ] Use Helmet.js (already included)
- [ ] Enable HTTPS (use nginx reverse proxy or cloud provider)
- [ ] Set up rate limiting for API endpoints
- [ ] Regular security updates

## Monitoring

Health check endpoint: `GET /health`

```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Database locked
```bash
chmod 644 database/rotus.db
```

### Port already in use
```bash
kill $(lsof -t -i:3000)
```

### Cordova files missing
```bash
npx cap sync android
```
