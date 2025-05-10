const _AUTHOR = 'Gregory Maynard-Hoare';
import {
    Archive
} from './libarchive.js';

function getGame(isLQ, progressCallback, pakReadyCallback) {
    const pCB = progressCallback;
    const rCB = pakReadyCallback;
    try {
        let dlFile, dlURL, dlTitle;
        dlFile = 'quake106.zip';
        dlURL = dlFile;
        dlTitle = 'Downloading original ' + dlFile + '...';
        pCB(dlTitle);
        const zXHR = new XMLHttpRequest();
        zXHR.open('GET', dlURL, true);
        zXHR.responseType = 'blob';
        zXHR.onprogress = function (event) {
            if (event.lengthComputable) {
                pCB(dlTitle + ' (' + event.loaded + '/' + event.total + ')');
            }
        };
        zXHR.onload = async function () {
            if (zXHR.status === 200) {
                const zBlob = new Blob([zXHR.response], {
                    type: zXHR.getResponseHeader('Content-Type')
                });
                const zFile = new File([zBlob], 'a.zip');
                let pakData = {};
                if (isLQ) {
                    pCB('Opening LibreQuake archive...');
                    const zArc = await Archive.open(zFile);
                    pCB('Reading archive contents...');
                    const zFilesObj = await zArc.getFilesObject();
                    for (let i = 0; i < 6; i++) {
                        pCB('Unpacking file ' + (i + 1) + ' of 6...');
                        const pakName = 'pak' + i + '.pak';
                        const pFile = await zFilesObj[pakName].extract();
                        const pArrayBuf = await pFile.arrayBuffer();
                        pakData[pakName] = new Uint8Array(pArrayBuf);
                    }
                    await zArc.close();
                } else {
                    pCB('Opening quake106.zip...');
                    const zArc = await Archive.open(zFile);
                    pCB('Reading ZIP contents...');
                    const zFilesObj = await zArc.getFilesObject();
                    pCB('Extracting resource.1 file from ZIP file...');
                    const rFile = await zFilesObj['resource.1'].extract();
                    pCB('Opening LHA-format resource.1 file...');
                    const rArc = await Archive.open(rFile);
                    pCB('Reading LHA-format resource.1 contents...');
                    const rFilesObj = await rArc.getFilesObject();
                    pCB('Extracting PAK0.PAK from LHA-format file...');
                    const pFile = await rFilesObj['ID1']['PAK0.PAK'].extract();
                    pCB('Reading PAK0.PAK...');
                    await rArc.close();
                    await zArc.close();
                    const pArrayBuf = await pFile.arrayBuffer();
                    pakData['pak0.pak'] = new Uint8Array(pArrayBuf);
                }
                rCB(pakData);
            } else {
                console.warn('File fetch response was not OK.');
                rCB(null);
            }
        };
        zXHR.onerror = function () {
            console.error('An error occurred while downloading the file');
            rCB(null);
        };
        zXHR.send();
    } catch (error) {
        console.warn('Operation error:', error);
        rCB(null);
    }
}
Window.qGetGame = getGame;