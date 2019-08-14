

#------------------------------------------------------------------------------
# LOGIN
#

@app.route(mount_point + '/login')
  return render_template(
    'login.html', 
    google_app_id = google_app_id,
    google_connect_js = google_connect_js,
    fb_connect_js = fb_connect_js,
    google_sign_in = True,
    app_session = app_session
    )


#------------------------------------------------------------------------------
# CONNECT - redirect to conferences
#

@csrf.exempt
@app.route(mount_point + '/connect/<provider_name>/<session_id>', methods=['POST'])
def connect(provider_name, session_id):

    print "\n\nprovider_name: %s\n" % provider_name
    print "session_id: %s\n" % session_id

    # TODO: Fix this hack:
    redirect_url = 'https://armazilla.net/tickets/conferences'

    # verify session_id
    print "get_session_id(): %s\n" % get_session_id()
    if session_id != get_session_id():
        flash('Invalid session_id.')
        return redirect(redirect_url)

    # auth_code is in the 'POST' data
    auth_code = request.data
    print "auth_code: %s\n" % auth_code
    login = auth_providers[provider_name].connect(auth_code, Login)

    if (app_session.get('login') is not None):
        prev_login = Login(None, None, None, None)
        prev_login.from_json(app_session.get('login'))
        if login.get('access_id') == prev_login.get('access_id'):
            msg = 'Current user is already connected.'
            flash(msg)
            return redirect(redirect_url)
            
    user = getUserByEmail(db_session, login.user_data['email'])
    if not user:
        user = createUser(db_session, login.user_data)

    # Store the access token in the session for later use.
    app_session['login'] = login.to_json()
    app_session['user_id'] = user.id
    app_session['user_name'] = user.name

    msg = "you are now logged in as %s" % user.name
    flash(msg)
    return redirect(redirect_url)


#------------------------------------------------------------------------------
# LOGOUT VIEW
# 


@csrf.exempt
@app.route(mount_point + '/disconnect')
def disconnect():

    # TODO: Fix this hack:
    redirect_url = 'https://armazilla.net/tickets/conferences'

    try:
        login_json = app_session.get('login')
        login = json.loads(login_json)
        provider = auth_providers[login.get('provider_name')]
        result = provider.disconnect(login)
        del app_session['login']
        del app_session['user_id']
        del app_session['user_name']
        msg = "You have successfully logged out."
        flash(msg)

    except:
        msg = "You are not logged in."
        flash(msg)

    return redirect(redirect_url)


#---------------------------------------------------------------------------------------------
# LANDING VIEW

@app.route(mount_point + '/')
def landing():
    main = Markup(render_template('landing.html'))
    return render_template('layout.html', main=main, app_session=app_session)



#---------------------------------------------------------------------------------------------
# CONFERENCES VIEW

@app.route(mount_point + '/conferences')
def conferences():
    conferences = db_session.query(Conference).all()
    main = Markup(render_template('conferences.html', conferences=conferences))
    return render_template('layout.html', main=main, app_session=app_session)



#---------------------------------------------------------------------------------------------
# CONFERENCE VIEWS

# A page for a single conference showing the schedules for each team
# 
# templates:
#   conference.html
#   layout.html


# HTML
# 
@app.route(mount_point + '/conference/<conference>')
def conference(conference):
    conference = db_session.query(Conference).filter_by(abbrev_name=conference).one()
    main = Markup(render_template('conference.html', conference=conference))
    return render_template('layout.html', main=main, app_session=app_session)


# JSON
# 
@app.route(mount_point + '/conference/<conference>/JSON')
def conference_json(conference):
    conference = db_session.query(Conference).filter_by(abbrev_name=conference).one()
    return jsonify(conference.to_dict())


# XML
# 
@app.route(mount_point + '/conference/<conference>/XML')
def conference_xml(conference):
    conference = db_session.query(Conference).filter_by(abbrev_name=conference).one()
    return xmlify(conference.to_dict())



#---------------------------------------------------------------------------------------------
# TEAM VIEWS

# TODO: I don't think this is used anymore.  Delete it ?  No, don't
# delete it.  It could be used later on to provide more information
# about a team / school on a new page.


# HTML
# 
@app.route(mount_point + '/team/<team_name>')
def team(team_name):
    team = db_session.query(Team).filter_by(name=team_name).one()
    return render_template('team.html', team=team)


# JSON
# 
@app.route(mount_point + '/team/<team_name>/JSON')
def team_json(team_name):
    team = db_session.query(Team).filter_by(name=team_name).one()
    return jsonify(team.to_dict())


# XML
# 
@app.route(mount_point + '/team/<team_name>/XML')
def team_xml(team_name):
    team = db_session.query(Team).filter_by(name=team_name).one()
    return xmlify(team.to_dict())



#---------------------------------------------------------------------------------------------
# GAME - TICKETS AVAILABLE
# 


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in set(['png', 'jpg', 'jpeg', 'gif'])


