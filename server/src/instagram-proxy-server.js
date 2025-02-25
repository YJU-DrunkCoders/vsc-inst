const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Middleware per rimuovere l'intestazione X-Frame-Options
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  next();
});

app.use('/', createProxyMiddleware({
  target: 'https://www.instagram.com',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request to: ${proxyReq.path}`);
    proxyReq.setHeader('origin', 'https://www.instagram.com');
  },
  onProxyRes: (proxyRes, req, res) => {
    delete proxyRes.headers['x-frame-options'];
  },
}));

app.listen(49155, () => {
  console.log('Proxy server is running on http://localhost:49155');
});
