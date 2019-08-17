#!/bin/bash
#

root_dir=/var/www/git/projects/web-tix/
build_dir=${root_dir}/build/

rm -rf ${build_dir}
mkdir -p ${build_dir}

pushd ${root_dir}/src
coffee -co ${root_dir}/build db_schema.coffee settings.coffee client.coffee server.coffee
cp index.html ${root_dir}/build
popd

pushd ${root_dir}/build
browserify -o web_tix.js client.js
popd

pushd ${root_dir}
cp ./build/index.html ./browser
cp ./build/web_tix.js ./browser
popd


