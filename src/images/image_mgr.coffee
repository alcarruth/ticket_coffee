#!/usr/bin/env coffee
#
#  web-tix/src/images/image_mgr.coffee
#
fs = require('fs')

{ DB_RMI_Client } = require('web-worm/client')
{ db_schema } = require('../lib/db_schema')
{ ipc_options } = require('../lib/settings')

class Image_Mgr
  
  constructor: (@json_path) ->
    @client = new DB_RMI_Client(db_schema, ipc_options)
    @init_from_JSON(@json_path)

  init_from_JSON: (path) =>
    json = fs.readFileSync(path, 'utf8')
    @logos = JSON.parse(json)

  save_to_JSON: (path) =>
    json = JSON.stringify(@logos, null, 3)
    fs.writeFileSync(path, json)

  minify: (image) =>
    # convert -strip -interlace Plane -gaussian-blur 0.05 -quality 85%
    #   -resize 100x100 orig/${img}.png ${img}.jpg ;

  

  init_from_db: =>
    @logos = {}
    @db = await @client.connect()
    console.log "initialized db."
    @conferences = await @db.tables.conference.find_all()
    console.log "initialized conferences."
    for conference in @conferences
      conference_logo = (await conference.name()).replace(/ /g, '_')
      @logos[conference_logo] = []
      @teams = await conference.teams()
      for team in @teams
        team_logo = (await team.full_name()).replace(/ /g, '_')
        @logos[conference_logo].push(team_logo)
    return @logos


image_mgr = new Image_Mgr()
    
# module.exports = image_mgr

