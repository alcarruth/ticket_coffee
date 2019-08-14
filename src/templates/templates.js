#!/usr/bin/env coffee
#
#

templates =

  conference: '''
<h1 class="main-h1"> Step 2 - Pick a Game: </h1>
<div class="controls-div">
  <p>
    {{conference.name}} schedules - home games in bold
  </p>
</div>

{% for team in conference.teams %}

<div class="box">

  <img class="team-logo"
       src="{{ url_for('static', filename=team.logo) }}">
  <h3 class="team-name"> {{team.name}} {{team.nickname}} </h3>

  <p class="schedule-p">
    {% for game in team.schedule() %}
    {% if team == game.home_team %}
    <a class="game-a" href="{{ url_for('game', game_id=game.id) }}">
      <span class="schedule-home-span">
        <img class="schedule-team-logo"
             src="{{ url_for('static', filename=game.visiting_team.logo) }}">
        {{game.visiting_team.name}} <!-- {{game.visiting_team.nickname}} --> 
        {{game.date.strftime("%a %b %d")}}
      </span>
    </a> <br>
    {% else %}
    <a class="game-a" href="{{ url_for('game', game_id=game.id) }}">
      <span class="schedule-away-span">
        <img class="schedule-team-logo"
             src="{{ url_for('static', filename=game.home_team.logo) }}">
        {{game.home_team.name}} <!-- {{game.home_team.nickname}} -->
        {{game.date.strftime("%a %b %d")}}
      </span>
    </a> <br>
    {% endif %}
    {% endfor %}
  </p> <!-- schedule-p -->

</div>

{% endfor %}
'''


  conferences: '''
<h1 class="main-h1"> Step 1 - Pick a Conference:</h1>
<div class="controls-div">
</div>

{% for conference in conferences %}

<div class="conference-box">
  <a class="conference-a"
     href="{{ url_for('conference', conference=conference.abbrev_name) }}">

    <h3> {{conference.name}} </h3>
    <p>
      {% for team in conference.teams %}
      <img class="team-logo-img" src="{{ url_for("static", filename=team.logo) }}">
      <span class="team-name-span"> {{team.name}} {{team.nickname}} </span> <br>
      {% endfor %}
    </p>
  </a>
</div>

{% endfor %}
'''

 delete_image: '''
<div id="game-heading">
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.visiting_team.logo) }}">
    {{ticket_lot.game.visiting_team.name}}
    <!-- {{ticket_lot.game.visiting_team.nickname}} -->
  </div>
  <div class="game-at">
    at
  </div>
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.home_team.logo) }}">
    {{ticket_lot.game.home_team.name}}
    <!-- {{ticket_lot.game.home_team.nickname}} -->
  </div>
</div> <!-- game-heading -->

<h3> {{ticket_lot.game.date.strftime("%A %B %d, %Y")}} </h3>


<div class="game-tickets">
  Are you sure you want to delete the image for these tickets? <br>
  <form action="{{ url_for('delete_image', item_id=ticket_lot.id)}}" method = "POST">
    Section: {{ticket_lot.section}} <br>
    Row: {{ticket_lot.row}} <br>
    First seat: {{ticket_lot.seats()[0]}} <br>
    Number of seats: {{ticket_lot.num_seats()}} <br>
    Price per ticket: {{ticket_lot.price}} <br>
    {% if ticket_lot.img_path %}
    <div class="full-row">
      <img class="tickets-img"
           src="{{ url_for('static', filename=ticket_lot.img_path) }}">
    </div>
    {% endif %}
    <input type="hidden" name="_csrf_token" value="{{ csrf_token() }}">
    <input type="hidden" name="game_id" value="{{ticket_lot.game.id}}">
    <input type="hidden" name="user_id" value="{{app_session['user_id']}}">
    <input type="submit" value="Confirm Delete Image">
  </form>
</div> <!-- game-tickets -->
'''


 delete_tickets: '''
<div id="game-heading">
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.visiting_team.logo) }}">
    {{ticket_lot.game.visiting_team.name}}
    <!-- {{ticket_lot.game.visiting_team.nickname}} -->
  </div>
  <div class="game-at">
    at
  </div>
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', ticket_lot.game.home_team.logo) }}">
    {{ticket_lot.game.home_team.name}}
    <!-- {{ticket_lot.game.home_team.nickname}} -->
  </div>
</div> <!-- game-heading -->

<h3> {{ticket_lot.game.date.strftime("%A %B %d, %Y")}} </h3>


<div class="game-tickets">
  Are you sure you want to delete these tickets? <br>
  <form action="{{ url_for('delete_tickets', item_id=ticket_lot.id)}}" method = "POST">
    Section: {{ticket_lot.section}} <br>
    Row: {{ticket_lot.row}} <br>
    First seat: {{ticket_lot.seats()[0]}} <br>
    Number of seats: {{ticket_lot.num_seats()}} <br>
    Price per ticket: {{ticket_lot.price}} <br>
    {% if ticket_lot.img_path %}
    <div class="full-row">
      <img class="tickets-img"
           src="{{ url_for('static', filename=ticket_lot.img_path) }}">
    </div>
    {% endif %}
    <input type="hidden" name="_csrf_token" value="{{ csrf_token() }}">
    <input type="hidden" name="game_id" value="{{ticket_lot.game.id}}">
    <input type="hidden" name="user_id" value="{{app_session['user_id']}}">
    <input type="submit" value="Confirm Delete">
  </form>
</div> <!-- game-tickets -->
'''


 edit_tickets: '''
<div id="game-heading">
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.visiting_team.logo) }}">
    {{ticket_lot.game.visiting_team.name}}
    <!-- {{ticket_lot.game.visiting_team.nickname}} -->
  </div>
  <div class="game-at">
    at
  </div>
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.home_team.logo) }}">
    {{ticket_lot.game.home_team.name}}
    <!-- {{ticket_lot.game.home_team.nickname}} -->
  </div>
</div> <!-- game-heading -->

<h3> {{ticket_lot.game.date.strftime("%A %B %d, %Y")}} </h3>

<div class="game-tickets">
  <form method="post"
        action="{{ url_for('edit_tickets', item_id=ticket_lot.id)}}"
        enctype="multipart/form-data">
    Section: {{ticket_lot.section}} <br>
    Row: {{ticket_lot.row}} <br>
    First seat: {{ticket_lot.seats()[0]}} <br>
    Number of seats: {{ticket_lot.num_seats()}} <br>
    Price per ticket:
    <input type="text" maxlength="10" name="price" value="{{ticket_lot.price}}"> <br>
    Image: <input type="file" name="img" accept="image/*"> <br>
    <input type="hidden" name="_csrf_token" value="{{ csrf_token() }}">
    <input type="hidden" name="game_id" value="{{ticket_lot.game.id}}">
    <input type="hidden" name="user_id" value="{{app_session['user_id']}}">
    <input type="submit" value="Submit">
  </form>
</div> <!-- game-tickets -->
'''

 game_tickets: '''
<div id="game-heading">
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=game.visiting_team.logo) }}">
    {{game.visiting_team.name}}
    <!-- {{game.visiting_team.nickname}} -->
  </div>
  <div class="game-at">
    at
  </div>
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=game.home_team.logo) }}">
    {{game.home_team.name}}
    <!-- {{game.home_team.nickname}} -->
  </div>
</div> <!-- game-heading -->

<h3> {{game.date.strftime("%A %B %d, %Y")}} </h3>

<div class="full-row">
  <p> Want to sell tickets to this game? Click here: 
    <a class="sell-tickets-a" href="{{ url_for('game', game_id=game.id) + '/sell' }}">
      <button> Sell Tickets </button>
    </a>
  </p>
</div>

<div class="game-tickets">
  <table class="tickets">
    <tr class="ticket-lot">
      <th class="section"> Section </th>
      <th class="row"> Row </th>
      <th class="seats"> Sets </th>
      <th class="price"> Price (ea) </th>
    </tr>
    {% for ticket_lot in game.ticket_lots %}
    <tr class="ticket-lot">
      <td class="section"> Section {{ticket_lot.section}} </td>
      <td class="row"> Row {{ticket_lot.row}} </td>
      <td class="seats"> {{ticket_lot.seats_str()}} </td>
      <td class="price"> ${{ticket_lot.price}} </td>
      <td class="view-button">
        <a class="ticket-lot-a" href="{{ url_for('ticket_lot', item_id=ticket_lot.id) }}">
          <button> View Tickets </button>
        </a>
      </td>
    </tr>
    {% endfor %}
  </table>
</div> <!-- game-tickets -->
'''


 landing: '''
<h1 class="main-h1"> Welcome to Tickets'R'Us </h1>
<h2 class="main-h2"> Step 1 - Pick a Conference </h2>
<h2 class="main-h2"> Step 2 - Pick a Team </h2>
<h2 class="main-h2"> Step 3 - Pick a Game </h2>
<div class="controls-div">
</div>
'''


 layout: '''<!DOCTYPE=html>
<html>
  <head>
    <meta charset="UTF-8">
    <title> {{title}} </title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style/tickets.css') }}">
    <script src="{{ url_for('static', filename='images.js') }}" async >  </script>
    <script src="{{ url_for('static', filename='image_elements.js') }}" async >  </script>
    <!--
    <script src="{{ url_for('static', filename='images.zip') }}" async >  </script>
    <script src="/js/jszip.min.js"> </script>
        -->
    {% if google_sign_in %}
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"> </script>
    <script src="//apis.google.com/js/platform.js?onload=start"> </script>
    {% endif %}  
  </head>

  <body>

    <div id="container">

      <div id="header">

        <div id="header-title-div">
          <h1 id="header-title-h1">
            <a id="title-a" href="{{ url_for('conferences') }}"> Tickets 'R' Us </a>
          </h1>
          <p>
            Buy and Sell College Football Tickets!
          </p>
        </div>

        <div id="header-login-div">

          {% if 'login' in app_session %}
          {% set user_id = app_session.get('user_id') %}
          {% set user_name = app_session.get('user_name') %}

          <a class="header-login-a" href="{{ url_for('user', user_id=user_id) }}">
            {{ user_name }} </a>
          <a class="header-login-a" href="{{ url_for('disconnect') }}"> 
            <button> Logout </button> </a>

          {% else %}

          <a class="header-login-a" href="{{ url_for('login') }}">
            <button> Login </button> </a>

          {% endif %}
        </div>

        <p class="flash-messages">
          {% for message in get_flashed_messages() %}
          {{ message }}<br>
          {% endfor %}
        </p> <!-- flash-messages -->

      </div> <!-- header -->


      <div id="main">
        {{main}}
      </div> <!-- main -->


      <div id="footer">
        {{footer}}
      </div>  <!-- footer -->

    </div> <!-- container -->

  </body>

</html>
'''

 login: '''<!DOCTYPE=html>

<html>
<head>
    <meta charset="UTF-8">
    <title> {{title}} </title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style/tickets.css') }}">
    {% if google_sign_in %}
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"> </script>
    <script src="//apis.google.com/js/platform.js?onload=start"> </script>
    {% endif %}  
</head>

<body>

<div id="container">

    <div id="header">
        <h1 id="header-title-h1">
            <a id="title-a" href="{{ url_for('conferences') }}"> Tickets 'R' Us </a>
        </h1>
        <div id="header-login-div">
            <p>
                {% for message in get_flashed_messages() %}
                {{ message }}<br>
                {% endfor %}
            </p>
        </div>
    </div> <!-- header -->

    <div id="main">
        <div>
            <h1> Login via Google or Facebook </h1>
            <!-- GOOGLE PLUS SIGN IN-->

            <div id="signInButton">
                <span class="g-signin"
                      data-scope="openid email"
                      data-clientid="{{google_app_id}}"
                      data-redirecturi="postmessage"
                      data-accesstype="offline"
                      data-cookiepolicy="single_host_origin"
                      data-callback="signInCallback"
                      data-approvalprompt="force">
                </span>
            </div>

            <div id="result"></div>
            
            <script>
                {{google_connect_js}}
            </script>

            <!--END GOOGLE PLUS SIGN IN -->

            <!--FACEBOOK SIGN IN -->
            <div id="fb-root"></div>
            <!--
            <script async defer src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2&appId=907786629329598&autoLogAppEvents=1"></script>

            <div class="fb-login-button"
                 data-size="medium"
                 data-button-type="continue_with"
                 data-auto-logout-link="false"
                 data-use-continue-as="false">
            </div>
            -->
            <script>
              {{fb_connect_js}}
            </script>
            <fb:login-button
              scope=""
              onlogin="sendTokenToServer();">
              <a href='javascript:sendTokenToServer()'>Login with Facebook</a>
            </fb:login-button>
            <!--END FACEBOOK SIGN IN -->
            
            <div class="rant">
                <p>
                    Notice how the Facebook login button messes up my layout?
                    Reload this page and see how it jumps around.
                    What's up with that?  
                </p>
                <p>
                    The fb javascript code for the button creates some
                    weird hidden &lt;iframe&gt;s and they
                    don't seem to play well with flex-box.
                    Is that really necessary?  Why can't I have a simple
                    button with a simple onclick function? C'mon Facebook!
                </p>
            </div>
        </div>
    </div> <!-- main -->

</div> <!-- container -->

</body>

</html>
'''

 sell_tickets: '''
<div id="game-heading">
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=game.visiting_team.logo) }}">
    {{game.visiting_team.name}}
    <!-- {{game.visiting_team.nickname}} -->
  </div>
  <div class="game-at">
    at
  </div>
  <div class="game-team">
    <img class="team-logo"
         src="{{ url_for('static', filename=game.home_team.logo) }}">
    {{game.home_team.name}}
    <!-- {{game.home_team.nickname}} -->
  </div>
</div> <!-- game-heading -->

<h3> {{game.date.strftime("%A %B %d, %Y")}} </h3>

<div class="game-tickets">
  <form method="post"
        action="{{ url_for('sell_tickets', game_id=game.id)}}"
        enctype="multipart/form-data">
    Section: <input type="text" maxlength="10" name="section"> <br>
    Row: <input type="text" maxlength="10" name="row"> <br>
    First seat: <input type="text" maxlength="10" name="first_seat"> <br>
    Number of seats: <input type="text" maxlength="10" name="num_seats"> <br>
    Price per ticket: <input type="text" maxlength="10" name="price"> <br>
    Image: <input type="file" name="img" accept="image/*"> <br>
    <input type="hidden" name="_csrf_token" value="{{ csrf_token() }}">
    <input type="hidden" name="game_id" value="{{game.id}}">
    <input type="hidden" name="user_id" value="{{app_session['user_id']}}">
    <input type="submit" value="Submit">
  </form>
</div> <!-- game-tickets -->
'''



 ticket_lot: '''
 <div class="controls-div">

  <h3>
    <a href="{{ url_for('game', game_id=ticket_lot.game.id) }}">
      {{ticket_lot.game.visiting_team.name}}
      at 
      {{ticket_lot.game.home_team.name}}
  </h3>
  <p> 
    {{ticket_lot.game.date.strftime("%A %B %d, %Y")}} <br>
    Price each: ${{ticket_lot.price}} <br>
    Seller: <a href="{{ url_for('user', user_id=ticket_lot.seller.id) }}"> 
      {{ticket_lot.seller.name}} </a> <br>
    Contact: <a href="mailto:{{ticket_lot.seller.email}}">
      {{ticket_lot.seller.email}} </a>
  </p>
</div>

<div class="controls-div">
  {% if ticket_lot.user_id==app_session['user_id'] %}

  <p> <a class="sell-tickets-a" href="{{ url_for('ticket_lot', item_id=ticket_lot.id) + '/edit' }}">
      <button> Edit Tickets </button> </a> </p>
  
  {% if ticket_lot.img_path %}
  <p> <a class="sell-tickets-a" href="{{ url_for('ticket_lot', item_id=ticket_lot.id) + '/delete_image' }}" method="Post">
      <button> Delete Image </button> </a> </p>
  {% endif %}

  <p> <a class="sell-tickets-a" href="{{ url_for('ticket_lot', item_id=ticket_lot.id) + '/delete' }}">
      <button> Delete Tickets </button> </a> </p>
  {% endif %}
</div>

{% if ticket_lot.img_path %}

<img class="tickets-img"
     src="{{ url_for('static', filename=ticket_lot.img_path) }}">

{% else %}

{% for ticket in ticket_lot.tickets %}
<div class="ticket">
  <div class="college-football">
    College Football
  </div>
  <div class="team" class="visiting">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.visiting_team.logo) }}">
    <span class="team-name">
      {{ticket_lot.game.visiting_team.name}}
      {{ticket_lot.game.visiting_team.nickname}}
    </span>
  </div>
  <div class="at"> at </div>
  <div class="team" class="home">
    <img class="team-logo"
         src="{{ url_for('static', filename=ticket_lot.game.home_team.logo) }}">
    <span class="team-name">
      {{ticket_lot.game.home_team.name}}
      {{ticket_lot.game.home_team.nickname}}
    </span>
  </div>
  <div class="date">
    {{ticket_lot.game.date}}
  </div>
  <div class="seat">
    <p class="seat">
      Sec: {{ticket_lot.section}} 
      Row: {{ticket_lot.row}} <br>
      Seat: {{ticket.seat}}
    </p>
  </div>
</div>

{% endfor %}

{% endif %}
'''


 user: '''
<div id="user-div">
  <h1>  
    {{user.name}} <br>
    {{user.email}}
  </h1>

  <div class="game-tickets">
    <table class="tickets">
      <tr class="ticket-lot">
        <th> Game </th>
        <th> Date </th>
        <th class="section"> Section </th>
        <th class="row"> Row </th>
        <th class="seats"> Seats </th>
        <th class="price"> Price (ea) </th>
      </tr>
      {% for ticket_lot in user.ticket_lots %}
      <tr class="ticket-lot">
        <td class="game">
          {{ticket_lot.game.visiting_team.name}} @ {{ticket_lot.game.home_team.name}} </td>
        <td class="date"> {{ticket_lot.game.date}} </td>
        <td class="section"> {{ticket_lot.section}} </td>
        <td class="row"> {{ticket_lot.row}} </td>
        <td class="seats"> {{ticket_lot.seats_str()}} </td>
        <td class="price"> ${{ticket_lot.price}} </td>
        <td class="view-button">
          <a class="ticket-lot-a"
             href="{{ url_for('ticket_lot', item_id=ticket_lot.id) }}">
            <button> View Tickets </button>
          </a>
        </td>
      </tr>
      {% endfor %}
    </table>
  </div> <!-- game-tickets -->
</div> <!-- user-div -->
'''

 
if window
  window.templates = templates

else
  exports.templates = templates
  
