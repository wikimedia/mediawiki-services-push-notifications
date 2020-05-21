import * as path from 'path';
import { HTTPError } from '../lib/routing';
import BBPromise = require('bluebird');
const fs = BBPromise.promisifyAll(require('fs'));

// Swagger-ui-dist helpfully exporting the absolute path of its dist directory
const docRoot = `${require('swagger-ui-dist').getAbsoluteFSPath()}/`;

function serve(appName, reqPath) {
    const filePath = path.join(docRoot, reqPath);

    // Disallow relative paths.
    // Test relies on docRoot ending on a slash.
    if (filePath.substring(0, docRoot.length) !== docRoot) {
        throw new HTTPError({
            status: 404,
            type: 'not_found',
            title: 'File not found',
            detail: `${reqPath} could not be found.`
        });
    }

    return fs.readFileAsync(filePath)
    .then((buffer) => {
        let body: string = buffer.toString();
        if (reqPath === '/index.html') {
            const css = `
                /* Removes Swagger's image from the header bar */
                .topbar-wrapper .link img {
                    display: none;
                }
                /* Adds the application's name in the header bar */
                .topbar-wrapper .link::after {
                    content: "${appName}";
                }
                /* Removes input field and explore button from header bar */
                .swagger-ui .topbar .download-url-wrapper {
                    display: none;
                }
                /* Modifies the font in the information area */
                .swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info table, .swagger-ui .info a {
                    font-size: 16px;
                    line-height: 1.4em;
                }
                /* Removes authorize button and section */
                .scheme-container {
                    display: none
                }
            `;
            body = body
                .replace(/((?:src|href)=['"])/g, '$1?doc&path=')
                // Some self-promotion
                .replace(/<\/style>/, `${css}\n  </style>`)
                .replace(/<title>[^<]*<\/title>/, `<title>${appName}</title>`)
                // Replace the default url with ours, switch off validation &
                // limit the size of documents to apply syntax highlighting to
                .replace(/dom_id: '#swagger-ui'/, 'dom_id: "#swagger-ui", ' +
                    'docExpansion: "none", defaultModelsExpandDepth: -1, validatorUrl: null, displayRequestDuration: true')
                .replace(/"https:\/\/petstore.swagger.io\/v2\/swagger.json"/,
                    '"/?spec"');
        }

        let contentType = 'text/html';
        if (/\.js$/.test(reqPath)) {
            contentType = 'text/javascript';
            body = body
                .replace(/underscore-min\.map/, '?doc&path=lib/underscore-min.map')
                .replace(/sourceMappingURL=/, 'sourceMappingURL=/?doc&path=');
        } else if (/\.png$/.test(reqPath)) {
            contentType = 'image/png';
        } else if (/\.map$/.test(reqPath)) {
            contentType = 'application/json';
        } else if (/\.ttf$/.test(reqPath)) {
            contentType = 'application/x-font-ttf';
        } else if (/\.css$/.test(reqPath)) {
            contentType = 'text/css';
            body = body
                .replace(/\.\.\/(images|fonts)\//g, '?doc&path=$1/')
                .replace(/sourceMappingURL=/, 'sourceMappingURL=/?doc&path=');
        }

        return { contentType, body };
    });
}

export {
    serve
};
