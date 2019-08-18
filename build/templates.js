(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["conference.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Step 2 - Pick a Game: </h1>\n<div class=\"controls-div\">\n  <p>\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "conference")),"name"), env.opts.autoescape);
output += " schedules - home games in bold\n  </p>\n</div>\n\n";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "conference")),"teams");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("team", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n\n<div class=\"box\">\n\n  <img class=\"team-logo\"\n       src=\"";
output += runtime.suppressValue((lineno = 13, colno = 22, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((t_4),"logo")})])), env.opts.autoescape);
output += "\">\n  <h3 class=\"team-name\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"name"), env.opts.autoescape);
output += " ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"nickname"), env.opts.autoescape);
output += " </h3>\n\n  <p class=\"schedule-p\">\n    ";
frame = frame.push();
var t_7 = (lineno = 17, colno = 32, runtime.callWrap(runtime.memberLookup((t_4),"schedule"), "team[\"schedule\"]", context, []));
if(t_7) {t_7 = runtime.fromIterator(t_7);
var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("game", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n    ";
if(t_4 == runtime.memberLookup((t_8),"home_team")) {
output += "\n    <a class=\"game-a\" href=\"";
output += runtime.suppressValue((lineno = 19, colno = 38, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((t_8),"id")})])), env.opts.autoescape);
output += "\">\n      <span class=\"schedule-home-span\">\n        <img class=\"schedule-team-logo\"\n             src=\"";
output += runtime.suppressValue((lineno = 22, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"name"), env.opts.autoescape);
output += " <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"visiting_team")),"nickname"), env.opts.autoescape);
output += " --> \n        ";
output += runtime.suppressValue((lineno = 24, colno = 28, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((t_8),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%a %b %d"])), env.opts.autoescape);
output += "\n      </span>\n    </a> <br>\n    ";
;
}
else {
output += "\n    <a class=\"game-a\" href=\"";
output += runtime.suppressValue((lineno = 28, colno = 38, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((t_8),"id")})])), env.opts.autoescape);
output += "\">\n      <span class=\"schedule-away-span\">\n        <img class=\"schedule-team-logo\"\n             src=\"";
output += runtime.suppressValue((lineno = 31, colno = 28, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n        ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"name"), env.opts.autoescape);
output += " <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_8),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n        ";
output += runtime.suppressValue((lineno = 33, colno = 28, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((t_8),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%a %b %d"])), env.opts.autoescape);
output += "\n      </span>\n    </a> <br>\n    ";
;
}
output += "\n    ";
;
}
}
frame = frame.pop();
output += "\n  </p> <!-- schedule-p -->\n\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["conferences.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Step 1 - Pick a Conference:</h1>\n<div class=\"controls-div\">\n</div>\n\n";
frame = frame.push();
var t_3 = runtime.contextOrFrameLookup(context, frame, "conferences");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("conference", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n\n<div class=\"conference-box\">\n  <a class=\"conference-a\"\n     href=\"";
output += runtime.suppressValue((lineno = 9, colno = 21, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["conference",runtime.makeKeywordArgs({"conference": runtime.memberLookup((t_4),"abbrev_name")})])), env.opts.autoescape);
output += "\">\n\n    <h3> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"name"), env.opts.autoescape);
output += " </h3>\n    <p>\n      ";
frame = frame.push();
var t_7 = runtime.memberLookup((t_4),"teams");
if(t_7) {t_7 = runtime.fromIterator(t_7);
var t_6 = t_7.length;
for(var t_5=0; t_5 < t_7.length; t_5++) {
var t_8 = t_7[t_5];
frame.set("team", t_8);
frame.set("loop.index", t_5 + 1);
frame.set("loop.index0", t_5);
frame.set("loop.revindex", t_6 - t_5);
frame.set("loop.revindex0", t_6 - t_5 - 1);
frame.set("loop.first", t_5 === 0);
frame.set("loop.last", t_5 === t_6 - 1);
frame.set("loop.length", t_6);
output += "\n      <img class=\"team-logo-img\" src=\"";
output += runtime.suppressValue((lineno = 14, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((t_8),"logo")})])), env.opts.autoescape);
output += "\">\n      <span class=\"team-name-span\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"name"), env.opts.autoescape);
output += " ";
output += runtime.suppressValue(runtime.memberLookup((t_8),"nickname"), env.opts.autoescape);
output += " </span> <br>\n      ";
;
}
}
frame = frame.pop();
output += "\n    </p>\n  </a>\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["delete_image.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n\n<div class=\"game-tickets\">\n  Are you sure you want to delete the image for these tickets? <br>\n  <form action=\"";
output += runtime.suppressValue((lineno = 24, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["delete_image",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\" method = \"POST\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n    <div class=\"full-row\">\n      <img class=\"tickets-img\"\n           src=\"";
output += runtime.suppressValue((lineno = 33, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n    </div>\n    ";
;
}
output += "\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 36, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Confirm Delete Image\">\n  </form>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["delete_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n\n<div class=\"game-tickets\">\n  Are you sure you want to delete these tickets? <br>\n  <form action=\"";
output += runtime.suppressValue((lineno = 24, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["delete_tickets",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\" method = \"POST\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n    <div class=\"full-row\">\n      <img class=\"tickets-img\"\n           src=\"";
output += runtime.suppressValue((lineno = 33, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n    </div>\n    ";
;
}
output += "\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 36, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Confirm Delete\">\n  </form>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["edit_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 36, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"game-tickets\">\n  <form method=\"post\"\n        action=\"";
output += runtime.suppressValue((lineno = 23, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["edit_tickets",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])), env.opts.autoescape);
output += "\"\n        enctype=\"multipart/form-data\">\n    Section: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " <br>\n    Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n    First seat: ";
output += runtime.suppressValue(runtime.memberLookup(((lineno = 27, colno = 34, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seats"), "ticket_lot[\"seats\"]", context, []))),0), env.opts.autoescape);
output += " <br>\n    Number of seats: ";
output += runtime.suppressValue((lineno = 28, colno = 43, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"num_seats"), "ticket_lot[\"num_seats\"]", context, [])), env.opts.autoescape);
output += " <br>\n    Price per ticket:\n    <input type=\"text\" maxlength=\"10\" name=\"price\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += "\"> <br>\n    Image: <input type=\"file\" name=\"img\" accept=\"image/*\"> <br>\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 32, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Submit\">\n  </form>\n</div> <!-- game-tickets -->\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["game_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 25, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"full-row\">\n  <p> Want to sell tickets to this game? Click here: \n    <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 23, colno = 46, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id")})])) + "/sell", env.opts.autoescape);
output += "\">\n      <button> Sell Tickets </button>\n    </a>\n  </p>\n</div>\n\n<div class=\"game-tickets\">\n  <table class=\"tickets\">\n    <tr class=\"ticket-lot\">\n      <th class=\"section\"> Section </th>\n      <th class=\"row\"> Row </th>\n      <th class=\"seats\"> Sets </th>\n      <th class=\"price\"> Price (ea) </th>\n    </tr>\n    ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"ticket_lots");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket_lot", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n    <tr class=\"ticket-lot\">\n      <td class=\"section\"> Section ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"section"), env.opts.autoescape);
output += " </td>\n      <td class=\"row\"> Row ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"row"), env.opts.autoescape);
output += " </td>\n      <td class=\"seats\"> ";
output += runtime.suppressValue((lineno = 41, colno = 47, runtime.callWrap(runtime.memberLookup((t_4),"seats_str"), "ticket_lot[\"seats_str\"]", context, [])), env.opts.autoescape);
output += " </td>\n      <td class=\"price\"> $";
output += runtime.suppressValue(runtime.memberLookup((t_4),"price"), env.opts.autoescape);
output += " </td>\n      <td class=\"view-button\">\n        <a class=\"ticket-lot-a\" href=\"";
output += runtime.suppressValue((lineno = 44, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((t_4),"id")})])), env.opts.autoescape);
output += "\">\n          <button> View Tickets </button>\n        </a>\n      </td>\n    </tr>\n    ";
;
}
}
frame = frame.pop();
output += "\n  </table>\n</div> <!-- game-tickets -->\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["landing.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<h1 class=\"main-h1\"> Welcome to Tickets'R'Us </h1>\n<h2 class=\"main-h2\"> Step 1 - Pick a Conference </h2>\n<h2 class=\"main-h2\"> Step 2 - Pick a Team </h2>\n<h2 class=\"main-h2\"> Step 3 - Pick a Game </h2>\n<div class=\"controls-div\">\n</div>\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["layout.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<!DOCTYPE=html>\n\n<html>\n  <head>\n    <meta charset=\"UTF-8\">\n    <title> ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "title"), env.opts.autoescape);
output += " </title>\n    <link rel=\"stylesheet\" href=\"";
output += runtime.suppressValue((lineno = 6, colno = 43, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "style/tickets.css"})])), env.opts.autoescape);
output += "\">\n    <script src=\"";
output += runtime.suppressValue((lineno = 7, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "images.js"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <script src=\"";
output += runtime.suppressValue((lineno = 8, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "image_elements.js"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <!--\n    <script src=\"";
output += runtime.suppressValue((lineno = 10, colno = 27, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "images.zip"})])), env.opts.autoescape);
output += "\" async >  </script>\n    <script src=\"/js/jszip.min.js\"> </script>\n        -->\n    ";
if(runtime.contextOrFrameLookup(context, frame, "google_sign_in")) {
output += "\n    <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js\"> </script>\n    <script src=\"//apis.google.com/js/platform.js?onload=start\"> </script>\n    ";
;
}
output += "  \n  </head>\n\n  <body>\n\n    <div id=\"container\">\n\n      <div id=\"header\">\n\n        <div id=\"header-title-div\">\n          <h1 id=\"header-title-h1\">\n            <a id=\"title-a\" href=\"";
output += runtime.suppressValue((lineno = 27, colno = 44, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["conferences"])), env.opts.autoescape);
output += "\"> Tickets 'R' Us </a>\n          </h1>\n          <p>\n            Buy and Sell College Football Tickets!\n          </p>\n        </div>\n\n        <div id=\"header-login-div\">\n\n          ";
if(runtime.inOperator("login",runtime.contextOrFrameLookup(context, frame, "app_session"))) {
output += "\n          ";
var t_1;
t_1 = (lineno = 37, colno = 42, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"get"), "app_session[\"get\"]", context, ["user_id"]));
frame.set("user_id", t_1, true);
if(frame.topLevel) {
context.setVariable("user_id", t_1);
}
if(frame.topLevel) {
context.addExport("user_id", t_1);
}
output += "\n          ";
var t_2;
t_2 = (lineno = 38, colno = 44, runtime.callWrap(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"get"), "app_session[\"get\"]", context, ["user_name"]));
frame.set("user_name", t_2, true);
if(frame.topLevel) {
context.setVariable("user_name", t_2);
}
if(frame.topLevel) {
context.addExport("user_name", t_2);
}
output += "\n\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 40, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["user",runtime.makeKeywordArgs({"user_id": runtime.contextOrFrameLookup(context, frame, "user_id")})])), env.opts.autoescape);
output += "\">\n            ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "user_name"), env.opts.autoescape);
output += " </a>\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 42, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["disconnect"])), env.opts.autoescape);
output += "\"> \n            <button> Logout </button> </a>\n\n          ";
;
}
else {
output += "\n\n          <a class=\"header-login-a\" href=\"";
output += runtime.suppressValue((lineno = 47, colno = 52, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["login"])), env.opts.autoescape);
output += "\">\n            <button> Login </button> </a>\n\n          ";
;
}
output += "\n        </div>\n\n        <p class=\"flash-messages\">\n          ";
frame = frame.push();
var t_5 = (lineno = 54, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "get_flashed_messages"), "get_flashed_messages", context, []));
if(t_5) {t_5 = runtime.fromIterator(t_5);
var t_4 = t_5.length;
for(var t_3=0; t_3 < t_5.length; t_3++) {
var t_6 = t_5[t_3];
frame.set("message", t_6);
frame.set("loop.index", t_3 + 1);
frame.set("loop.index0", t_3);
frame.set("loop.revindex", t_4 - t_3);
frame.set("loop.revindex0", t_4 - t_3 - 1);
frame.set("loop.first", t_3 === 0);
frame.set("loop.last", t_3 === t_4 - 1);
frame.set("loop.length", t_4);
output += "\n          ";
output += runtime.suppressValue(t_6, env.opts.autoescape);
output += "<br>\n          ";
;
}
}
frame = frame.pop();
output += "\n        </p> <!-- flash-messages -->\n\n      </div> <!-- header -->\n\n\n      <div id=\"main\">\n        ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "main"), env.opts.autoescape);
output += "\n      </div> <!-- main -->\n\n\n      <div id=\"footer\">\n        ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "footer"), env.opts.autoescape);
output += "\n      </div>  <!-- footer -->\n\n    </div> <!-- container -->\n\n  </body>\n\n</html>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["login.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<!DOCTYPE=html>\n\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title> ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "title"), env.opts.autoescape);
output += " </title>\n    <link rel=\"stylesheet\" href=\"";
output += runtime.suppressValue((lineno = 6, colno = 43, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": "style/tickets.css"})])), env.opts.autoescape);
output += "\">\n    ";
if(runtime.contextOrFrameLookup(context, frame, "google_sign_in")) {
output += "\n    <script src=\"//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js\"> </script>\n    <script src=\"//apis.google.com/js/platform.js?onload=start\"> </script>\n    ";
;
}
output += "  \n</head>\n\n<body>\n\n<div id=\"container\">\n\n    <div id=\"header\">\n        <h1 id=\"header-title-h1\">\n            <a id=\"title-a\" href=\"";
output += runtime.suppressValue((lineno = 19, colno = 44, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["conferences"])), env.opts.autoescape);
output += "\"> Tickets 'R' Us </a>\n        </h1>\n        <div id=\"header-login-div\">\n            <p>\n                ";
frame = frame.push();
var t_3 = (lineno = 23, colno = 54, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "get_flashed_messages"), "get_flashed_messages", context, []));
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("message", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n                ";
output += runtime.suppressValue(t_4, env.opts.autoescape);
output += "<br>\n                ";
;
}
}
frame = frame.pop();
output += "\n            </p>\n        </div>\n    </div> <!-- header -->\n\n    <div id=\"main\">\n        <div>\n            <h1> Login via Google or Facebook </h1>\n            <!-- GOOGLE PLUS SIGN IN-->\n\n            <div id=\"signInButton\">\n                <span class=\"g-signin\"\n                      data-scope=\"openid email\"\n                      data-clientid=\"";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "google_app_id"), env.opts.autoescape);
output += "\"\n                      data-redirecturi=\"postmessage\"\n                      data-accesstype=\"offline\"\n                      data-cookiepolicy=\"single_host_origin\"\n                      data-callback=\"signInCallback\"\n                      data-approvalprompt=\"force\">\n                </span>\n            </div>\n\n            <div id=\"result\"></div>\n            \n            <script>\n                ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "google_connect_js"), env.opts.autoescape);
output += "\n            </script>\n\n            <!--END GOOGLE PLUS SIGN IN -->\n\n            <!--FACEBOOK SIGN IN -->\n            <div id=\"fb-root\"></div>\n            <!--\n            <script async defer src=\"https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.2&appId=907786629329598&autoLogAppEvents=1\"></script>\n\n            <div class=\"fb-login-button\"\n                 data-size=\"medium\"\n                 data-button-type=\"continue_with\"\n                 data-auto-logout-link=\"false\"\n                 data-use-continue-as=\"false\">\n            </div>\n            -->\n            <script>\n              ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "fb_connect_js"), env.opts.autoescape);
output += "\n            </script>\n            <fb:login-button\n              scope=\"\"\n              onlogin=\"sendTokenToServer();\">\n              <a href='javascript:sendTokenToServer()'>Login with Facebook</a>\n            </fb:login-button>\n            <!--END FACEBOOK SIGN IN -->\n            \n            <div class=\"rant\">\n                <p>\n                    Notice how the Facebook login button messes up my layout?\n                    Reload this page and see how it jumps around.\n                    What's up with that?  \n                </p>\n                <p>\n                    The fb javascript code for the button creates some\n                    weird hidden &lt;iframe&gt;s and they\n                    don't seem to play well with flex-box.\n                    Is that really necessary?  Why can't I have a simple\n                    button with a simple onclick function? C'mon Facebook!\n                </p>\n            </div>\n        </div>\n    </div> <!-- main -->\n\n</div> <!-- container -->\n\n</body>\n\n</html>\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["sell_tickets.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"game-heading\">\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 4, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n  <div class=\"game-at\">\n    at\n  </div>\n  <div class=\"game-team\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 13, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"name"), env.opts.autoescape);
output += "\n    <!-- ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"home_team")),"nickname"), env.opts.autoescape);
output += " -->\n  </div>\n</div> <!-- game-heading -->\n\n<h3> ";
output += runtime.suppressValue((lineno = 19, colno = 25, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"date")),"strftime"), "game[\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " </h3>\n\n<div class=\"game-tickets\">\n  <form method=\"post\"\n        action=\"";
output += runtime.suppressValue((lineno = 23, colno = 26, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["sell_tickets",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id")})])), env.opts.autoescape);
output += "\"\n        enctype=\"multipart/form-data\">\n    Section: <input type=\"text\" maxlength=\"10\" name=\"section\"> <br>\n    Row: <input type=\"text\" maxlength=\"10\" name=\"row\"> <br>\n    First seat: <input type=\"text\" maxlength=\"10\" name=\"first_seat\"> <br>\n    Number of seats: <input type=\"text\" maxlength=\"10\" name=\"num_seats\"> <br>\n    Price per ticket: <input type=\"text\" maxlength=\"10\" name=\"price\"> <br>\n    Image: <input type=\"file\" name=\"img\" accept=\"image/*\"> <br>\n    <input type=\"hidden\" name=\"_csrf_token\" value=\"";
output += runtime.suppressValue((lineno = 31, colno = 64, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "csrf_token"), "csrf_token", context, [])), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"game_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "game")),"id"), env.opts.autoescape);
output += "\">\n    <input type=\"hidden\" name=\"user_id\" value=\"";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id"), env.opts.autoescape);
output += "\">\n    <input type=\"submit\" value=\"Submit\">\n  </form>\n</div> <!-- game-tickets -->\n\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["ticket_lot.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "<div class=\"controls-div\">\n\n  <h3>\n    <a href=\"";
output += runtime.suppressValue((lineno = 3, colno = 23, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["game",runtime.makeKeywordArgs({"game_id": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"id")})])), env.opts.autoescape);
output += "\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n      at \n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n  </h3>\n  <p> \n    ";
output += runtime.suppressValue((lineno = 9, colno = 35, runtime.callWrap(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date")),"strftime"), "ticket_lot[\"game\"][\"date\"][\"strftime\"]", context, ["%A %B %d, %Y"])), env.opts.autoescape);
output += " <br>\n    Price each: $";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"price"), env.opts.autoescape);
output += " <br>\n    Seller: <a href=\"";
output += runtime.suppressValue((lineno = 11, colno = 31, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["user",runtime.makeKeywordArgs({"user_id": runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"id")})])), env.opts.autoescape);
output += "\"> \n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"name"), env.opts.autoescape);
output += " </a> <br>\n    Contact: <a href=\"mailto:";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"email"), env.opts.autoescape);
output += "\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"seller")),"email"), env.opts.autoescape);
output += " </a>\n  </p>\n</div>\n\n<div class=\"controls-div\">\n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"user_id") == runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "app_session")),"user_id")) {
output += "\n\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 21, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/edit", env.opts.autoescape);
output += "\">\n      <button> Edit Tickets </button> </a> </p>\n  \n  ";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 25, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/delete_image", env.opts.autoescape);
output += "\" method=\"Post\">\n      <button> Delete Image </button> </a> </p>\n  ";
;
}
output += "\n\n  <p> <a class=\"sell-tickets-a\" href=\"";
output += runtime.suppressValue((lineno = 29, colno = 48, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"id")})])) + "/delete", env.opts.autoescape);
output += "\">\n      <button> Delete Tickets </button> </a> </p>\n  ";
;
}
output += "\n</div>\n\n";
if(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")) {
output += "\n\n<img class=\"tickets-img\"\n     src=\"";
output += runtime.suppressValue((lineno = 37, colno = 20, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"img_path")})])), env.opts.autoescape);
output += "\">\n\n";
;
}
else {
output += "\n\n";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"tickets");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n<div class=\"ticket\">\n  <div class=\"college-football\">\n    College Football\n  </div>\n  <div class=\"team\" class=\"visiting\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 48, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    <span class=\"team-name\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += "\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"visiting_team")),"nickname"), env.opts.autoescape);
output += "\n    </span>\n  </div>\n  <div class=\"at\"> at </div>\n  <div class=\"team\" class=\"home\">\n    <img class=\"team-logo\"\n         src=\"";
output += runtime.suppressValue((lineno = 57, colno = 24, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["static",runtime.makeKeywordArgs({"filename": runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"logo")})])), env.opts.autoescape);
output += "\">\n    <span class=\"team-name\">\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"name"), env.opts.autoescape);
output += "\n      ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"home_team")),"nickname"), env.opts.autoescape);
output += "\n    </span>\n  </div>\n  <div class=\"date\">\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"game")),"date"), env.opts.autoescape);
output += "\n  </div>\n  <div class=\"seat\">\n    <p class=\"seat\">\n      Sec: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"section"), env.opts.autoescape);
output += " \n      Row: ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "ticket_lot")),"row"), env.opts.autoescape);
output += " <br>\n      Seat: ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"seat"), env.opts.autoescape);
output += "\n    </p>\n  </div>\n</div>\n\n";
;
}
}
frame = frame.pop();
output += "\n\n";
;
}
output += "\n\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();
(function() {(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})["user.html"] = (function() {
function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n<div id=\"user-div\">\n  <h1>  \n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"name"), env.opts.autoescape);
output += " <br>\n    ";
output += runtime.suppressValue(runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"email"), env.opts.autoescape);
output += "\n  </h1>\n\n  <div class=\"game-tickets\">\n    <table class=\"tickets\">\n      <tr class=\"ticket-lot\">\n        <th> Game </th>\n        <th> Date </th>\n        <th class=\"section\"> Section </th>\n        <th class=\"row\"> Row </th>\n        <th class=\"seats\"> Seats </th>\n        <th class=\"price\"> Price (ea) </th>\n      </tr>\n      ";
frame = frame.push();
var t_3 = runtime.memberLookup((runtime.contextOrFrameLookup(context, frame, "user")),"ticket_lots");
if(t_3) {t_3 = runtime.fromIterator(t_3);
var t_2 = t_3.length;
for(var t_1=0; t_1 < t_3.length; t_1++) {
var t_4 = t_3[t_1];
frame.set("ticket_lot", t_4);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2 - t_1);
frame.set("loop.revindex0", t_2 - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2 - 1);
frame.set("loop.length", t_2);
output += "\n      <tr class=\"ticket-lot\">\n        <td class=\"game\">\n          ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"game")),"visiting_team")),"name"), env.opts.autoescape);
output += " @ ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((runtime.memberLookup((t_4),"game")),"home_team")),"name"), env.opts.autoescape);
output += " </td>\n        <td class=\"date\"> ";
output += runtime.suppressValue(runtime.memberLookup((runtime.memberLookup((t_4),"game")),"date"), env.opts.autoescape);
output += " </td>\n        <td class=\"section\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"section"), env.opts.autoescape);
output += " </td>\n        <td class=\"row\"> ";
output += runtime.suppressValue(runtime.memberLookup((t_4),"row"), env.opts.autoescape);
output += " </td>\n        <td class=\"seats\"> ";
output += runtime.suppressValue((lineno = 24, colno = 49, runtime.callWrap(runtime.memberLookup((t_4),"seats_str"), "ticket_lot[\"seats_str\"]", context, [])), env.opts.autoescape);
output += " </td>\n        <td class=\"price\"> $";
output += runtime.suppressValue(runtime.memberLookup((t_4),"price"), env.opts.autoescape);
output += " </td>\n        <td class=\"view-button\">\n          <a class=\"ticket-lot-a\"\n             href=\"";
output += runtime.suppressValue((lineno = 28, colno = 29, runtime.callWrap(runtime.contextOrFrameLookup(context, frame, "url_for"), "url_for", context, ["ticket_lot",runtime.makeKeywordArgs({"item_id": runtime.memberLookup((t_4),"id")})])), env.opts.autoescape);
output += "\">\n            <button> View Tickets </button>\n          </a>\n        </td>\n      </tr>\n      ";
;
}
}
frame = frame.pop();
output += "\n    </table>\n  </div> <!-- game-tickets -->\n</div> <!-- user-div -->\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};

})();
})();

