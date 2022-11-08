const { once } = require('events');
const { createReadStream, createWriteStream } = require('fs');
const {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} = require('fs/promises');
const { extname, join } = require('path');

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 */
async function doTemplates(inputDirPath, outputDirPath) {
  let template = await readFile(join(inputDirPath, 'template.html'), {
    encoding: 'utf-8',
  });

  const matches = Array.from(template.matchAll(/{{ *(\w+) *}}/g));
  if (matches.length === 0) return;

  /** @type {Promise<string>[]} */
  const promises = [];

  for (const [, fileName] of matches) {
    promises.push(
      readFile(join(inputDirPath, 'components', `${fileName}.html`), {
        encoding: 'utf-8',
      })
    );
  }

  const contents = await Promise.all(promises);
  let contentIndex = 0;

  for (const [tag] of matches) {
    template = template.replace(tag, contents[contentIndex++]);
  }

  await writeFile(join(outputDirPath, 'index.html'), template, {
    encoding: 'utf-8',
  });
}

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 */
async function doStyles(inputDirPath, outputDirPath) {
  const writeStreamPath = join(outputDirPath, 'style.css');
  const writeStream = createWriteStream(writeStreamPath);

  const dirents = (await readdir(inputDirPath, { withFileTypes: true })).filter(
    (dirent) => dirent.isFile() && extname(dirent.name) === '.css'
  );

  for (const dirent of dirents) {
    const readStreamPath = join(inputDirPath, dirent.name);
    const readStream = createReadStream(readStreamPath);

    readStream.pipe(writeStream, { end: false });
    await once(readStream, 'end');
  }

  writeStream.close();
}

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 */
async function doAssets(inputDirPath, outputDirPath) {
  await mkdir(outputDirPath);

  const dirents = await readdir(inputDirPath, { withFileTypes: true });

  /** @type {Promise<void>[]} */
  const promises = [];

  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      const nestedInputDirPath = join(inputDirPath, dirent.name);
      const nestedOutputDirPath = join(outputDirPath, dirent.name);

      promises.push(doAssets(nestedInputDirPath, nestedOutputDirPath));

      continue;
    }

    if (dirent.isFile()) {
      const inputFilePath = join(inputDirPath, dirent.name);
      const outputFilePath = join(outputDirPath, dirent.name);

      promises.push(copyFile(inputFilePath, outputFilePath));
    }
  }

  await Promise.all(promises);
}

/**
 * Utility
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isDirExist(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} inputDirPath
 * @param {string} outputDirPath
 * @returns {Promise<void>}
 * @todo Add error handlers to async functions
 */
async function build(inputDirPath, outputDirPath) {
  if (await isDirExist(outputDirPath)) {
    await rm(outputDirPath, { force: true, recursive: true });
  }

  await mkdir(outputDirPath);

  await Promise.all([
    doTemplates(join(inputDirPath), outputDirPath),
    doStyles(join(inputDirPath, 'styles'), outputDirPath),
    doAssets(join(inputDirPath, 'assets'), join(outputDirPath, 'assets')),
  ]);
}

build(__dirname, join(__dirname, 'project-dist'));
