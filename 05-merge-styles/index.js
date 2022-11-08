const { once } = require('events');
const { createReadStream, createWriteStream } = require('fs');
const { readdir } = require('fs/promises');
const { EOL } = require('os');
const { extname, join } = require('path');

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 */
async function build(inputDirPath, outputDirPath) {
  const writeStreamPath = join(outputDirPath, 'bundle.css');
  const writeStream = createWriteStream(writeStreamPath);

  const fileNames = (await readdir(inputDirPath, { withFileTypes: true }))
    .filter((dirent) => dirent.isFile() && extname(dirent.name) === '.css')
    .map((dirent) => dirent.name);

  for (const fileName of fileNames) {
    const readStreamPath = join(inputDirPath, fileName);
    const readStream = createReadStream(readStreamPath);

    readStream.pipe(writeStream, { end: false });
    await once(readStream, 'end');
    writeStream.write(EOL);
  }

  writeStream.close();
}

build(join(__dirname, 'styles'), join(__dirname, 'project-dist'));
// build(join(__dirname, 'test-files', 'styles'), join(__dirname, 'test-files'));
