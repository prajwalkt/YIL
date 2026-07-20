# Deployment Guide

## Prerequisites
- Node.js v20+
- Microsoft SQL Server 2019+
- Windows Server or Linux host (PM2 recommended for process management)

## Environment Variables
Create a `.env.local` file with the following:
```
DB_USER=sa
DB_PASSWORD=your_password
DB_SERVER=127.0.0.1
DB_NAME=YTS_LMS
JWT_SECRET=your_32_char_secure_secret
NEXT_PUBLIC_APP_URL=https://yts.yokogawa.com
```

## Build & Run
1. `npm install`
2. `npm run build`
3. `npm run start`

## PM2 Production Deployment
1. Install PM2: `npm install -g pm2`
2. Start App: `pm2 start npm --name "yts-lms" -- start`
3. Save Configuration: `pm2 save`
