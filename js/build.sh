#!/bin/bash

set -x

browserify init.js -o archiver-viewer.js

uglifyjs archiver-viewer.js -o archiver-viewer.min.js
