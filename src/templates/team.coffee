
teams: [

  oklahoma: {
    name: "University of Oklahoma"
    knickname: "Sooners"
    logo: "ou.png"
    },
    
  baylor: {
    name: "Baylor University"
    knickname: "Bears"
    logo: "bears.png"
    },
    
  texas: {
    name: "University of Texas"
    knickname: "Longhorns"
    logo: "horns.png"
    games: [
      {
        opponent: baylor
        home_team: texas
        date: "September 24"
      },
      {
        opponent: oklahoma
        home_team: oklahoma
        date: "October 7"


home_game_template = """
  <a class="game-a" href="/tickets/game?game_id={{ game.id }}">
  <span class="schedule-home-span">
    <img class="schedule-team-logo" src="{{  }}">
    {{game.visiting_team.name}}
    {{game.date.strftime("%a %b %d")}}
  </span>
  </a> <br>
"""

html_template = """
  <div class="box">
    <img class="team-logo" src="{{ logo }}">
    <h3 class="team-name"> {{ name }} {{ nickname }} </h3>

    <p class="schedule-p">
      {{# games }}
      {% if team == game.home_team %}
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