# HTML 
#
@app.route(mount_point + '/game/<int:game_id>')
def game(game_id):
    game = db_session.query(Game).filter_by(id=game_id).one()
    game.ticket_lots.sort(key = lambda x: x.price)
    main = Markup(render_template('game_tickets.html', game=game))
    return render_template('layout.html', main=main, app_session=app_session)



# JSON
# 
@app.route(mount_point + '/game/<int:game_id>/JSON')
def game_json(game_id):
    game = db_session.query(Game).filter_by(id=game_id).one()
    return jsonify(game.to_dict())



# XML
# 
@app.route(mount_point + '/game/<int:game_id>/XML')
def game_xml(game_id):
    game = db_session.query(Game).filter_by(id=game_id).one()
    return xmlify(game.to_dict())



#---------------------------------------------------------------------------------------------
# GAME - SELL TICKETS
# 


@app.route(mount_point + '/game/<int:game_id>/sell', methods=['GET', 'POST'])
@check_authentication("You must be logged in to sell tickets!")
def sell_tickets(game_id):

    # user is logged in so able to sell tickets
    # return a page with a fill-in form
    if request.method == 'GET':
        game = db_session.query(Game).filter_by(id=game_id).one()
        main = Markup(render_template('sell_tickets.html', game=game, app_session=app_session))
        return render_template('layout.html', main=main, app_session=app_session)

    # process a submitted form for selling tickets
    elif request.method == 'POST':

        # get the information we need from the form
        try:
            user_id = request.form['user_id']
            game_id = request.form['game_id']
            section =  request.form['section']
            row = request.form['row']
            price = request.form['price']
            seat = int(request.form['first_seat'])
            num_seats = int(request.form['num_seats'])
            img = request.files['img']

        except:
            msg = "sell_tickets(): bad form data"
            flash(msg)
            return redirect(url_for('game', game_id=game_id))

        # ok, got the info
        # add the tickets to the database
        try:
            ticket_lot = Ticket_Lot(
                user_id = user_id,
                game_id = game_id,
                section =  section,
                row = row,
                price = price,
                img_path = None
            )
            db_session.add( ticket_lot)
            db_session.commit()
            if img:
                img_type = imghdr.what(img)
                if img_type in ['jpeg', 'png']:
                    # Unlike in all the examples on the Flask website,
                    # the path must be relative to the website root in order
                    # for img.save() to work.  This makes sense to me, but 
                    # why do the examples have a leading '/' ?
                    # http://flask.pocoo.org/docs/0.10/quickstart/#file-uploads
                    # http://flask.pocoo.org/docs/0.10/patterns/fileuploads/
                    img_dir = mount_point + '/static/images/tickets/'
                    img_file = 'ticket_lot_%d.%s' % (ticket_lot.id, img_type)
                    ticket_lot.img_path = img_dir + img_file
                    img.save(ticket_lot.img_path)

            for j in range(num_seats):
                db_session.add( Ticket(
                    lot = ticket_lot,
                    seat = seat + j
                ))
            db_session.commit()

        except:
            flash("sell_tickets(): could not commit transaction")
            return redirect(url_for('game', game_id=game_id))
            
        # redirect to the game page where
        # the newly added tickets should be visible
        return redirect(url_for('game', game_id=game_id))



#---------------------------------------------------------------------------------------------
# TICKETS VIEWS
# 
# ticket_lot() returns a page showing the group of tickets
# that are being offered for sale together.


# HTML
#
@app.route(mount_point + '/ticket_lot/<int:item_id>')
def ticket_lot(item_id):
    ticket_lot = db_session.query(Ticket_Lot).filter_by(id=item_id).one()
    # TODO: edit tiket_lot.html to display tickets image
    main = Markup(render_template('ticket_lot.html',
      ticket_lot=ticket_lot, app_session=app_session))
    return render_template('layout.html', main=main, app_session=app_session)


# JSON
# 
@app.route(mount_point + '/ticket_lot/<int:item_id>/JSON')
def ticket_lot_json(item_id):
    ticket_lot = db_session.query(Ticket_Lot).filter_by(id=item_id).one()
    return jsonify(ticket_lot.to_dict())


# XML
# 
@app.route(mount_point + '/ticket_lot/<int:item_id>/XML')
def ticket_lot_xml(item_id):
    ticket_lot = db_session.query(Ticket_Lot).filter_by(id=item_id).one()
    return xmlify(ticket_lot.to_dict())



#---------------------------------------------------------------------------------------------
# Edit Tickets

# I decided that the only thing it made sense to edit was the price.
# If any of the other stuff is wrong, the ticket_lot can be deleted
# and replaced.


