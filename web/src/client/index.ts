import io from 'socket.io-client';

document.addEventListener('DOMContentLoaded', () => {
    // add socket.io client
    const socket = io();    
    socket.on('asset_read', (data) => {
        // console.log('Asset read:', JSON.stringify(data, null, 2));
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
                const url = `/api/asset?assetType=${data.asset_type}&assetName=${data.asset_name}&assetLang=${data.asset_lang}`;
                const { asset_type, asset_name, asset_lang } = data;
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

                // socket.emit('download_asset', data);

                // socket.on('asset_binary', (data) => {
                //     console.log('Asset binary:', data.binary.byteLength);
                //     // download the asset
                //     const blob = new Blob([data.binary], { type: 'application/octet-stream' });
                //     const url = URL.createObjectURL(blob);
                //     const a = document.createElement('a');
                //     a.href = url;
                //     const { assetType, assetName, assetLang } = data;
                //     const filename = (assetLang&&assetLang.length>0 ) ?
                //         `${assetType}_${assetName}.${assetLang}.bin`:
                //         `${assetType}_${assetName}.bin`;
                //     a.download = filename;
                //     a.click();
                // });


            });
            row.appendChild(download);
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