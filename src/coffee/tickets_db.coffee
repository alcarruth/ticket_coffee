#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

db_orm = require('./db_orm')
{ Table, Table_Row } = db_orm
{ String_Column, Integer_Column, Date_Column } = db_orm
{ Reference, Back_Reference } = db_orm

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

  simple_obj: =>
    name: @name()
    teams: (await team).simple_obj() for team in (await @teams())

conferences = new Table(
  db: db
  tablename: 'conference'
  row_class: Conference
  primary_key: 'abbrev_name'
  columns: {
    abbrev_name: new String_Column(primary_key = true)
    name: new String_Column(nullable = false, unique = true)
    logo: new String_Column(nullable = false)
    teams: new Back_Reference('team', 'conference_name')
  })

#------------------------------------------------------------------------------------
# 

class Team extends Table_Row

  constructor: (obj) ->
    super(teams)
    @__init(obj)

  full_name: =>
    "#{@name()} #{@nickname()}"

  toString: =>
    @full_name()

  simple_obj: =>
    name: @name()
    nickname: @nickname()
    conference: @conference_name()
    
  games: =>
    games = (await @away_games()).concat(await @home_games())
    games.sort(Game.compare)
    return games

teams = new Table(
  db: db
  tablename: 'team'
  row_class: Team
  primary_key: 'id'
  columns: {
    id: new Integer_Column() #primary_key = true)
    name: new String_Column() #nullable = false)
    nickname: new String_Column()
    logo: new String_Column()
    espn_id: new Integer_Column()
    city: new String_Column()
    state: new String_Column()
    conference_name: new String_Column()
    conference: new String_Column()
    conference: new Reference('conference', 'conference_name')
    home_games: new Back_Reference('game', 'home_team_id')
    away_games: new Back_Reference('game', 'visiting_team_id')
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

  simple_obj: =>
    host: (await @home_team()).simple_obj()
    visitor: (await @visiting_team()).simple_obj()
    date: @date().toString().split(' ')[0...4].join(' ')
    
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
  columns: {
    id: new Integer_Column(primary_key = true, nullable = false)
    home_team_id: new Integer_Column()
    visiting_team_id: new Integer_Column()
    date: new Date_Column(nullable = false)
    home_team: new Reference('team', 'home_team_id')
    visiting_team: new Reference('team', 'visiting_team_id')
    tickets: new Back_Reference('ticket_lot', 'game_id')
    })


#------------------------------------------------------------------------------------
# Ticket Users
# 

class Ticket_User extends Table_Row

  constructor: (obj) ->
    super(ticket_users)
    @__init(obj)

  simple_obj: =>
    name: @name()
    email: @email()
    

  toString: =>
    return "#{@__name} <#{@__email}>"

ticket_users = new Table(
  db: db
  tablename: 'ticket_user'
  row_class: Ticket_User
  primary_key: 'id'
  columns: {
    id: new Integer_Column(primary_key = true)
    name: new String_Column(nullable = false)
    email: new String_Column(unique = true, nullable = false)
    picture: new String_Column(nullable = true)
    ticket_lots: new Back_Reference('ticket_lot', 'user_id')
  })

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
    tickets = await @tickets()
    return tickets.length

  seats: =>
    tickets = await @tickets()
    seats = (ticket.seat() for ticket in tickets).sort()
    return seats

  simple_obj: =>
    seller: (await @user()).simple_obj()
    game: await (await @game()).simple_obj()
    section: await @section()
    row: await @row()
    seats: await @seats()
    price: @price()
    

  toString: =>
    game = await (await @game()).toString()
    section = await @section()
    row = await @row()
    seats = await @seats()
    price = @price()
    s = "#{game}\n  sec: #{section}\n  row: #{row}\n  seats: #{seats}\n  price: $#{price} ea"
    return s
  
ticket_lots = new Table(
  db: db
  tablename: 'ticket_lot'
  row_class: Ticket_Lot
  primary_key: 'id'
  columns: {
    id: new Integer_Column(primary_key = true)
    user_id: new Integer_Column()
    game_id: new Integer_Column()
    section: new String_Column()
    row: new String_Column()
    price: new String_Column()
    img_path: new String_Column()
    user: new Reference('ticket_user', 'user_id')
    game: new Reference('game', 'game_id')
    tickets: new Back_Reference('ticket', 'lot_id')
  })


#------------------------------------------------------------------------------------
# Tickets
# 

class Ticket extends Table_Row

  constructor: (obj) ->
    super(tickets)
    @__init(obj)

  simple_obj: =>
    {game, section, row} = await (await @lot()).simple_obj()
    return 
      game: game
      section: section
      row: row
      seat: @seat()
    
  toString: =>
    { game, section, row, seat } = await @simple_obj()
    s = "Game: game.toString()}\n"
    s += " sec: #{section}\n  row: #{row}\n  seat: #{seat}]"
    return s

tickets = new Table(
  db: db
  tablename: 'ticket'
  row_class: Ticket
  primary_key: 'id'
  columns: {
    id: new String_Column()
    lot_id: new String_Column()
    seat: new String_Column()
    lot: new Reference('ticket_lot', 'lot_id')
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

test = ->
  texas = (await teams.__find_all('name', 'Texas'))[0]
  exports.texas = texas

  big_12 = await conferences.__find_by_id('Big_12')
  exports.big_12 = big_12

  game = (await texas.games())[0]
  exports.game = game

  #ticket_lots = await (await game.tickets())
  #ticket_lot = ticket_lots[0]
  #tickets = await ticket_lot.tickets()
  
  #exports.ticket_lots = ticket_lots
  #exports.ticket_lot = ticket_lot
  #exports.tickets = tickets

test()

