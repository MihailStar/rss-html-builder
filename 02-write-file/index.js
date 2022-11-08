const { createWriteStream } = require('fs');
const { EOL } = require('os');
const { join } = require('path');
const { createInterface } = require('readline');

const fileName = 'text.txt';
const filePath = join(__dirname, fileName);
const writeStream = createWriteStream(filePath, {
  flags: 'a',
});
const io = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

io
  .on('line', (input) => {
    if (input === 'exit') {
      return io.close();
    }

    writeStream.write(input);
    writeStream.write(EOL);

    io.prompt();
  })
  .on('close', () => {
    process.stdout.write('Bye');

    writeStream.close();
  })
  .on('SIGINT', () => {
    process.stdout.write(EOL);

    io.close();
  })
  .prompt();