@app.route(mount_point + '/ticket_lot/<int:item_id>/edit', methods=['GET', 'POST'])
@check_authentication("You must be logged in to edit tickets!")
@check_authorization("You cannot edit another user's tickets!", Ticket_Lot, 'ticket_lot')
def edit_tickets(item_id, item):

    ticket_lot = item
    #ticket_lot = db_session.query(Ticket_Lot).filter_by(id=item_id).one()

    if request.method == 'GET':
        main = Markup(render_template(
            'edit_tickets.html', ticket_lot=ticket_lot, app_session=app_session))
        return render_template('layout.html', main=main, app_session=app_session)

    elif request.method == 'POST':

    # TODO: 
    # Handle uploaded ticket image.
    # Add image to the static dir.
    # Add image url to db entry.

        try:
            ticket_lot.price = request.form['price']
            if request.files.has_key('img'):
                img = request.files['img']
                img_type = imghdr.what(img)
                if img_type in ['jpeg', 'png']:
                    # Unlike in all the examples on the Flask website,
                    # the path must be relative to the website root in order
                    # for img.save() to work.  This makes sense to me, but 
                    # why do the examples have a leading '/' ?
                    # http://flask.pocoo.org/docs/0.10/quickstart/#file-uploads
                    # http://flask.pocoo.org/docs/0.10/patterns/fileuploads/
                    img_dir = mount_point + '/static/images/tickets/'
                    img_file = 'ticket_lot_%d.%s' % (ticket_lot.id, img_type)
                    ticket_lot.img_path = img_dir + img_file
                    img.save(ticket_lot.img_path)

            db_session.commit()
        except:
            msg = "edit_tickets(): could not commit transaction"
            flash(msg)
            return redirect(url_for('ticket_lot', item_id=item_id))
            
        return redirect(url_for('game', game_id=ticket_lot.game_id))



#---------------------------------------------------------------------------------------------
# DELETE TICKETS
# 

@app.route(mount_point + '/ticket_lot/<int:item_id>/delete', methods=['GET', 'POST'])
@check_authentication("You must be logged in to delete tickets!")
@check_authorization("You cannot delete another user's tickets!", Ticket_Lot, 'ticket_lot')
def delete_tickets(item_id, item):

    ticket_lot = item

    if request.method == 'GET':
        main = Markup(render_template(
            'delete_tickets.html', ticket_lot=ticket_lot, app_session=app_session))
        return render_template('layout.html', main=main, app_session=app_session)

    elif request.method == 'POST':

        img_path = ticket_lot.img_path
        print img_path
        if img_path:
            os.remove(img_path)
        game_id = ticket_lot.game_id
        print "game_id: %d" % game_id
        for ticket in ticket_lot.tickets:
            db_session.delete(ticket)
            db_session.delete(ticket_lot)
        try:
            db_session.commit()
        except:
            print "delete_tickets(): could not commit transaction"
            flash("delete_tickets(): could not commit transaction")
            return redirect(url_for('ticket_lot', item_id=item_id))

        flash("Tickets successfully deleted.")
        return redirect(url_for('game', game_id=game_id))


#---------------------------------------------------------------------------------------------
# DELETE IMAGE 

@app.route(mount_point + '/ticket_lot/<int:item_id>/delete_image', methods=['GET', 'POST'])
@check_authentication("You must be logged in to delete ticket image!")
@check_authorization("You cannot delete another user's ticket image!", Ticket_Lot, 'ticket_lot')
def delete_image(item_id, item):

    ticket_lot = item

    if request.method == 'GET':
        main = Markup(render_template(
            'delete_image.html', ticket_lot=ticket_lot, app_session=app_session))
        return render_template('layout.html', main=main, app_session=app_session)

    elif request.method == 'POST':

        try:
            os.remove(ticket_lot.img_path)
            ticket_lot.img_path = None
            db_session.commit()
        except:
            print "delete_image(): could not commit transaction"
            flash("delete_image(): could not commit transaction")
            return redirect(url_for('ticket_lot', item_id=item_id))

        flash("Ticket image successfully deleted.")
        return redirect(url_for('ticket_lot', item_id=item_id))


 
#---------------------------------------------------------------------------------------------
# USERS VIEW


# Users
# 
@app.route(mount_point + '/users')
def users():
    users = db_session.query(User).all()
    return render_template('users.html', users=users)


#---------------------------------------------------------------------------------------------
# USER VIEWS


# HTML
# 
@app.route(mount_point + '/users/<int:user_id>')
def user(user_id):
    user = db_session.query(User).filter_by(id=user_id).one()
    main = Markup(render_template('user.html', user=user))
    return render_template('layout.html', main=main, app_session=app_session)


# JSON
# 
@app.route(mount_point + '/users/<int:user_id>/JSON')
def user_json(user_id):
    user = db_session.query(User).filter_by(id=user_id).one()
    return jsonify(user.to_dict())


# XML
# 
@app.route(mount_point + '/users/<int:user_id>/XML')
def user_xml(user_id):
    user = db_session.query(User).filter_by(id=user_id).one()
    return xmlify(user.to_dict())


#---------------------------------------------------------------------------------------------

# generate a random secret key
app.secret_key = ''.join(random.choice(
    string.ascii_uppercase + string.digits) for x in xrange(32))

app.debug = False
print >> sys.stderr, 'tickets app loaded.'
print >> sys.stderr, app

#---------------------------------------------------------------------------------------------
# Start the server

if __name__ == '__main__':
    print startup_info

    app.run(host='0.0.0.0', port=5000)
