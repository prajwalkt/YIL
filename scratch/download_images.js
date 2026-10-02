const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error('Status ' + response.statusCode));
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function run() {
  fs.mkdirSync(path.join(__dirname, '../public/images'), { recursive: true });
  try {
    console.log("Downloading banner...");
    await download('https://drive.google.com/uc?export=download&id=1-bOd5_sYhjMP5_BsZNDQHkFbxcmXHsOK', path.join(__dirname, '../public/images/banner.jpg'));
    console.log("Downloading office...");
    await download('https://drive.google.com/uc?export=download&id=1kObpKgixyg2wHwlygdJeGoMaBnSyPBGr', path.join(__dirname, '../public/images/office.jpg'));
    console.log("Done");
  } catch(e) {
    console.error(e);
  }
}
run();
