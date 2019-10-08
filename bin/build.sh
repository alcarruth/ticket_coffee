#!/bin/bash
#

#root_dir=/var/www/git/projects/web-tix
root_dir=/home/carruth/git/web-tix
build=${root_dir}/build
src=${root_dir}/src
browser=${root_dir}/browser

rm -rf ${build} ${browser}
mkdir -p ${build} ${browser}

pushd ${root_dir}/../ws-rmi
./bin/build.sh
popd

pushd ${root_dir}/../web-worm
./bin/build.sh
popd

pushd ${src}
coffee -co ${build} db_schema.coffee settings.coffee app.coffee
coffee -co ${build} logger.coffee client.coffee server.coffee
../node_modules/nunjucks/bin/precompile ./templates/ > ${build}/templates.js
cp index.html ${build}
popd

pushd ${build}
browserify -o web_tix.js app.js 
cp ./index.html ${browser}
cp ./web_tix.js ${browser}
popd


