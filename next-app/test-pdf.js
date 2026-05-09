const pdfParse = require('pdf-parse');
const fs = require('fs');

async function test() {
    try {
        console.log('Testing pdf-parse...');
        // We don't have a PDF to test, but we can check if the library is available and the function exists
        console.log('pdf-parse type:', typeof pdfParse);
    } catch (e) {
        console.error('pdf-parse test error:', e);
    }
}

test();
