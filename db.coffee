#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ Client, Pool } = require('pg')

db = require('./tickets_db')
{ tables, Table, Table_Row } = db
{ Conference, Team, Game, Ticket, Ticket_User, Ticket_Lot } = db

settings =

  # app settings
  app_dir: '/home/carruth/git/scratch/'

  # must match setting in reset_db.sh 
  db_name: 'tickets'

  # options for dummy data creation
  year: 2016
  number_of_gamee: 11
  number_of_users: 1000
  
  # This is the number of ticket _lots_.
  # The actual number of tickets created will 
  # be 2 or 3 times this amount.
  number_of_ticket_lots: 5000
  
  startup_info: "Tickets'R'Us Web App\nNode PostgreSQL\n"

  
pool = new Pool(host: '/var/run/postgresql', database: 'tickets')

load_db = ->
  for name, table of tables
    data = await fetch_data(name)
    table.add_row(row) for row in await data.rows
    console.log("table #{name} loaded")

fetch_data = (name) ->
  query("select * from #{name}")
  
query = (qs) ->
  client = await pool.connect()
  response = client.query(qs)
  response.then( (result) ->
    client.release()
    return result.rows)


exports.query = query
exports.fetch_data = fetch_data
exports.load_db = load_db
exports.pool = pool
exports.tables = tables
exports.Table = Table
exports.Table_Row = Table_Row
exports.Conference = Conference
exports.Team = Team
exports.Game = Game
exports.Ticket = Ticket
exports.Ticket_User = Ticket_User
exports.Ticket_Lot = Ticket_Lot
