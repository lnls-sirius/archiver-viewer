import { readdir, renameSync, readFile, writeFile, unlinkSync } from "fs";
import { resolve } from "path";

import pkg from 'javascript-obfuscator';
const { obfuscate } = pkg;

const dir = "./build/";
readdir(dir, function (err, list) {
  if (err) {
    throw err;
  }
  list.forEach(function (file) {
    const filepath = resolve(dir, file);

    if (file.slice(-6) === ".js.gz" && file.indexOf("index") !== -1) {
      try {
        console.info(`Removing file ${filepath}`);
        unlinkSync(filepath);
      } catch (e) {
        console.error(`failed to remove ${filepath}`);
      }
      return;
    }

    if (file.slice(-2) === "js" && (file.substr(0, 6) === "index." || file.substr(0, 10) === "polyfills.")) {
      const backup = filepath + ".bak";
      renameSync(filepath, backup);
      readFile(backup, "UTF-8", function (err, data) {
        if (err) {
          throw err;
        }
        // Obfuscate content of the JS file
        const obfuscationResult = obfuscate(data);
        // Write the obfuscated code into a new file
        writeFile(filepath, obfuscationResult.getObfuscatedCode(), function (err) {
          if (err) {
            return console.log(err);
          }
          console.log(filepath + " obfuscated!");
        });
      });
    }
  });
});
