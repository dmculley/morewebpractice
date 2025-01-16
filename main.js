const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

 function createWindow() {
     const mainWindow = new BrowserWindow({
         width: 1200,
         height: 900,
         webPreferences: {
             nodeIntegration: false,
            contextIsolation: true,
             preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

     //Load the homepage html file
    mainWindow.loadFile(path.join(__dirname, 'homepage.html'));

     // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

function createMenu() {
    const template = [
        {
            label: 'Application',
            submenu: [
                { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
               { type: "separator" },
                { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
           ]
       },
       {
            label: 'View',
           submenu: [
                {
                    label: 'Ontology Graph',
                    click: () => {
                        const win = BrowserWindow.getFocusedWindow();
                        win.loadFile(path.join(__dirname, 'ontology/index.html'));
                    }
                },
                 {
                    label: 'Ontology Editor',
                   click: () => {
                        const win = BrowserWindow.getFocusedWindow();
                       win.loadFile(path.join(__dirname, 'ontology_editor.html'));
                    }
               }
            ]
       }
   ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

 app.whenReady().then(() => {
    createWindow();
      createMenu();
   app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

 app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') {
        app.quit();
    }
});


ipcMain.handle('save-data', async (event, data) => {
    const filePath = path.join(__dirname, 'ontology/ontology_data.json');
    try {
       await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return { success: true };
   } catch (error) {
      console.error('Error saving data to file:', error);
       return { success: false, error: error.message };
    }
});