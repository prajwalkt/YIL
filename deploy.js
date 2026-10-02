const { execSync } = require('child_process');

console.log('--- YTS LMS AUTOMATED DEPLOYMENT ---');

try {
  // 1. Run Database Migration
  console.log('\\n[1/3] Migrating Database (SQL Server -> Neon PostgreSQL)...');
  execSync('node migrate.js', { stdio: 'inherit' });
  
  // 2. Vercel Authentication
  console.log('\\n[2/3] Authenticating Vercel (Browser will open)...');
  try {
    execSync('npx vercel whoami', { stdio: 'pipe' });
  } catch {
    execSync('npx vercel login', { stdio: 'inherit' });
  }

  // 3. Vercel Deployment
  console.log('\\n[3/3] Deploying to Production...');
  execSync('npx vercel deploy --prod --yes', { stdio: 'inherit' });

  console.log('\\n✅ DEPLOYMENT COMPLETE.');
  console.log('To set up environment variables in Vercel, upload your .env.local file in the Vercel Dashboard Settings.');

} catch (e) {
  console.error('\\n❌ Deployment halted:', e.message);
}
