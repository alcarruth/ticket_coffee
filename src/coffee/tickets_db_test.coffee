#!/usr/bin/env coffee
# -*- coding: utf-8 -*-

db.test = (db) ->
  texas = await (await db.tables.team.find_where('name', 'Texas'))[0]
  big_12 = await db.tables.conference.find_by_id('Big_12')
  game = await (await texas.games())[0]
  return
    texas: texas
    big_12: big_12
    game: game

