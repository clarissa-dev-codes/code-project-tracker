import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspacePath = (workspaceFolders && workspaceFolders.length > 0) ? workspaceFolders[0].uri.fsPath : '';
    const configFilePath = path.join(workspacePath, '.tracker-tasks.json');

    //Shared Database Reader
    const getTrackerData = () => {
        if (workspacePath && fs.existsSync(configFilePath)) {
            try {
                const rawData = fs.readFileSync(configFilePath, 'utf8');
                return JSON.parse(rawData);
            } catch (e) {
                return { tasks: [] };
            }
        }
        return { tasks: [{ id: 101, title: "Welcome! Click → to advance columns.", status: "Backlog" }] };
    };

    //Shared Database Writer
    const saveTrackerData = (data: any) => {
        if (workspacePath) {
            try {
                fs.writeFileSync(configFilePath, JSON.stringify(data, null, 4));
            } catch (err) {
                vscode.window.showErrorMessage('Failed to save data file.');
            }
        }
    };

    //1. MAIN WIDESCREEN TAB COMMAND
    let mainTabDisposable = vscode.commands.registerCommand('code-project-tracker.openTracker', () => {
        const panel = vscode.window.createWebviewPanel(
            'projectTracker', 
            'Project Tracker Dashboard', 
            vscode.ViewColumn.One, 
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(getTrackerData(), true);

        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'saveData') {
                saveTrackerData(message.data);
            }
        });
    });

    //2. SIDEBAR PANEL PROVIDER
    const sidebarProvider = new TrackerSidebarProvider(context.extensionUri, getTrackerData, saveTrackerData);
    let sidebarDisposable = vscode.window.registerWebviewViewProvider(
        'code-project-tracker.sidebarView',
        sidebarProvider,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    context.subscriptions.push(mainTabDisposable, sidebarDisposable);
}

// Sidebar Engine Controller
class TrackerSidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _getData: () => any,
        private readonly _saveData: (data: any) => void
    ) {}

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = getWebviewContent(this._getData(), false);

        
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'saveData') {
                this._saveData(message.data);
            } else if (message.command === 'openFullBoard') {
                vscode.commands.executeCommand('code-project-tracker.openTracker');
            }
        });
    }
}

