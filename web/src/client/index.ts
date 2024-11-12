import io from 'socket.io-client';

document.addEventListener('DOMContentLoaded', () => {
    // add socket.io client
    const socket = io();    
    socket.on('asset_read', (data) => {
        const { asset_type, asset_name, asset_lang } = data;
        const log = document.getElementById('log');
        if (log) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.asset_type}</td>
                <td>${data.asset_name}</td>
                <td>${data.asset_lang}</td>
                <td>${data.type}</td>
                <td>${data.crc}</td>
                <td>${data.size}</td>
            `;
            log.appendChild(row);

            // add a button to download the asset
            const download = document.createElement('button');
            download.textContent = 'Download';
            download.addEventListener('click', () => {
                // download the asset
                console.log('Downloading asset:', data);
                const url = `/api/asset?assetType=${asset_type}&assetName=${asset_name}&assetLang=${asset_lang}`;
                const filename = (asset_lang&&asset_lang.length>0 ) ?
                   `${asset_type}_${asset_name}.${asset_lang}.bin`:
                   `${asset_type}_${asset_name}.bin`;
                
                console.log(`Downloading ${filename} from ${url}`);
                fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.click();
                    });

            });
            row.appendChild(download);


            // add a button to show the asset 
            if (['VuProjectAsset', 
                ].includes(asset_type)) {
                const show = document.createElement('button');
                show.textContent = 'Show';
                show.addEventListener('click', () => {
                    console.log('Showing asset:', data);
                    const url = `/api/asset_json?assetType=${asset_type}&assetName=${asset_name}&assetLang=${asset_lang}`;
                    fetch(url)
                        .then(response => response.json())
                        .then(json => {
                            // add code to show the json string after the row
                            const json_str = JSON.stringify(json, null, 2);
                            alert(json_str); // Popup a dialog to show the JSON
                        });
                });
                row.appendChild(show);
            }
        }

        // clear button
        const clear = document.getElementById('clear');
        if (clear) {
            clear.addEventListener('click', () => {
                if (log) {
                    log.innerHTML = '';
                }
            });
        }
    });
}); 