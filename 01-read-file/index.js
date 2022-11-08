const { createReadStream } = require('fs');
const { join } = require('path');
const { pipeline } = require('stream/promises');

const fileName = 'text.txt';
const filePath = join(__dirname, fileName);
const readStream = createReadStream(filePath);
const writeStream = process.stdout;

pipeline(readStream, writeStream);