//THE WEBVIEW UI LAYOUT (Dashboard Styles)
function getWebviewContent(initialData: any, isMainEditor: boolean) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: var(--vscode-font-family, sans-serif); padding: 12px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 12px; }
            h2 { margin: 0; font-size: ${isMainEditor ? '20px' : '13px'}; }
            
            /* Action Layout Control Bar */
            .control-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
            .input-area { display: flex; gap: 6px; background: rgba(255,255,255,0.02); padding: 4px; border-radius: 4px; }
            input[type="text"] { flex: 1; background: var(--vscode-input-background, #333); color: var(--vscode-input-foreground, #fff); border: 1px solid var(--vscode-input-border, #555); padding: 4px 8px; border-radius: 2px; font-size: 11px; }
            input[type="text"]:focus { border-color: var(--vscode-focusBorder, #007acc); outline: none; }
            
            /* Responsive structural grid layout */
            .board { display: flex; flex-direction: ${isMainEditor ? 'row' : 'column'}; gap: 12px; }
            .column { flex: 1; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 4px; min-height: 80px; }
            .column h3 { margin: 0 0 8px 0; font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }
            
            /* Interactive Card Styling */
            .card { background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.04)); padding: 8px 10px; margin: 6px 0; border-radius: 4px; border-left: 3px solid #007acc; font-size: 12px; color: var(--vscode-foreground); display: flex; justify-content: space-between; align-items: center; }
            .card-title { flex: 1; margin-right: 8px; }
            
            /* Controls button designs */
            button { background: var(--vscode-button-background, #007acc); color: var(--vscode-button-foreground, white); border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer; font-size: 11px; }
            button:hover { background: var(--vscode-button-hoverBackground, #0062a3); }
            .secondary-btn { background: rgba(255, 255, 255, 0.08); color: var(--vscode-foreground); border: 1px solid rgba(255,255,255,0.1); width: 100%; padding: 6px; margin-top: 2px;}
            .secondary-btn:hover { background: rgba(255, 255, 255, 0.15); }
            .action-btn { background: rgba(255,255,255,0.08); color: var(--vscode-foreground); padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; border: none; cursor: pointer; margin-left: 4px;}
            .action-btn:hover { background: #007acc; color: white; }
            .delete-btn:hover { background: #d13438; color: white; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>${isMainEditor ? 'Project Dashboard' : '📋 Tasks'}</h2>
        </div>

        <div class="control-row">
            <div class="input-area">
                <input type="text" id="task-input" placeholder="Type a task name..." onkeydown="if(event.key === 'Enter') addTask()" />
                <button onclick="addTask()">Add</button>
            </div>
            
            <!-- ONLY RENDER THE 'EXPAND' BUTTON INSIDE THE NARROW SIDEBAR -->
            ${!isMainEditor ? `<button class="secondary-btn" onclick="launchFullDashboard()">Open Full Dashboard</button>` : ''}
        </div>
        
        <div class="board">
            <div class="column">
                <h3>Backlog</h3>
                <div id="backlog-tasks"></div>
            </div>
            <div class="column">
                <h3>In Progress</h3>
                <div id="progress-tasks"></div>
            </div>
            <div class="column">
                <h3>Done</h3>
                <div id="done-tasks"></div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let state = ${JSON.stringify(initialData)};

            if (!state || !state.tasks) { state = { tasks: [] }; }

            function render() {
                document.getElementById('backlog-tasks').innerHTML = '';
                document.getElementById('progress-tasks').innerHTML = '';
                document.getElementById('done-tasks').innerHTML = '';

                state.tasks.forEach(task => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'card-title';
                    titleSpan.innerText = task.title;
                    
                    const controls = document.createElement('div');

                    const moveBtn = document.createElement('button');
                    moveBtn.className = 'action-btn';
                    moveBtn.innerText = task.status === 'Done' ? '↺' : '→';
                    moveBtn.onclick = () => moveTask(task.id);

                    const delBtn = document.createElement('button');
                    delBtn.className = 'action-btn delete-btn';
                    delBtn.innerText = '×';
                    delBtn.onclick = () => deleteTask(task.id);

                    controls.appendChild(moveBtn);
                    controls.appendChild(delBtn);
                    card.appendChild(titleSpan);
                    card.appendChild(controls);
                    
                    if(task.status === 'Backlog') document.getElementById('backlog-tasks').appendChild(card);
                    if(task.status === 'In Progress') document.getElementById('progress-tasks').appendChild(card);
                    if(task.status === 'Done') document.getElementById('done-tasks').appendChild(card);
                });
            }

            function addTask() {
                const input = document.getElementById('task-input');
                const title = input.value.trim();
                if(!title) return;
                
                state.tasks.push({ id: Date.now(), title: title, status: 'Backlog' });
                input.value = '';
                render();
                save();
            }

			function moveTask(id) {
			const task = state.tasks.find(t => t.id === id);
			if(!task) return;
			if(task.status === 'Backlog') task.status = 'In Progress';
			else if(task.status === 'In Progress') task.status = 'Done';
			else task.status = 'Backlog';
			render();
			save();
			}
			function deleteTask(id) {
			state.tasks = state.tasks.filter(t => t.id !== id);
			render();
			save();
			}
			function launchFullDashboard() {
			// TELEPORTS SIGNAL BACK TO EXTENSION CLASS
			vscode.postMessage({ command: 'openFullBoard' });
			}
			function save() {
			vscode.postMessage({ command: 'saveData', data: state });
			}
			render();


			`;
}
export function deactivate() {}