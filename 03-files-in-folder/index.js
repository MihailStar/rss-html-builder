const { readdir, stat } = require('fs/promises');
const { EOL } = require('os');
const { join, parse } = require('path');

const dirName = 'secret-folder';
const dirPath = join(__dirname, dirName);

readdir(dirPath, { withFileTypes: true }).then((dirents) =>
  dirents
    .filter((dirent) => dirent.isFile())
    .forEach(async (dirent) => {
      const { name: fileName } = dirent;
      const filePath = join(dirPath, fileName);
      const { name, ext: extension } = parse(fileName);
      const { size /** in bytes */ } = await stat(filePath);

      process.stdout.write(
        `${name} - ${extension.slice(1)} - ${size / 1000}kb`
      );
      process.stdout.write(EOL);
    })
);
