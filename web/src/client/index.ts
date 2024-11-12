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