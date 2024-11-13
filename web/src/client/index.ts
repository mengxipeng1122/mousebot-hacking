import io from 'socket.io-client';

import { LogEntry } from '../common';

document.addEventListener('DOMContentLoaded', () => {
    const logTableBody = document.getElementById('log') as HTMLTableElement;
    const selectedAssetDiv = document.getElementById('selected-asset') as HTMLDivElement;
    const clearButton = document.getElementById('clear') as HTMLButtonElement;

    // Initialize splitter functionality
    function initializeSplitter() {
        const container = document.querySelector('.container') as HTMLElement;
        const splitter = document.querySelector('.splitter') as HTMLElement;
        const leftPanel = document.querySelector('.left-panel') as HTMLElement;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.pageX;
            startWidth = leftPanel.offsetWidth;
            
            container.classList.add('resizing');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + (e.pageX - startX);
            const containerWidth = container.offsetWidth;
            
            // Limit the minimum and maximum width of the left panel
            if (width > 100 && width < (containerWidth - 100)) {
                leftPanel.style.width = `${width}px`;
                leftPanel.style.flex = 'none';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            container.classList.remove('resizing');
        });
    }

    // Add column resizing functionality
    function initializeResizers() {
        const table = document.querySelector('table');
        const cols = table!.querySelectorAll('th');
        let isResizing = false;
        let currentTh: HTMLElement | null = null;
        let startX = 0;
        let startWidth = 0;

        document.querySelectorAll('.resizer').forEach((resizer) => {
            resizer.addEventListener('mousedown', function(e) {
                isResizing = true;
                //currentTh = this.parentElement as HTMLElement;
                //startX = e.pageX;
                //startWidth = currentTh.offsetWidth;
                
                document.body.classList.add('resizing');
            });
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const width = startWidth + (e.pageX - startX);
            if (currentTh && width > 50) {
                currentTh.style.width = `${width}px`;
            }
        });

        document.addEventListener('mouseup', function() {
            isResizing = false;
            currentTh = null;
            document.body.classList.remove('resizing');
        });
    }

    // Initialize both resizers
    initializeSplitter();
    // initializeResizers();

    function syntaxHighlight(json: any): string {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    // Function to create a table row
    function createTableRow(entry: LogEntry): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.assetType}</td>
            <td>${entry.assetName}</td>
            <td>${entry.assetLang}</td>
            <td>${entry.type}</td>
            <td>${entry.crc}</td>
            <td>${entry.size}</td>
        `;

        row.addEventListener('click', () => {
            document.querySelectorAll('tr.selected-row').forEach(tr => {
                tr.classList.remove('selected-row');
            });
            row.classList.add('selected-row');
            
            let name = `${entry.assetType}/${entry.assetName}`;
            if (entry.assetLang) {
                name += `/${entry.assetLang}`;
            }
            selectedAssetDiv.innerHTML = `
                <b>${name}</b><br>
                <span>Type: ${entry.type}</span><br>
                <span>CRC: ${entry.crc}</span><br>
                <span>Size: ${entry.size}</span>
            `;

            const {assetType, assetName, assetLang} = entry;
            if (['VuProjectAsset'].includes(assetType)) {
                fetch(`/api/asset_json?assetType=${assetType}&assetName=${assetName}&assetLang=${assetLang}`)
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
                        const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                        info.innerHTML = `
                            <div class="json-view">
                                ${syntaxHighlight(data)}
                            </div>
                        `;
                    })
                    .catch(error => {
                        const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                        info.innerHTML = `
                            <div class="json-view" style="color: #f44336;">
                                Error loading JSON data: ${error.message}
                            </div>
                        `;
                    });
            } else {
                const info = document.getElementById('selected-asset-info') as HTMLDivElement;
                info.innerHTML = '';
            }
        });

        return row;
    }

    // Handle Socket.IO connection
    const socket = io();
    
    socket.on('asset_read', (entry: LogEntry) => {
        const row = createTableRow(entry);
        logTableBody.appendChild(row);
    });

    // Clear button handler
    clearButton.addEventListener('click', () => {
        logTableBody.innerHTML = '';
        selectedAssetDiv.textContent = 'No asset selected';
    });
}); 