const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// 모든 origin 허용하도록 CORS 설정 변경
app.use(cors({
  origin: '*',  // 모든 origin 허용
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));

// 디버그를 위한 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  
  // 응답 로깅
  const originalSend = res.send;
  res.send = function(...args) {
    console.log(`Response status: ${res.statusCode}`);
    console.log(`Response headers: ${JSON.stringify(res.getHeaders())}`);
    return originalSend.apply(res, args);
  };
  
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
    // 모든 제한 헤더 제거
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-content-security-policy'];
    delete proxyRes.headers['cross-origin-resource-policy'];
    delete proxyRes.headers['cross-origin-embedder-policy'];
    delete proxyRes.headers['cross-origin-opener-policy'];
    
    // CORS 헤더 추가
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    
    // VSCode 웹뷰에서 콘텐츠 로드를 허용하기 위한 추가 헤더
    proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
  },
}));

// 기본 페이지 제공 (테스트용)
app.get('/_status', (req, res) => {
  res.send('Server is running');
});

app.listen(49155, () => {
  console.log('Proxy server is running on http://localhost:49155');
});
