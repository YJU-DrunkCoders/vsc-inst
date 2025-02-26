const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const platform = os.platform();
let serverExecutable;

if (platform === 'win32') {
  serverExecutable = 'instagram-proxy-server-win.exe';
} else if (platform === 'darwin') {
  serverExecutable = 'instagram-proxy-server-macos';
} else if (platform === 'linux') {
  serverExecutable = 'instagram-proxy-server-linux';
} else {
  console.error(`Unsupported platform: ${platform}`);
  process.exit(1);
}

const serverPath = path.resolve(__dirname, 'binaries', serverExecutable);
const logger = vscode.window.createOutputChannel('instagram-vscode');

// 서버가 준비되었는지 확인하는 변수
let serverReady = false;

function activate(context) {
    // 프록시 서버 시작
    const serverProcess = spawn(serverPath);
    
    // 로그 출력
    serverProcess.stdout.on('data', (data) => {
        const message = data.toString();
        logger.appendLine(`Server: ${message}`);
        
        // 서버 준비 메시지 확인
        if (message.includes('running on http://localhost:49155')) {
            serverReady = true;
            // 출력 패널이 아닌 별도의 웹뷰 패널 생성 명령 실행
            vscode.commands.executeCommand('instagram-vscode.showInstagram');
        }
    });
    
    serverProcess.stderr.on('data', (data) => {
        logger.appendLine(`Error: ${data}`);
    });
    
    // 서버 종료 처리
    serverProcess.on('close', (code) => {
        logger.appendLine(`Server process exited with code ${code}`);
    });

    // 인스타그램 패널 커맨드 등록
    context.subscriptions.push(
        vscode.commands.registerCommand('instagram-vscode.showInstagram', () => {
            const panel = vscode.window.createWebviewPanel(
                'instagramPanel', 
                'Instagram',
                vscode.ViewColumn.Active,
                { 
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            // CSP 헤더 추가 및 iframe 설정
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://localhost:49155; style-src 'unsafe-inline';">
                    <style>
                        body, html { margin: 0; padding: 0; height: 100vh; width: 100%; overflow: hidden; }
                        iframe { width: 100%; height: 100%; border: none; }
                    </style>
                </head>
                <body>
                    <iframe src="http://localhost:49155" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                </body>
                </html>
            `;
            
            // 명시적으로 패널 영역으로 이동
            vscode.commands.executeCommand('workbench.action.togglePanel');
            vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
        })
    );
    
    // 5초 후에도 서버가 준비되지 않으면 강제로 패널 생성
    setTimeout(() => {
        if (!serverReady) {
            logger.appendLine('Server did not report ready, creating panel anyway');
            vscode.commands.executeCommand('instagram-vscode.showInstagram');
        }
    }, 5000);
    
    // 서버 자원 정리
    context.subscriptions.push({ dispose: () => {
        serverProcess.kill();
    }});
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
