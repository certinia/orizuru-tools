#!/bin/bash

nyc --include templates/web-worker-template/res/src mocha --recursive templates/web-worker-template/res/src/node/spec && \
nyc --include templates/web-java-worker-template/res/src mocha --recursive templates/web-java-worker-template/res/src/node/spec && \
nyc --include templates/web-worker-account-contact-creation/res/src mocha --recursive templates/web-worker-account-contact-creation/res/src/node/spec
