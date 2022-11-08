const { createReadStream, createWriteStream } = require('fs');
const { access, mkdir, readdir, rm } = require('fs/promises');
const { join } = require('path');
const { pipeline } = require('stream/promises');

const isOverwrite = true;

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isExist(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 * @todo rewrite to `fsPromises.copyFile`
 */
async function copyDir(inputDirPath, outputDirPath) {
  if (isOverwrite && (await isExist(outputDirPath))) {
    await rm(outputDirPath, { recursive: true, force: true });
    await mkdir(outputDirPath);
  } else {
    await mkdir(outputDirPath, { recursive: true });
  }

  const dirents = await readdir(inputDirPath, { withFileTypes: true });

  dirents.forEach((dirent) => {
    if (dirent.isDirectory()) {
      const dirName = dirent.name;
      const nestedInputDirPath = join(inputDirPath, dirName);
      const nestedOutputDirPath = join(outputDirPath, dirName);

      copyDir(nestedInputDirPath, nestedOutputDirPath);

      return;
    }

    if (dirent.isFile()) {
      const fileName = dirent.name;
      const readStreamPath = join(inputDirPath, fileName);
      const readStream = createReadStream(readStreamPath);
      const writeStreamPath = join(outputDirPath, fileName);
      const writeStream = createWriteStream(writeStreamPath);

      pipeline(readStream, writeStream);
    }
  });
}

copyDir(join(__dirname, 'files'), join(__dirname, 'files-copy'));
