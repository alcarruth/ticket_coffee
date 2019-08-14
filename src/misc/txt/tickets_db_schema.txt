#!/usr/bin/env coffee
# -*- coding: utf-8 -*-


#---------------------------------------------------------------
# Conference - a collection of Teams

###
TABLE "PUBLIC.CONFERENCE"
=========================


   Column    |       Type        | Collation | Nullable | Default 
-------------+-------------------+-----------+----------+---------
 abbrev_name | character varying |           | not null | 
 name        | character varying |           | not null | 
 logo        | character varying |           | not null | 

Indexes:
  "conference_pkey" PRIMARY KEY, btree (abbrev_name)
  "conference_name_key" UNIQUE CONSTRAINT, btree (name)

Referenced by:
  TABLE "team" CONSTRAINT "team_conference_name_fkey" FOREIGN KEY (conference_name) REFERENCES conference(abbrev_name)
###



class Table
  constructor: (spec) ->
    @name = spec.tablename
    @columns = spec.columns

class Table_Row
  constructor: (@table) ->
  init: (obj) =>
    for col in @table.columns
      this[col] = obj[col]
  toString: =>
    return @name
  simple_obj: =>
    obj = {}
    for col in @table.columns
      obj[col] = this[col]
    return obj
  toJSON: =>
    JSON.stringify(@simple_obj())
  toHTML: =>
    

conferences = new Table(
  tablename: 'conference'
  columns: [
    'abbrev_name',
    'name',
    'logo'
    ])

class Conference extends Table_Row
  constructor: (row) ->
    super(conferences)
    @init(row)


    
#---------------------------------------------------------------
# Teams

###

TABLE "PUBLIC.TEAM"
=====================


     Column      |       Type        | Collation | Nullable |             Default              
-----------------+-------------------+-----------+----------+----------------------------------
 id              | integer           |           | not null | nextval('team_id_seq'::regclass)
 name            | character varying |           | not null | 
 nickname        | character varying |           |          | 
 espn_id         | integer           |           |          | 
 city            | character varying |           |          | 
 state           | character varying |           |          | 
 conference_name | character varying |           |          | 
 logo            | character varying |           |          | 

Indexes:
  "team_pkey" PRIMARY KEY, btree (id)
  "team_name_key" UNIQUE CONSTRAINT, btree (name)

Foreign-key constraints:
  "team_conference_name_fkey" FOREIGN KEY (conference_name) REFERENCES conference(abbrev_name)

Referenced by:
  TABLE "game" CONSTRAINT "game_home_team_id_fkey" FOREIGN KEY (home_team_id) REFERENCES team(id)
  TABLE "game" CONSTRAINT "game_visiting_team_id_fkey" FOREIGN KEY (visiting_team_id) REFERENCES team(id)

###

teams = new Table(
  tablename: 'teams'
  columns: [
    'table_name',
    'id',
    'name',
    'nickname',
    'logo',
    'espn_id',
    'city',
    'state',
    'conference_name',
    'conference'
    ])

class Team extends Table
  
  constructor: (row) ->
    @super(teams)
    @init(row)

  schedule: =>
    games = @away_games + @home_games
    games.sort(key = lambda x: x.date)
    return games

  dates: =>
    games = @away_games + @home_games
    ds = map(lambda x: x.date, games)
    ds.sort()
    return ds

  toString: =>
    return @name


#---------------------------------------------------------------
# Games - a pairing of Teams
# - the venue is the stadium of the home team
#
# TODO: generalize Game to 'Event'
# - add field for event_type, e.g. 'football_game', 'concert'
# - maybe Football_Game is a subclass of Event?
#   home_team and visiting_team make no sense for general Event
#
###

TABLE "PUBLIC.GAME"
=====================


      Column      |  Type   | Collation | Nullable |             Default              
------------------+---------+-----------+----------+----------------------------------
 id               | integer |           | not null | nextval('game_id_seq'::regclass)
 home_team_id     | integer |           |          | 
 visiting_team_id | integer |           |          | 
 date             | date    |           | not null | 

Indexes:
    "game_pkey" PRIMARY KEY, btree (id)
    
Foreign-key constraints:

    "game_home_team_id_fkey" FOREIGN KEY (home_team_id) REFERENCES team(id)
    "game_visiting_team_id_fkey" FOREIGN KEY (visiting_team_id) REFERENCES team(id)
    
Referenced by:
    TABLE "ticket_lot" CONSTRAINT "ticket_lot_game_id_fkey" FOREIGN KEY (game_id) REFERENCES game(id)
    
###


games = new Table(
  tablename: 'game'
  columns: [
    'id',
    'home_team_id',
    'home_team',
    'visiting_team_id',
    'visiting_team ',
    'date'
    ])
 
class Game extends Table_Row

  constructor: (row) ->
    super(games)
    @init(row)

  toString: =>
    s ="%s at %s on %s" % (@visiting_team, @home_team, @date.isoformat())
    return s

 
#---------------------------------------------------------------
# User - someone with a ticket they're trying to sell
# 
###

TABLE "PUBLIC.TICKET_USER"
===========================

 Column  |       Type        | Collation | Nullable |                 Default                 
