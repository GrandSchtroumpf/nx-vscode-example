import { commands, ExtensionContext, window, ViewColumn, Uri } from 'vscode';
import { promises as fs, watch } from 'fs';
import { join } from 'path';
import { environment } from './environments/environment';

// On activation
export function activate(context: ExtensionContext) {
  // Register command "start" 
  commands.registerCommand('start', async () => {
    const panel = window.createWebviewPanel(
      'studio',
      'Studio',
      ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [Uri.file(join(context.extensionPath, 'studio'))]
      });

    const index = join(context.extensionPath, 'studio/index.html');
  
    const matchLinks = /(href|src)="([^"]*)"/g;
    const toUri = (_, prefix: 'href' | 'src', link: string) => {
      // For <base href="#" />
      if (link === '#') {
        return `${prefix}="${link}"`;
      }
      // For scripts & links
      const path = join(context.extensionPath, 'studio', link);
      const uri = Uri.file(path);
      return `${prefix}="${panel.webview['asWebviewUri'](uri)}"`;
    };

    // Refresh the webview on update from the code
    const updateWebview = async () => {
      const html = await fs.readFile(index, 'utf-8');
      panel.webview.html = html.replace(matchLinks, toUri);
    }

    if (!environment.production) {
      watch(index).on('change', updateWebview)
    }
    updateWebview();
    
    context.subscriptions.push(panel);
  })
}