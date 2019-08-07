# `tickets_coffee`

Package `tickets_coffee`, is a re-writing of my
[Tickets-R-Us](https://github.com/alcarruth/fullstack-p3-item-catalog)
project using just coffeescript, JSON and two companion packages,
[`ws_rmi`](https://github.com/alcarruth/ws_rmi), and
[`db_worm`](https://github.com/alcarruth/db_worm).  The original
Tickets'R'US project was built with development stack consisting of
`python`, `sql_alchemy`, `psycopg2` and `flask`.  It worked fine but I
felt it was not as clean as it could be.  These three packages are the
result of my ongoing effort to demonstrate that I could that I can do
better with straight coffeescript and JSON.

## Why Coffeescript?

## Overall Design

### Object Relational Mapping

```
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

```



### Remote Method Invocation

#### `db_rmi`

The second half of the `db_rmi` project is `db_rmi` which extends the
`ws_rmi` classes with db specific sub-classes so that the `Table` and
`Table_Row` classes created by `db_orm` are mapped to stub classes on
the client/browser side.  Calling a method in the browser invokes the
method in the server on the corresponding remote object on the server
side which is directly mapped to the database.

## Status

