const vscode = require('vscode');
const { execFile } = require('child_process');
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

function activate(context) {

    execFile(serverPath, (error, stdout, stderr) => {
        if (error) {
            logger.appendLine(`Error executing server: ${error.message}`);
            logger.appendLine(`stderr: ${stderr}`);
            return;
        }
        logger.appendLine(`Server output: ${stdout}`);
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('instagram-vscode.openInstagramWeb', () => {
            const panel = vscode.window.createWebviewPanel(
                'instagramWebviewTab',
                'Instagram',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            panel.webview.html = getWebviewContent();
        })
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('instagramWebview', {
            resolveWebviewView(webviewView, context, token) {
                webviewView.webview.options = {
                    enableScripts: true
                };
                webviewView.webview.html = getWebviewContent();
            }
        })
    );

    context.subscriptions.push(logger);
}

function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
            iframe { border: none; height: 100%; width: 100%; }
        </style>
    </head>
    <body>
        <iframe src="http://localhost:49155"></iframe>
    </body>
    </html>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
