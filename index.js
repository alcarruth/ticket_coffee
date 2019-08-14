#!/usr/bin/env node


require('coffeescript/register')


tickets_db = require('./src/tickets_db')

exports.tickets_db = tickets_db
