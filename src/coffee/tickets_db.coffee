#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

db_orm = require('db_orm')
{ Table, Table_Row } = db_orm
{ SQL_String, SQL_Integer, SQL_Date } = db_orm
{ Local_Method, Reference, Back_Reference } = db_orm

{ Client, Pool } = require('pg')

pool = new Pool(host: '/var/run/postgresql', database: 'tickets')
  
query = (text, values) ->
  client = await pool.connect()
  response = client.query(text, values)
  response.then( (result) ->
    client.release()
    return result.rows)

db =
  pool: pool
  query: query
  tables: {}

# comparison function suitable for sorting by column
_by_= (col) -> (a,b) ->
  a_val = a[col]().valueOf()
  b_val = b[col]().valueOf()
  return (if (a_val < b_val) then -1 else 1)

#-------------------------------------------------------------------------

conference = new Table

  db: db
  tablename: 'conference'
  primary_key: 'abbrev_name'

  sql_columns:
    abbrev_name: new SQL_String()
    name: new SQL_String()
    logo: new SQL_String()

  pseudo_columns: 
    teams: new Back_Reference('team', 'conference_name')

#------------------------------------------------------------------------------------

team = new Table

  db: db
  tablename: 'team'
  primary_key: 'id'

  sql_columns: 
    id: new SQL_Integer()
    name: new SQL_String()
    nickname: new SQL_String()
    logo: new SQL_String()
    espn_id: new SQL_Integer()
    city: new SQL_String()
    state: new SQL_String()
    conference_name: new SQL_String()

  pseudo_columns:

    conference: new Reference('conference', 'conference_name')
    home_games: new Back_Reference('game', 'home_team_id')
    away_games: new Back_Reference('game', 'visiting_team_id')

    full_name:  new Local_Method( ->
      return "#{@name()} #{@nickname()}")

    games: new Local_Method( ->
      games = (await @away_games()).concat(await @home_games())
      games.sort(_by_('date'))
      return games)

#------------------------------------------------------------------------------------

game = new Table

  db: db
  tablename: 'game'
  primary_key: 'id'
  
  sql_columns: 
    id: new SQL_Integer()
    home_team_id: new SQL_Integer()
    visiting_team_id: new SQL_Integer()
    date: new SQL_Date()

  pseudo_columns:
    home_team: new Reference('team', 'home_team_id')
    visiting_team: new Reference('team', 'visiting_team_id')
    tickets: new Back_Reference('ticket_lot', 'game_id')

#------------------------------------------------------------------------------------

ticket_user = new Table

  db: db
  tablename: 'ticket_user'
  primary_key: 'id'
  
  sql_columns:
    id: new SQL_Integer()
    name: new SQL_String()
    email: new SQL_String()
    picture: new SQL_String()

  pseudo_columns:
    ticket_lots: new Back_Reference('ticket_lot', 'user_id')

#------------------------------------------------------------------------------------
    
ticket_lot = new Table

  db: db
  tablename: 'ticket_lot'
  primary_key: 'id'

  sql_columns:
    id: new SQL_Integer()
    user_id: new SQL_Integer()
    game_id: new SQL_Integer()
    section: new SQL_String()
    row: new SQL_String()
    price: new SQL_String()
    img_path: new SQL_String()

  pseudo_columns:
    seller: new Reference('ticket_user', 'seller_id')
    buyer: new Reference('ticket_user', 'buyer_id')
    game: new Reference('game', 'game_id')
    tickets: new Back_Reference('ticket', 'lot_id')
    num_seats: new Local_Method( ->
      tickets = await @tickets()
      return tickets.length)
    seats: new Local_Method( ->
      tickets = await @tickets()
      seats = (ticket.seat() for ticket in tickets).sort()
      return seats)

#------------------------------------------------------------------------------------

ticket = new Table

  db: db
  tablename: 'ticket'
  primary_key: 'id'

  sql_columns:
    id: new SQL_String()
    lot_id: new SQL_String()
    seat: new SQL_String()

  pseudo_columns:
    lot: new Reference('ticket_lot', 'lot_id')

#------------------------------------------------------------------------------------
#

tables =
  conference: conference
  team: team
  game: game
  ticket: ticket
  ticket_user: ticket_user
  ticket_lot: ticket_lot

exports.pool = pool
exports.query = query
exports.orm = db_orm

exports.Table = Table
exports.Table_Row = Table_Row

exports.tables = tables

test = ->
  try
    texas = (await team.find_where('name', 'Texas'))[0]
    exports.texas = texas
    big_12 = await conference.find_by_id('Big_12')
    exports.big_12 = big_12
    game = (await texas.games())[0]
    exports.game = game
  catch error
    console.log("Error in test()")

test()

