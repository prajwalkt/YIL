const https = require('https');

https.get('https://ytsplatform.vercel.app/images/banner.jpg', (res) => {
  console.log('banner.jpg STATUS:', res.statusCode);
});

https.get('https://ytsplatform.vercel.app/images/office.jpg', (res) => {
  console.log('office.jpg STATUS:', res.statusCode);
});
