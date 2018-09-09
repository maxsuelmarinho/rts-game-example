var singleplayer = {
    start: function() {
        $('.gamelayer').hide();

        singleplayer.currentLevel = 0;
        game.type = "singleplayer";
        game.team = "blue";

        singleplayer.startCurrentLevel();
    },
    
    exit: function() {
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
    },

    currentLevel: 0,

    startCurrentLevel: function() {
        var level = maps.singleplayer[singleplayer.currentLevel];

        $('#entermission').attr('disabled', true);

        game.currentMapImage = loader.loadImage(level.mapImage);
        game.currentLevel = level;

        if (loader.loaded) {
            $('#entermission').removeAttr('disabled');
        } else {
            loader.onload = function() {
                $('entermission').removeAttr('disabled');
            }
        }

        $('#missionbriefing').html(level.briefing.replace(/\n/g, '<br>'));
        $('#missionscreen').show();
    },
};