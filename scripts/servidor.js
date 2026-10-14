#!/usr/bin/env node
// Servidor estático simples para testar o site gerado (_site/) localmente,
// respeitando o pathPrefix. Uso: node scripts/servidor.js [pasta] [porta] [prefixo]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

export function criarServidor(pasta = '_site', prefixo = '/') {
  const raiz = path.resolve(pasta);
  const pref = prefixo.endsWith('/') ? prefixo : `${prefixo}/`;
  return http.createServer((req, res) => {
    let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!caminho.startsWith(pref) && `${caminho}/` !== pref) {
      res.writeHead(404).end('Fora do prefixo');
      return;
    }
    caminho = `/${caminho.slice(pref.length)}`;
    let arquivo = path.join(raiz, caminho);
    if (!arquivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
    if (!fs.existsSync(arquivo)) {
      const pagina404 = path.join(raiz, '404.html');
      res.writeHead(404, { 'content-type': TIPOS['.html'] });
      res.end(fs.existsSync(pagina404) ? fs.readFileSync(pagina404) : 'Não encontrado');
      return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pasta = '_site', porta = '8080', prefixo = '/'] = process.argv.slice(2);
  criarServidor(pasta, prefixo).listen(Number(porta), () => {
    console.log(`Servindo ${pasta} em http://localhost:${porta}${prefixo}`);
  });
}
