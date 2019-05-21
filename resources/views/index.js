const { 
  name, 
  description,
  author 
} = require('../../package.json');

const { map, filter } = require('../../lib/util');

module.exports = (assets = []) => `
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="author" content="${author}">
        <title>${name} - ${description}</title>
        <link rel="dns-prefetch" href="https://fonts.gstatic.com">
        <link rel="dns-prefetch" href="https://code.ionicframework.com">
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
        <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Oxygen">
        <link rel="stylesheet" href="//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/pace/1.0.2/themes/black/pace-theme-minimal.min.css" integrity="sha256-6JGNgkzJ/plvOfsg/ENvu2BYcOWSf6vxVc9nBrULVR4=" crossorigin="anonymous" />
        ${map((asset) => `<link rel="stylesheet" href="/static/${asset}">`, filter((asset) => asset.indexOf('.js') === -1, assets))}
      </head>
    <body>
      <div class="wrapper">
        <noscript>Javascript must be enabled to use MarketInsight</noscript>
        <div id="app"></div>
      </div>
      <script src="//cdnjs.cloudflare.com/ajax/libs/pace/1.0.2/pace.min.js" integrity="sha256-EPrkNjGEmCWyazb3A/Epj+W7Qm2pB9vnfXw+X6LImPM=" crossorigin="anonymous"></script>
      ${map((asset) => `<script src="/static/${asset}" async defer></script>`, filter((asset) => asset.indexOf('.css') === -1, assets))}
    </body>
  </html>`
