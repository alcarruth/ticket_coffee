#!/usr/bin/env coffee
#
#  app.coffee
#

{ DB_RMI_Client } = require('web-worm/client')
{ db_schema } = require('./db_schema')
{ remote_options } = require('./settings')
client = new DB_RMI_Client(db_schema, remote_options)
console.log(db_schema)

nunjucks = require('nunjucks/browser/nunjucks-slim')
templates = require('./templates.js')

# { team_logos_64 } = require('./team_logos_64')
{ conference_logos_64 } = require('./conference_logos_64')
{ background_image_64 } = require('./background_image_64')
{ ImageElements } = require('./image_elements')


class App

  constructor: (@client) ->
    @header = document.getElementById('header')
    @header_title-div = document.getElementById('header-title-div')
    @header-title_h1 = document.getElementById('header-title-h1')
    @header_login_div = document.getElementById('header-login-div')
    @main = document.getElementById('main')
    @footer = document.getElementById('footer')
    @flash_messages = document.getElementsByClassName('flash-messages')
    @image_elements = new ImageElements(conference_logos_64: conference_logos_64)
    @start()

  start: =>
    @client.connect()
    .then((conn) =>
      @connection = conn
      @db = await conn.init_db())
    .catch((error) =>
      console.log("trouble starting app :-(")
      console.log error)

  conferences_view: (db) =>
    conferences = await @db.tables.conference.find_all()
    cs = []
    for conference in conferences
      conf = conference.simple_obj()
      teams = await conference.teams()
      conf.teams = (teams).map((team)->team.simple_obj())
      cs.push(conf)
    html = nunjucks.render('conferences.html', {conferences: cs})
    @main.innerHTML = html


  conference_view: (conference) =>

  ticket_lot_view: () =>

  user_view: () =>

  game_tickets_view: () =>

  delete_image_view: () =>

  delete_tickets_view: () =>

  edit_tickets_view: () =>

  landing_view: () =>

  layout_view: () =>

  login_view: () =>

  sell_tickets_view: () =>



app = new App(client)
# app = { client: client, db_schema: db_schema }

    
if window?
  window.app = app

else  
  exports = app

