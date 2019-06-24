var singleplayer = {
    currentLevel: 0,

    start: function() {
        //$('.gamelayer').hide();
        game.hideScreens();

        // begin with the first level
        singleplayer.currentLevel = 0;
        
        //singleplayer.startCurrentLevel();
        // start initializing the level
        singleplayer.initLevel();
    },

    initLevel: function() {
        game.type = "singleplayer";
        game.team = "blue";

        // don't allow player to enter mission until all assets for the level are loaded
        var enterMissionButton = document.getElementById("entermission");
        enterMissionButton.disabled = true;

        // load all the items for the level
        var level = levels.singleplayer[singleplayer.currentLevel];
        game.loadLevelData(level);

        // set player starting location
        game.offsetX = level.startX * game.gridSize;
        game.offsetY = level.startY * game.gridSize;

        // enable the enter mission button once all assets are loaded
        loader.onload = function() {
            enterMissionButton.disabled = false;
        };

        // update the mission briefing text and show briefing screen
        this.showMissionBriefing(level.briefing);
    },

    showMissionBriefing: function(briefing) {
        var missionBriefingText = document.getElementById("missionbriefing");

        // replace \n in briefing text with two <br> to create next paragraph
        missionBriefingText.innerHTML = briefing.replace("/\n/g", "<br><br>");

        // display the mission briefing screen
        game.showScreen("missionbriefingscreen");
    },    
    
    exit: function() {        
        //$('.gamelayer').hide();
        //$('#gamestartscreen').show();
        
        // display the main game menu
        game.hideScreens();
        game.showScreen("gamestartscreen");
    },

    startCurrentLevel: function() {
        var level = maps.singleplayer[singleplayer.currentLevel];

        $('#entermission').attr('disabled', true);

        game.currentMapImage = loader.loadImage(level.mapImage);
        game.currentLevel = level;

        game.offsetX = level.startX * game.gridSize;
        game.offsetY = level.startY * game.gridSize;

        // load level requirements
        game.resetArrays();
        for (var type in level.requirements) {
            var requirementArray = level.requirements[type];
            for (var i = 0; i < requirementArray.length; i++) {
                var name = requirementArray[i];
                if (window[type]) {
                    window[type].load(name);
                } else {
                    console.log('Could not load type:', type);
                }
            }
        }

        for (var i = level.items.length - 1; i >= 0; i--) {
            var itemDetails = level.items[i];
            game.add(itemDetails);
        }

        // create a grid that stores all obstructed tiles as 1 and unobstructed as 0
        game.currentMapTerrainGrid = [];
        for (var y = 0; y < level.mapGridHeight; y++) {
            game.currentMapTerrainGrid[y] = [];
            for (var x = 0; x < level.mapGridWidth; x++) {
                game.currentMapTerrainGrid[y][x] = 0;
            }
        }

        for (var i = level.mapObstructedTerrain.length - 1; i >= 0; i--) {
            var obstruction = level.mapObstructedTerrain[i];
            game.currentMapTerrainGrid[obstruction[1]][obstruction[0]] = 1;
        }
        game.currentMapPassableGrid = undefined;

        // load starting cash for game
        console.log("cash", level.cash);
        game.cash = $.extend([], level.cash);

        if (loader.loaded) {
            $('#entermission').removeAttr('disabled');
        } else {
            loader.onload = function() {
                $('#entermission').removeAttr('disabled');
            }
        }

        $('#missionbriefing').html(level.briefing.replace(/\n/g, '<br>'));
        $('#missionscreen').show();
    },

    play: function() {
        // run the animation loop once
        game.animationLoop();
        
        // start the animation loop interval
        game.animationInterval = setInterval(game.animationLoop, game.animationTimeout);

        game.start();
    },

    sendCommand: function(uids, details) {
        game.processCommand(uids, details);
    }
};