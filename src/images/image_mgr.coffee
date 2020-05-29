#!/usr/bin/env coffee
#
#  web-tix/src/images/image_mgr.coffee
#

{ DB_RMI_Client } = require('web-worm/client')
{ db_schema } = require('../lib/db_schema')
{ ipc_options } = require('../lib/settings')

client = new DB_RMI_Client(db_schema, ipc_options)

get_teams_by_conference = ->
  conn = await client.connect()
  conferences = await conn.db.tables.conference.find_all()
  obj = {}
  for conference in conferences
    teams = await conference.teams()
    team_names = (await team.full_name() for team in teams)
    obj[conference.name()] = team_names
  return obj


exports.get_teams_by_conference = get_teams_by_conference

