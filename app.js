var express = require('express'),
    http = require('http'),
    path = require('path'),
    util = require("util"),
    Steam = require("./MatchProvider-steam").MatchProvider,
    FileStorage = require("./MatchProvider-file").MatchProvider,
    config = require("./config");

var app = express(),
    steam = new Steam(
        config.steam_user,
        config.steam_pass,
        config.steam_name,
        config.steam_guard_code,
        config.cwd,
        config.steam_response_timeout),
    fileStorage = new FileStorage(config.cwd + 'urlcache.txt');

// all environments
app.set('port', 3100);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
// if ('development' == app.get('env')) {
//   app.use(express.errorHandler());
// }

app.get('/', function (req, res) {
    res.redirect("/matchurls");
});

app.get('/matchurls', function (req, res) {
    var matchId = req.query.matchid;
    if (!matchId) {
        // No match ID, display regular index.
        res.render('index', {
            replayUrl: 'match urls!'
        });
        res.end();
    }
    if (!isNaN(matchId) && parseInt(matchId, 10) < 1024000000000) {
        matchId = parseInt(matchId, 10);
        fileStorage.findByMatchId(matchId, function (err, data) {
            if (err) throw err;

            if (data) {
                res.render('index', {
                    title: 'match urls!',
                    replayUrl: util.format("http://replay%s.valve.net/570/%s_%s.dem.bz2", data.cluster, data.id, data.salt)
                });
                res.end();
            }
            else if (steam.ready) {
                // We need new data from Dota.
                steam.getMatchDetails(matchId, function (err, data) {
                    if (err) {
                        res.render('index', {
                            title: 'match urls!',
                            replayUrl: err
                        });
                        res.end();
                    } else {
                        fileStorage.save({cluster: data.cluster, id: data.id, salt: data.salt});
                        res.render('index', {
                            title: 'match urls!',
                            matchid: matchId,
                            replayState: data.state,
                            replayUrl: util.format("http://replay%s.valve.net/570/%s_%s.dem.bz2", data.cluster, data.id, data.salt)
                        });
                        res.end();
                    }
                });

                // If Dota hasn't responded by 'request_timeout' then send a timeout page.
                setTimeout(function () {
                    res.render('index', {
                        title: 'match urls!',
                        replayUrl: "timeout"
                    });
                    res.end();
                }, config.request_timeout);
            } else {
                // We need new data from Dota, and Dota is not ready.
                res.render('index', {
                    title: 'match urls!',
                    replayUrl: "notready"
                });
                res.end();
            }
        });
    } else {
        // Match ID failed validation.
        res.render('index', {
            title: 'match urls!',
            replayUrl: "invalid"
        });
        res.end();
    }
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});