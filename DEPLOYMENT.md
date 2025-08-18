# FreeFlow Deployment Guide

## Vercel Deployment

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Emergent LLM Key**: Get from your Emergent profile

### Environment Variables
Set these in Vercel dashboard under Project Settings > Environment Variables:

```bash
# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=freeflow_production

# AI Integration  
EMERGENT_LLM_KEY=sk-emergent-your-key-here

# CORS (Optional)
CORS_ORIGINS=https://your-domain.vercel.app
```

### Deployment Steps

1. **Fork/Clone Repository**
   ```bash
   git clone <your-repo>
   cd freeflow
   ```

2. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard
   - Select your project
   - Settings > Environment Variables
   - Add all variables listed above

4. **Deploy**
   ```bash
   vercel --prod
   ```

### MongoDB Atlas Setup

1. **Create Cluster**
   - Sign up for MongoDB Atlas
   - Create new cluster (free tier)
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for Vercel)

2. **Get Connection String**
   - Click "Connect" on cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

### Post-Deployment

1. **Test API Endpoints**
   - Visit `https://your-app.vercel.app/api/`
   - Should see: `{"message": "FreeFlow API is running", "status": "healthy"}`

2. **Create First Account**
   - Visit your deployed app
   - Register new account
   - Test email processing workflow

### Troubleshooting

**Common Issues:**
- **Build Fails**: Check node version (requires 18+)
- **API Not Working**: Verify environment variables
- **Database Connection**: Check MongoDB Atlas whitelist and credentials
- **LLM Errors**: Verify Emergent LLM key

**Logs:**
```bash
vercel logs <deployment-url>
```

## Alternative Deployment Options

### Railway
1. Fork repo to GitHub
2. Connect Railway to GitHub
3. Set environment variables
4. Deploy

### Render
1. Connect GitHub repo
2. Set build/start commands
3. Add environment variables
4. Deploy

### Docker (Self-Hosted)
```bash
# Build
docker build -t freeflow .

# Run
docker run -p 3000:3000 -p 8001:8001 \
  -e MONGO_URL=your-mongo-url \
  -e EMERGENT_LLM_KEY=your-key \
  freeflow
```

## Production Considerations

### Security
- Use strong MongoDB passwords
- Enable MongoDB authentication
- Set proper CORS origins
- Use HTTPS only

### Monitoring
- Set up Vercel analytics
- Monitor MongoDB Atlas metrics
- Track API usage and errors

### Backup
- Enable MongoDB Atlas backups
- Export user data regularly
- Document recovery procedures