---------+-------------------+-----------+----------+-----------------------------------------
 id      | integer           |           | not null | nextval('ticket_user_id_seq'::regclass)
 name    | character varying |           | not null | 
 email   | character varying |           | not null | 
 picture | character varying |           |          | 

Indexes:
  "ticket_user_pkey" PRIMARY KEY, btree (id)
  "ticket_user_email_key" UNIQUE CONSTRAINT, btree (email)

Referenced by:
  TABLE "ticket_lot" CONSTRAINT "ticket_lot_user_id_fkey" FOREIGN KEY (user_id) REFERENCES ticket_user(id)

###



ticket_users = new Table(
  tablename: 'ticket_user'
  columns: [
    'id',
    'name',
    'email',
    'picture'
 ])

class TicketUser extends Table_Row

  constructor: (row) ->
    super(ticket_users)
    @init(row)

  toString: =>
    return "%s <%s>" % (@name, @email)


# add a user to the database
#
createUser = (db_session, user_data) ->
    user = new User(
        name = user_data["name"],
        email = user_data["email"],
        picture = user_data["picture"])
    db_session.add(user)
    db_session.commit()
    return user

# maps a user_id to a user
#
getUserByID = (db_session, user_id) ->
  try
    return db_session.query(User).filter_by(id=user_id).one()
  catch error
    return None

# lookup a user by their email address
# and return the user id
#
getUserByEmail = (db_session, email) ->
  try
    return db_session.query(User).filter_by(email=email).one()
  catch error
    return None


#---------------------------------------------------------------
# TODO: Previously, the Ticket class had the game, section, row
# and seat number fields, and these were constrained to be unique.
# That is, there can be at most one ticket for each seat in each
# row in each section for any game.  Simple enough.
# But I wanted this Ticket_Lot class to handle tickets to be sold
# as a group.  Normally this means seats adjacent to each other
# for the same game.


###

TABLE "PUBLIC.TICKET_LOT"
==========================

  Column  |       Type        | Collation | Nullable |                Default                 
----------+-------------------+-----------+----------+----------------------------------------
 id       | integer           |           | not null | nextval('ticket_lot_id_seq'::regclass)
 user_id  | integer           |           |          | 
 game_id  | integer           |           |          | 
 section  | integer           |           |          | 
 row      | integer           |           |          | 
 price    | integer           |           |          | 
 img_path | character varying |           |          | 

Indexes:
  "ticket_lot_pkey" PRIMARY KEY, btree (id)

Foreign-key constraints:
  "ticket_lot_game_id_fkey" FOREIGN KEY (game_id) REFERENCES game(id)
  "ticket_lot_user_id_fkey" FOREIGN KEY (user_id) REFERENCES ticket_user(id)

Referenced by:
  TABLE "ticket" CONSTRAINT "ticket_lot_id_fkey" FOREIGN KEY (lot_id) REFERENCES ticket_lot(id)

###


ticket_lots = new Table(
  tablename: 'ticket_lot'
  columns: [
    'id',
    'user_id',
    'seller',
    'game_id',
    'game',
    'section',
    'row',
    'price',
    'img_path'
  ])

class Ticket_Lot extends Table_Row

  constructor: (obj) ->
    super(ticket_lots)
    @init(obj)
    
  make_img_path: (img_type) =>
    return 'static/images/ticket_images/ticket_lot_%d.%s' % (@id, img_type)

  seats: =>
    return [ ticket.seat for ticket in @tickets ]

  num_seats: =>
    return len(@tickets)

  seats_str: =>
    return ', '.join(map(str,@seats()))

  to_dict: =>
    db_table: @__tablename__,
    values: 
      id: @id,
      game_id: @game_id,
      seller_id: @seller_id,
      section: @section,
      row: @row,
      price: @price,
      seats: @seats()

  toString: =>
    s = str(@game)
    s += " [sec: %d, row: %d, seats: %s]" % (@section, @row, @seats())
    s += " $%d ea" % @price
    return s


#---------------------------------------------------------------
# Tickets - a seat at a Game
#
# TODO: We're assuming that the home team uniquely identifies the
# venue for the game, but games are sometimes played at neutral sites.


###


TABLE "PUBLIC.TICKET"
=====================

 Column |  Type   | Collation | Nullable |              Default               
--------+---------+-----------+----------+------------------------------------
 id     | integer |           | not null | nextval('ticket_id_seq'::regclass)
 lot_id | integer |           |          | 
 seat   | integer |           |          | 

Indexes:
  "ticket_pkey" PRIMARY KEY, btree (id)

Foreign-key constraints:
  "ticket_lot_id_fkey" FOREIGN KEY (lot_id) REFERENCES ticket_lot(id)

###


tickets = new Table(
  tablename = 'ticket'
  columns = [
    'id',
    'lot_id',
    'lot',
    'seat'
  ])
  #UniqueConstraint('game', 'section', 'row', 'seat')

class Ticket extends Table_Row

  constructor: (obj) ->
    super(tickets)
    @init(obj)
    
  toString: =>
    s = str(@lot.game)
    s += " [sec: %d, row: %d, seat: %d]" % (@lot.section, @lot.row, @seat)
    s += " $%d" % @lot.price
    return s

