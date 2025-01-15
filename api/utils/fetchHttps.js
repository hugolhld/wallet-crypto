const https = require('https');

function fetchData(hostname, path) {
    return new Promise((resolve, reject) => {
        const options = { hostname, path, method: 'GET' };
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error('Failed to parse response data'));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

module.exports = fetchData;
