#!/usr/bin/env coffee
#
#  app.coffee
#

{ DB_RMI_Client } = require('web-worm-client')
{ db_schema } = require('./db_schema')

options = require('./settings').remote_options
nunjucks = require('nunjucks/browser/nunjucks-slim')
templates = require('./templates')

class App

  constructor: (@options, @db_schema, @nunjucks, @templates) ->
    @client = new DB_RMI_Client(@options)
    @start()

  start: =>
    @client.connect()
    .then((conn) =>
      @connection = conn
      @db = await conn.init_db())
    .catch((error) =>
      console.log("trouble starting app :-(")
      console.log error)

app = new App(options, db_schema, nunjucks, templates)


if window?
  window.app = app

else  
  exports.app = app
