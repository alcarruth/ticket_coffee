#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ DB_ORM } = require('db_worm')

# comparison function suitable for sorting by column
# 
_by_= (col) -> (a,b) ->
  a_val = a[col]().valueOf()
  b_val = b[col]().valueOf()
  return (if (a_val < b_val) then -1 else 1)

table_defs  =
  
  conference:
    abbrev_name: string: { primary_key: true }
    name: string: {}
    logo: string: {}
    teams: back_reference: { table_name: 'team', col_name: 'conference_name' }

  team:
    id: integer: { primary_key: true }
    name: string: {} 
    nickname: string: {}
    logo: string: {}
    espn_id: integer: {}
    city: string: {}
    state: string: {}
    conference_name: string: {}
    conference: reference: { table_name: 'conference', col_name: 'conference_name' }
    home_games: back_reference: { table_name: 'game', col_name: 'home_team_id' }
    away_games: back_reference: { table_name: 'game', col_name: 'visiting_team_id' }
    full_name: local_method: { method: -> "#{@name()} #{@nickname()}" }
    games: local_method:
      method: ->
        away_games = (await @away_games())
        home_games = (await @home_games())
        games = away_games.concat(home_games)
        return games.sort(_by_('date'))

  game:
    id: integer: { primary_key: true }
    home_team_id: integer: {}
    visiting_team_id: integer: {}
    date: date: {}
    home_team: reference: {table_name: 'team', col_name: 'home_team_id'}
    visiting_team: reference: {table_name: 'team', col_name: 'visiting_team_id'}
    tickets: back_reference: {table_name: 'ticket_lot', col_name: 'game_id'}

  ticket_user:
    id: integer: { primary_key: true }
    name: string: {}
    email: string: {}
    picture: string: {}
    ticket_lots: back_reference: {table_name: 'ticket_lot', col_name: 'user_id'}
    
  ticket_lot:
    id: integer: { primary_key: true }
    user_id: integer: {}
    game_id: integer: {}
    section: string: {}
    row: string: {}
    price: string: {}
    img_path: string: {}
    seller: reference: {table_name: 'ticket_user', col_name: 'seller_id'}
    buyer: reference: {table_name: 'ticket_user', col_name: 'buyer_id'}
    game: reference: {table_name: 'game', col_name: 'game_id'}
    tickets: back_reference: {table_name: 'ticket', col_name: 'lot_id'}
    num_seats: local_method:
      method: ->
        (await @tickets()).length
    seats: local_method:
      method: ->
        ticket.seat() for ticket in (await tickets()).sort()

  ticket:
    id: string: { primary_key: true }
    lot_id: string: {}
    seat: string: {}
    lot: reference: { name_name: 'ticket_lot', col_name: 'lot_id' }


pg_options = 
  host: '/var/run/postgresql'
  database: 'tickets'

try
  db = new DB_ORM(pg_options, table_defs)
  for k,v of db
    exports[k] = v
                  
catch error
  console.log("Failed to create db.")
  console.log error

  


