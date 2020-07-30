#!/bin/bash

set -eu
set -o pipefail

# define permission of the files created by this script
# SonarQube needs to create tmp files during execution
# created from the template below
# https://gerrit.wikimedia.org/r/plugins/gitiles/integration/config/+/refs/heads/master/dockerfiles/java8-sonar-scanner/run.sh
umask 002

set +x

npm run coverage

# Initialize analysis, send data to SonarQube
/opt/sonar-scanner/bin/sonar-scanner -Dsonar.login="$SONAR_API_KEY" -Dsonar.branch.target="$ZUUL_BRANCH" -Dsonar.branch.name="${ZUUL_CHANGE}-${ZUUL_PATCHSET}" "$@"
