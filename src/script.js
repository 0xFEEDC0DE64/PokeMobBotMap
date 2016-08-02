var websocketAddress = ((window.location.protocol === "https:") ? "wss:" : "ws:") + "//" + window.location.host + "/websocket";

if (typeof String.prototype.contains === 'undefined') {
    String.prototype.contains = function(it) {
        return this.indexOf(it) != -1;
    };
}

var TeamColor = { Neutral: 0, Blue: 1, Red: 2, Yellow: 3 };
var FortRenderingType = { Default: 0, InternalTest: 1 };
var FortSponsor = { UnsetSponsor: 0, Mcdonalds: 1, PokemonStore: 2 };
var FortType = { Gym: 0, Checkpoint: 1 };

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        settings: {
            draggable: false
        }
    });

    var playerMarker = new google.maps.Marker({
        map: map
    });

    var fortPath = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    var playerPos;
    var fortPathTarget;
    var fortMarkers;
    var intervalId;

    var handleMessage = function(e) {
        var message = JSON.parse(e.data);
        var type = message.$type;
        if(type.contains('UpdatePositionEvent')) {
            var pos = {lat: message.Latitude, lng: message.Longitude};
            if(playerPos.lat == 0 && playerPos.lng == 0) {
                map.setCenter(pos);
                playerMarker.setPosition(pos);
            }
            playerPos = pos;
        } else if(type.contains('PokeStopListEvent')) {
            var now = new Date();
            for(var i in message.Forts.$values) {
                var fort = message.Forts.$values[i];

                if(!(fort.Id in fortMarkers)) {
                    fortMarkers[fort.Id] = new google.maps.Marker({
                        map: map
                    });
                }

                fortMarkers[fort.Id].setPosition({lat: fort.Latitude, lng: fort.Longitude});
                if(fort.Type == FortType.Gym) {
                    if(fort.OwnedByTeam == TeamColor.Neutral) {
                        fortMarkers[fort.Id].setIcon('img/' + (fort.IsInBattle ? 'gym_neutral_battle.png' : 'gym_neutral.png'));
                    } else if(fort.OwnedByTeam == TeamColor.Red) {
                        fortMarkers[fort.Id].setIcon('img/' + (fort.IsInBattle ? 'gym_red_battle.png' : 'gym_red.png'));
                    } else if(fort.OwnedByTeam == TeamColor.Blue) {
                        fortMarkers[fort.Id].setIcon('img/' + (fort.IsInBattle ? 'gym_blue_battle.png' : 'gym_blue.png'));
                    } else if(fort.OwnedByTeam == TeamColor.Yellow) {
                        fortMarkers[fort.Id].setIcon('img/' + (fort.IsInBattle ? 'gym_yellow_battle.png' : 'gym_yellow.png'));
                    } else {
                        console.warn('Unknown FortData.OwnedByTeam: ' + fort.OwnedByTeam);
                    }
                } else if(fort.Type == FortType.Checkpoint) {
                    fortMarkers[fort.Id].lure = fort.LureInfo == null;
                    if(new Date(fort.CooldownCompleteTimestampMs) < now) {
                        fortMarkers[fort.Id].setIcon('img/' + (fortMarkers[fort.Id].lure ? 'pokestop.png' : 'pokestop_lure.png'));
                    } else {
                        fortMarkers[fort.Id].setIcon('img/' + (fortMarkers[fort.Id].lure ? 'pokestop_cooldown.png' : 'pokestop_cooldown_lure.png'));
                    }
                } else {
                    console.warn('Unknown FortData.Type: ' + fort.Type);
                }
            }
        } else if(type.contains("FortTargetEvent")) {
            fortPath.setMap(map);
            fortPathTarget = { lat: message.Latitude, lng: message.Longitude };
            fortPath.setPath([
                { lat: playerMarker.position.lat(), lng: playerMarker.position.lng() },
                fortPathTarget
            ]);
        } else if(type.contains("FortUsedEvent")) {   
            fortPath.setMap(null);
            fortPathTarget = null;

            fortMarkers[message.Id].setIcon('img/' + (fortMarkers[message.Id].lure ? 'pokestop_cooldown.png' : 'pokestop_cooldown_lure.png'));
        } /* else {
            console.warn('Unknown message: ' + message['$type']);
            console.warn(message);
        } */
    };

    var connect = function() {
        var ws = new WebSocket(websocketAddress);
        ws.onopen = function() {
            map.setCenter(null);
            map.setZoom(17);
            playerMarker.setPosition(null);

            playerPos = { lat: 0, lng: 0 };
            fortPathTarget = null;
            fortMarkers = {};

            intervalId = setInterval(function(){
                var oldPos = playerMarker.position;
                var newPos = {
                    lat: ((oldPos.lat() * 30) + playerPos.lat) / 31,
                    lng: ((oldPos.lng() * 30) + playerPos.lng) / 31
                };
                map.setCenter(newPos);
                playerMarker.setPosition(newPos);
                if(fortPathTarget != null) {
                    fortPath.setPath([
                        newPos,
                        fortPathTarget
                    ]);
                }
            }, 50);
        };
        ws.onclose = function() {
            console.log("onclose");

            clearInterval(intervalId);

            setTimeout(connect, 500);
        };
        ws.onmessage = handleMessage;
    };
    connect();
}