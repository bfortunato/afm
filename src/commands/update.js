"use strict";

const glob = require("glob");
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const pn = require("pn/fs");
const diff = require('diff');
const readline = require('readline-sync');
const chalk = require("chalk");
const isbinaryfile = require("isbinaryfile");
const exec = require("child_process").exec;
const tmp = require("tmp")

Array.prototype.contains = function(el) {
    return this.indexOf(el) != -1;
};

function confirm(msg, cb, force) {
    if (!force) {
        let answer = readline.question(msg + " [y,n]: ");
        if (answer == "y") {
            cb()
        } else if (answer == "q") {
            process.exit(0);
        } else if (answer != "n") {
            confirm(msg, cb);
        }
    } else {
        cb()
    }
}

function copy(sourceFile, destDir, destFile) {
    if (!fs.existsSync(destDir)) {
        fsExtra.mkdirpSync(destDir);
    }
    fsExtra.copySync(sourceFile, destFile);
}

function doUpdate(sourceDir, destDir, ignoreAdded, simulate, force, globPattern, cb) {
    glob(
        sourceDir + (globPattern || "/**/*.*"),
        {
            ignore: [
                sourceDir + "/**/node_modules/**",
                sourceDir + "/**/build/**"
            ]
        }, function (error, files) {
            files.forEach(function (sourceFile) {
                console.log("Working on " + sourceFile);

                let relativeDir = path.dirname(sourceFile.replace(sourceDir, ""));
                let fileName = path.basename(sourceFile);
                let destRelativeDir = path.join(destDir, relativeDir);
                let destFile = path.join(destRelativeDir, fileName);
                try {
                    let sourceStat = fs.statSync(sourceFile);
                    if (!sourceStat.isDirectory()) {
                        let destStat = null;
                        try {
                            destStat = fs.statSync(destFile)
                        } catch (e) {
                        }
                        if (destStat != null) {
                            if (isbinaryfile.sync(sourceFile)) {
                                if (sourceStat.size != destStat.size) {
                                    confirm(`Desination file ${destFile} is different from source. Do you want to update?`, () => {
                                        if (!simulate) {
                                            copy(sourceFile, destRelativeDir, destFile);
                                        }
                                        console.log("[UPDATED] " + destFile);
                                    }, force)
                                }
                            } else {
                                let source = fs.readFileSync(sourceFile);
                                let dest = fs.readFileSync(destFile);
                                let diffResult = diff.diffLines(dest.toString(), source.toString());
                                let isDifferent = false;
                                for (let i = 0; i < diffResult.length; i++) {
                                    let part = diffResult[i];
                                    if (part.added || part.removed) {
                                        isDifferent = true;
                                        break;
                                    }
                                }

                                if (isDifferent) {
                                    console.log(`Differences between ${sourceFile} and ${destFile}:`);

                                    diffResult.forEach(function (part) {
                                        if (part.added) {
                                            process.stdout.write(chalk.green(part.value))
                                        } else if (part.removed) {
                                            process.stdout.write(chalk.red(part.value))
                                        } else {
                                            process.stdout.write(part.value)
                                        }
                                    });

                                    console.log();

                                    confirm(`Desination file ${destFile} is different from source. Do you want to update?`, () => {
                                        if (!simulate) {
                                            copy(sourceFile, destRelativeDir, destFile);
                                        }
                                        console.log("[UPDATED] " + destFile);
                                    }, force)
                                }
                            }
                        } else {
                            if (!ignoreAdded) {
                                confirm(`Desination file ${destFile} not exists. Do you want to create?`, () => {
                                    if (!simulate) {
                                        copy(sourceFile, destRelativeDir, destFile);
                                    }
                                    console.log("[CREATED] " + destFile);
                                }, force)
                            }
                        }
                    }
                } catch (error) {
                    console.log(error.message);
                    console.log(error.stack);
                }
            });

            if (cb) {
                cb()
            }
        });
};

export default function update(sourceDir, destDir, ignoreAdded, simulate, force, globPattern) {
    if (!sourceDir || !destDir) {
        throw "bad params"
    }

    doUpdate(sourceDir, destDir, ignoreAdded, simulate, force, globPattern);    
};