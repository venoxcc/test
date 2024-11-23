const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config();

if (!process.env.API_SECRET || !process.env.HASH_SALT) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 18, 
  message: 'Too many requests, please try again in a minute!',
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Apply to all requests
app.use(limiter);

const getKeyLimiter = rateLimit({
   windowMs: 1 * 60 * 1000, // 1 minute
   max: 14, 
   message: 'Too many requests, please try again in a minute!',
   standardHeaders: true, 
   legacyHeaders: false, 
});
app.use(limiter);


function isBrowser(userAgent) {
    const browserRegex = /Mozilla\/5\.0.*(Chrome|CriOS|Firefox|FxiOS|Safari|Opera|OPR|Edg|Edge|SamsungBrowser|DuckDuckGo|Brave|Vivaldi|Yandex|QQBrowser|Puffin|Sleipnir|Webkit|Silk|Maxthon|UCBrowser|Baidu|KAIOS)/i;
    return browserRegex.test(userAgent);
  }
  

app.get('/get-key', getKeyLimiter, async (req, res) => {
    const referrer = req.get('referer') || '';
    const userAgent = req.headers['user-agent'] || '';
    const token = req.query.t
   if (!isBrowser(userAgent)) {
     return res.status(403).json({ status: 'error', message: 'Forbidden: 403' });
    } 
    const validReferrers = [
        'linkvertise.com',
        'work.ink',
        'loot-link.com',
    ];

    const isValidReferrer = validReferrers.some(validReferrer =>
        referrer.includes(validReferrer)
    );

    if (!isValidReferrer || token != process.env.TOKEN) {
        const filePath = path.join(__dirname, 'denied.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                 return res.status(500).json({ status: 'error', message: 'An error occurred while processing your request. BYPASS/BOOKMARKS DETECTED!' });
            }
            res.status(403).send(data);
        });
    } else {
        res.setHeader('Content-Type', 'text/html');
        res.send(generateHtmlResponse(STATIC_KEY));
    }
});

function generateHtmlResponse(key) {
  const keysitePath = path.join(__dirname, 'access.html');
  
  let html = fs.readFileSync(keysitePath, 'utf8');
  html = html.replace('${key}', key);
  return html;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));