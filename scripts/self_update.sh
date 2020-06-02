#!/bin/bash

# ensure we are in the right dir
cd $(dirname $0)/..;

# check for a git dir
if [[ ! -e .git ]]; then
    echo "No .git directory here, exiting" >&2;
    exit 1;
fi
s
# be on master and get the updates
git checkout master;
git reset --hard origin/master
git fetch origin;

# inspect what has changed
flist=$(git diff --name-only origin/master);

if [[ -z "${flist}" ]]; then
    # no changes, we are done
    exit 0;
fi

# there are updates, do them
git pull;

if echo -e "${flist}" | grep -i package-lock.json > /dev/null; then
    # package-lock.json has changed, need to rebuild the modules
    npm install;
fi

if echo -e "${flist}" | grep -i \\.ts$ > /dev/null; then
    # TypeScript files changed; rebuild the project
    npm run build;
fi

# now, restart the service
systemctl restart push-notifications;

exit $?;
