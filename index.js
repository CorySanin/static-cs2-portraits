const https = require('https');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const spawn = require('child_process').spawn;
const Express = require('express');
const phin = require('phin');
const sharp = require('sharp');

const KEYPATH = path.join('keys', 'static-cs2-key.pem');
const CERTPATH = path.join('keys', 'static-cs2-cert.pem');
const CRTPATH = path.join('keys', 'static-cs2-cert.crt');

let config = {
    unsecPort: process.env.UNSECPORT || 8080,
    port: process.env.PORT || 4443,
    domains: (process.env.DOMAINS || 'cdn.steamstatic.com').split(',')
}

let app = new Express();
let servers = [];

app.get('/cert.pem', (req, res) => {
    res.sendFile(path.join(process.cwd(), CERTPATH));
});

app.get('/cert.crt', (req, res) => {
    res.sendFile(path.join(process.cwd(), CRTPATH));
});

app.get('/healthcheck', (req, res) => {
    res.send('I\'m online.');
});

app.get('*', async (req, res) => {
    let domain = req.hostname;
    if (config.domains.indexOf(domain) >= 0) {
        const animated = req.path.endsWith('.gif');
        delete req.headers['host'];
        const resp = await phin({
            url: `https://${domain}${req.path}`,
            method: 'GET',
            followRedirects: true,
            headers: req.headers,
            stream: !animated
        });
        if (animated) {
            console.log(`Crushing animation ${domain}${req.path}`);
            const s = sharp(resp.body);
            res.send(await s.toBuffer());
        }
        else {
            if (resp) {
                res.writeHead(resp.statusCode, resp.headers);
                resp.pipe(res);
            }
            else {
                res.status(403);
                res.send();
            }
        }
    }
    else {
        res.status(500);
        res.send('bad url');
    }
});

/**
 * Run a command (as a promise).
 * @param {string} command 
 * @param {string[]} args 
 * @returns Promise<number>
 */
function runCommand(command, args = []) {
    return new Promise((res, reject) => {
        let proc = spawn(command, args, { stdio: ['ignore', process.stdout, process.stderr] });
        proc.on('exit', code => {
            if (code === 0) {
                res();
            }
            else {
                reject(code);
            }
        });
    });
}


(async () => {
    try {
        await fsp.access(KEYPATH, fs.constants.F_OK);
    }
    catch {
        await fsp.mkdir('keys', {
            recursive: true
        });

        await runCommand('openssl', [
            'req',
            '-newkey',
            'rsa:2048',
            '-new',
            '-nodes',
            '-x509',
            '-days',
            '7300',
            '-keyout',
            KEYPATH,
            '-out',
            CERTPATH,
            '-addext',
            `subjectAltName = ${config.domains.map(domain => `DNS:${domain}`).join(', ')}`,
            '-subj',
            `/C=US/ST=Wisconsin/L=Madison/CN=static-cs2-portraits`
        ]);
        await runCommand('openssl', [
            'x509',
            '-outform',
            'der',
            '-in',
            CERTPATH,
            '-out',
            CRTPATH
        ]);
    }

    let options = {
        key: await fsp.readFile(KEYPATH, { encoding: 'utf8' }),
        cert: await fsp.readFile(CERTPATH, { encoding: 'utf8' })
    }
    servers.push(https.createServer(options, app).listen(config.port));
    console.log(`static-cs2-portraits listening on port ${config.port}!`);
})();

servers.push(app.listen(config.unsecPort, () => console.log(`static-cs2-portraits listening on port ${config.unsecPort}!`)));

process.on('SIGTERM', () => {
    servers.forEach(serv => {
        serv.close();
    });
});