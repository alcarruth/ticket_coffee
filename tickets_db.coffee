#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

{ Table, Table_Row } = require('./db_orm')
{ Client, Pool } = require('pg')

pool = new Pool(host: '/var/run/postgresql', database: 'tickets')
  
query = (qs) ->
  client = await pool.connect()
  response = client.query(qs)
  response.then( (result) ->
    client.release()
    return result.rows)

db =
  pool: pool
  query: query
  tables: {}

#-------------------------------------------------------------------------
# An instance of class Conference is kept in the conferences table
# 

class Conference extends Table_Row

  constructor: (row) ->
    super(conferences)
    @__init(row)

conferences = new Table(
  db: db
  tablename: 'conference'
  row_class: Conference
  primary_key: 'abbrev_name'
  columns: [
    'abbrev_name', # = new Local_String()
    'name',        # = new Local_String()
    'logo'        
    ]
  back_references: {
    teams: { table_name: 'team', col: 'conference_name' }
  })

#------------------------------------------------------------------------------------
# 

class Team extends Table_Row

  constructor: (obj) ->
    super(teams)
    @__init(obj)

  toString: =>
    return @__name

  games: =>
    games = (await @away_games()).concat(await @home_games())
    games.sort(Game.compare)
    return games

teams = new Table(
  db: db
  tablename: 'team'
  row_class: Team
  primary_key: 'id'
  columns: [
    'id',
    'name',
    'nickname',
    'logo',
    'espn_id',
    'city',
    'state',
    'conference_name',
    'conference'
    ]
  foreign_keys: {
    conference: { table_name: 'conference', key_name: 'conference_name' }
    }
  back_references: {
    home_games: { table_name: 'game', col: 'home_team_id' }
    away_games: { table_name: 'game', col: 'visiting_team_id' }
    })

 
#------------------------------------------------------------------------------------
# 

class Game extends Table_Row

  # class (static) method suitable for sorting games
  @compare = (a,b) ->
    a_val = a.date().valueOf()
    b_val = b.date().valueOf()
    return (if (a_val < b_val) then -1 else 1)
      
  constructor: (obj) ->
    super(games)
    @__init(obj)

  toString: =>
    host = await @home_team()
    visitor = await @visiting_team()
    date = @date().toString().split(' ')[0...4].join(' ')
    return "#{visitor.name()} at #{host.name()} on #{date}"


games = new Table(
  db: db
  tablename: 'game'
  row_class: Game
  primary_key: 'id'
  columns: [ 'id', 'home_team_id', 'visiting_team_id', 'date' ]
  foreign_keys: {
    home_team: { table_name: 'team', key_name: 'home_team_id' }
    visiting_team: { table_name: 'team', key_name: 'visiting_team_id' }
    })


#------------------------------------------------------------------------------------
# Ticket Users
# 

class Ticket_User extends Table_Row

  constructor: (obj) ->
    super(ticket_users)
    @__init(obj)

  toString: =>
    return "#{@__name} <#{@__email}>"

ticket_users = new Table(
  db: db
  tablename: 'ticket_user'
  row_class: Ticket_User
  primary_key: 'id'
  columns: [ 'id', 'name', 'email', 'picture' ]
  )

# add a user to the database
#
createUser = (user_data) ->
  user = new User(
    name = user_data["name"],
    email = user_data["email"],
    picture = user_data["picture"])
  ticket_users.add_row(user)
  #db_session.commit()
  return user

# maps a user_id to a user
#
getUserByID = (user_id) ->
  qs = "select * from ticket_user where id = '#{user_id}'"
  result = await db.pool.query(qs)
  return result.rows[0]

# lookup a user by their email address
# and return the user id
#
getUserByEmail = (email) ->
  qs = "select * from ticket_user where email = '#{email}'"
  result = await db.pool.query(qs)
  return result.rows[0]


#------------------------------------------------------------------------------------
# Ticket Lots
# 

class Ticket_Lot extends Table_Row

  constructor: (obj) ->
    super(ticket_lots)
    @__init(obj)
    
  make_img_path: (img_type) =>
    #return 'static/images/ticket_images/ticket_lot_%d.%s' % (@__id, img_type)

  num_seats: =>
    return len(@__tickets)

  seats_str: =>
    #return ', '.join(map(str,@__seats()))

  toString: =>
    #s = str(@__game)
    #s += " [sec: %d, row: %d, seats: %s]" % (@__section, @__row, @__seats())
    #s += " $%d ea" % @__price
    #return s
  
ticket_lots = new Table(
  db: db
  tablename: 'ticket_lot'
  row_class: Ticket_Lot
  primary_key: 'id'
  columns: [ 'id', 'user_id', 'seller', 'game_id',
    'section', 'row','price', 'img_path']
  foreign_keys: {
    user: { table_name: 'ticket_user', key_name: 'user_id' }
    game: { table_name: 'game', key_name: 'game_id' }
  }
  back_references: {
    tickets: { table_name: 'ticket', key_name: 'lot_id' }
  })


#------------------------------------------------------------------------------------
# Tickets
# 

class Ticket extends Table_Row

  constructor: (obj) ->
    super(tickets)
    @__init(obj)
    
  toString: =>
    #s = str(@__lot.game)
    #s += " [sec: %d, row: %d, seat: %d]" % (@__lot.section, @__lot.row, @__seat)
    #s += " $%d" % @__lot.price
    #return s

tickets = new Table(
  db: db
  tablename: 'ticket'
  row_class: Ticket
  primary_key: 'id'
  columns: [ 'id', 'lot_id', 'seat' ]
  foreign_keys: {
    lot: { table_name: 'ticket_lot', key: 'lot_id' }
    })

#------------------------------------------------------------------------------------
#

tables = {
  conference: conferences
  team: teams
  game: games
  ticket: tickets
  ticket_user: ticket_users
  ticket_lot: ticket_lots
  }

exports.pool = pool
exports.query = query
exports.tables = tables
exports.Table = Table
exports.Table_Row = Table_Row
exports.Conference = Conference
exports.Team = Team
exports.Game = Game
exports.Ticket = Ticket
exports.Ticket_User = Ticket_User
exports.Ticket_Lot = Ticket_Lot
