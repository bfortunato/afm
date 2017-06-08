#!/usr/bin/env node
"use strict";

var _update = require("./commands/update");

var _update2 = _interopRequireDefault(_update);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var program = require("commander");

function list(val) {
    return val.split(',');
}

program.version("applica-file-merge v1.0.0").usage("<sourceDir> <destDir> [options]").option("-a, --ignore-added", "Ignore added files. Works only on changes").option("-s, --simulation", "Do not change any file. Just a simulation").option("-f, --force", "Do not require confirm for file substitution").option("-g, --glob-pattern <glob>").action(function (sourceDir, destDir, program) {
    (0, _update2.default)(sourceDir, destDir, program.ignoreAdded, program.simulation, program.force, program.globPattern);
}).parse(process.argv);