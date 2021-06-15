import fs from "fs";
import moment from "moment";

const DIR = ".";
const MAX_IMG_WIDTH = "600px";
const MAX_IMG_HEIGHT = "600px";

const IMAGE_EXTENSIONS = ["bmp", "gif", "jpeg", "jpg", "png", "webp"];

function imageToDataUri(path: string) {
    const ext = path.split(".").pop();
    const b64 = fs.readFileSync(path, "base64");
    return `data:image/${ext};base64,${b64}`;
}

function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function dataUriToHtml(title: string, dataUri: string, changed: Date, modified: Date) {
    return `
        <div class="item">
            <img src="${dataUri}" title="${title}" alt="${title}" />
            <div>
                <p>
                    Title: <b>${title}</b>
                </p>
                <p>
                    Changed: <b class="">${moment(changed).fromNow()}</b>
                </p>
                <p>
                    Modified: <b class="">${moment(modified).fromNow()}</b>
                </p>
            </div>
        </div>
    `;
}

function wrapImages(images: string[]) {
    const noImages = "No images in this directory";

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                }
                img {
                    max-height: ${MAX_IMG_HEIGHT};
                    max-width: ${MAX_IMG_WIDTH};
                    margin: 16px;
                }
                .item {
                    display: flex;
                }
            </style>
        </head>
        <body>
            <h1 style="margin: 16px">
                <b>Updated at ${moment().format("hh:mm:ss a")}</b>
            </h1>
            ${images.join("\n") || noImages}
        </body>
        </html>
    `;
}

const startTime = Date.now();

const images = fs.readdirSync(DIR)
    // load file info
    .map(it => ({
        path: it,
        ext: it.split(".").pop() || "",
        stats: fs.statSync(it),
    }))

    // only process image files
    .filter(it => it.stats.isFile())
    .filter(it => IMAGE_EXTENSIONS.includes(it.ext))

    // sort by last changed time
    .sort((a, b) => b.stats.ctime.getTime() - a.stats.ctime.getTime())

    // create <img> tags
    .map(it => dataUriToHtml(escapeHtml(it.path), imageToDataUri(it.path), it.stats.ctime, it.stats.mtime));

// write output file
fs.writeFileSync("index.html", wrapImages(images));

console.log(`Updated in ${Date.now() - startTime}ms`);
