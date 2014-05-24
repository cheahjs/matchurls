var fs = require('fs');

MatchProvider = function(filename) {
    this.filename = filename;
};


MatchProvider.prototype.findByMatchId = function(matchId, callback) {
    if (!fs.existsSync(this.filename)) fs.appendFileSync(this.filename, '');
    var file = fs.readFileSync(this.filename, {encoding: 'utf8'});
    var lines = file.split('\n');
    var ind;
    var found = false;
    for (ind = 0; ind < lines.length; ind++) {
        if (lines[ind].length < 3)
            continue;
        var parts = lines[ind].split('|');
        if (parts[0] == matchId) {
            callback(null, {cluster: parts[1], id: parts[0], salt: parts[3]});
            found = true;
            break;
        }
    }
    // we didn't find anything
    if (!found) callback(null, null);
};

MatchProvider.prototype.save = function(matches, callback) {
    var append = matches.id + '|' + matches.cluster + '|' + matches.id + '|' + matches.salt + '\n';
    fs.appendFile(this.filename, append, function (err) {
        if (err) callback(err);
        console.log('we appended to file with new data.');
    })
};

exports.MatchProvider = MatchProvider;