#!/bin/bash
#

root_dir='/var/www/git/projects'/
ws_rmi_src="${root_dir}/ws_rmi/src/lib/"
db_worm_src="${root_dir}/db_worm/src/"
tickets_src="${root_dir}/tickets_coffee/src/"

pushd build
cp ${ws_rmi_src}/app.coffee ws_rmi_app.coffee
cp ${ws_rmi_src}/client.coffee ws_rmi_client.coffee
cp ${db_worm_src}/db_orm.coffee .
cp ${db_worm_src}/db_rmi_client.coffee .
cp ${tickets_src}/db_schema.coffee db_schema.coffee
cp ${tickets_src}/settings.coffee settings.coffee
cp ${tickets_src}/client.coffee tix_client.coffee

files="
  ws_rmi_app.coffee
  ws_rmi_client.coffee
  db_orm.coffee
  db_rmi_client.coffee
  db_schema.coffee
  settings.coffee
  tix_client.coffee
"

cat $files > web_tix.coffee
coffee -cM web_tix.coffee

popd
