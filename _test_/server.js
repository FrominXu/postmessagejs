const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 6789;
const buildPath = path.join(__dirname, '../build');
const testPath =path.join(__dirname);

function buildResponse(req, res) {
  console.log('req.url', req.url);
  if (req.url === '/postmessage-promise.umd.js') {
    const jsPath = path.join(buildPath, 'postmessage-promise.umd.js');
    serveFile(jsPath, 'application/javascript', res);
  } else if (req.url === '/iframe.html') { 
    const indexPath = path.join(testPath, 'iframe.html');
    serveFile(indexPath, 'text/html', res);
  } else {
    // 对于其他所有路径，返回 index.html 内容
    const indexPath = path.join(testPath, 'index.html');
    serveFile(indexPath, 'text/html', res);
  }
}
// 创建 HTTP 服务器
const server = http.createServer(buildResponse);

// 函数用于提供文件服务
function serveFile(filePath, contentType, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

// 服务器开始监听指定端口
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 获取当前 IP 的函数（非标准实现，可能需要根据环境调整）
function getCurrentIP() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    for (const networkAddress of networkInterface) {
      if (networkAddress.family === 'IPv4' && !networkAddress.internal) {
        return networkAddress.address;
      }
    }
  }
  return '127.0.0.1';
}

// 打印当前 IP
console.log(`Current : ${getCurrentIP()}:${PORT}`);
