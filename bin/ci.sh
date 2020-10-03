#!/bin/bash

set -ex

# Actual test
npm run lint
npm run karma

# Create a package
npm run build
npm pack
