#!/bin/bash
#

root_dir=/opt/github/web-tix/

lib=${root_dir}/lib
build=${root_dir}/build
src=${root_dir}/src
browser=${root_dir}/browser
server=${root_dir}/server

function clean {
    echo "clean"
    rm -rf ${lib} ${build} ${browser}
    mkdir -p ${lib} ${build} ${browser}
}

function build_ws_rmi {
    echo build_ws_rmi
    pushd ${root_dir}/../ws-rmi > /dev/null
    ./bin/build.sh > /dev/null
    popd
}

function build_web_worm {
    echo build_web_worm
    pushd ${root_dir}/../web-worm > /dev/null
    ./bin/build.sh > /dev/null
    popd > /dev/null
}

function build_lib {
    echo build_lib 
    pushd ${src}/lib > /dev/null
    coffee -co ${lib} *.coffee > /dev/null
    popd > /dev/null
}

function build_server {
    echo build_server
    cp -r ${src}/server .
}

function build_images {
    echo build_images
    pushd ${src}/browser/images > /dev/null
    coffee -co ${build} conference_logos_64.coffee image_elements.coffee
    coffee -co ${build} team_logos_64.coffee background_image_64.coffee
    popd > /dev/null
}

function build_templates {
    echo build_templates 
    pushd ${build} > /dev/null
    nunjucks="${root_dir}/node_modules/nunjucks"
    cp ${nunjucks}/browser/nunjucks-slim.min.js .
    ${nunjucks}/bin/precompile ${src}/browser/templates/ > ${build}/templates.js
    popd > /dev/null
}

function build_browser {
    echo build_browser
    pushd ${build} > /dev/null
    coffee -co ${build} ${src}/browser/app.coffee
    ln -s ${lib}/db_schema.js ${lib}/settings.js .
    browserify -o ${browser}/web_tix.js ${build}/app.js 
    cp ${src}/browser/index.html ${browser}
    cp -r ${src}/browser/css ${browser}
    cp -r ${src}/browser/images ${browser}
    popd > /dev/null
}

function build {
    clean
    #build_ws_rmi
    #build_web_worm
    build_lib
    build_server
    build_images
    build_templates
    build_browser
}


build

