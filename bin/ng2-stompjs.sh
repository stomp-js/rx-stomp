#!/bin/bash

mkdir -p tmp/ng2-stompjs
cd tmp/ng2-stompjs
git clone --depth 1 https://github.com/stomp-js/ng2-stompjs.git develop
cd develop
npm ci
npm i ../../../stomp-rx-stomp-*.tgz
ng test
