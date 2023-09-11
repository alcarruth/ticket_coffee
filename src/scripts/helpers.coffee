#!/usr/bin/env coffee
#
#
#
# 

JSZip = require('jszip')
{ DB_RMI_Client } = require('web-worm/client')
{ db_schema } = require('./db_schema')
{ ipc_options } = require('./settings')


client = new DB_RMI_Client(db_schema, ipc_options)

images_dir = "/opt/github/web-tix/src/images/"



# Image_64 is used to wrap and render html for image elements.
# TODO: Suppose I want to have more than one <img> containing
# the same base_64.  Do I need to include the base_64 in each
# element or can I use some sort of pointer to one copy?
# Need to check spec for <img> src attribute I suppose.
# 
class Image_64
  constructor: (@id, @img_type, @str_64) ->
  html: =>
    src = "data:image/#{@img_type};base64, #{@str_64}"
    alt = "image for #{@id}"
    return "<img id=\"#{@id}\" src=\"#{src}\" alt=\"#{alt}\"> \n"

# Class Image.  Can I do something like this?  Can I send binary data
# over the websocket and include the data in the image?  How's that
# work?  If I can do this, how does it compare to using base_64?
# (which is normally used for inclusion in the html, I believe.)
# 
class Image
  constructor: (@id, @img_type, @buf) ->
  html: =>
    src = "data:image/#{@img_type}, #{@buf}"
    alt = "image for #{@id}"
    return "<img id=\"#{@id}\" src=\"#{src}\" alt=\"#{alt}\"> \n"
  html_64: =>
    src = "data:image/#{@img_type}, #{@buf}"
    alt = "image for #{@id}"
    return "<img id=\"#{@id}\" src=\"#{src}\" alt=\"#{alt}\"> \n"

# subclass of Image for conference logos
# 
class Conference_Logo_64 extends Image
  constructor: (name, img_type, buf) ->
    id = "conference-logo-64-#{name}"
    className = "conference-logo-64"
    super(id, className, img_type, buf)

# subclass of Image for team logos
# 
class Team_Logo_64 extends Image
  constructor: (name, nickname, img_type, buf) ->
    id = "team-logo-64-#{name}"
    className = "team-logo-64"
    super(id, className, img_type, buf)


# Create images.json containing base64 versions of images
#
create_images_json = (images_dir) ->

  fs = require('fs')
  images = {}
  dirs = [ 'conference_logos_64', 'team_logos_64', 'tickets_64' ]

  for dir in dirs
    images[dir] = {}
    for img_file in fs.readdirSync("#{images_dir}/#{dir}")
      file_path = "#{images_dir}/#{dir}/#{img_file}"
      images[dir][img_file] = fs.readFileSync(file_path, 'utf-8')

  file = 'FF8a5Ku_2000_cropped.jpg-64'
  images[file] = fs.readFileSync("#{images_dir}/#{file}", 'utf-8')

  images_json = JSON.stringify(images)
  fs.writeFileSync('images_json', images_json)






exports.create_images_json = create_images_json
