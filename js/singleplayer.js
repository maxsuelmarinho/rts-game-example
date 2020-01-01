var singleplayer = {
  // begin single player campaign
  start: function() {
    // hide the starting menu screen
    game.hideScreens();

    // begin with the first level
    singleplayer.currentLevel = 0;

    // start initializing the level
    singleplayer.initLevel();
  },

  currentLevel: 0,
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

    game.createTerrainGrid();

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
    // display the main game menu
    game.hideScreens();
    game.showScreen("gamestartscreen");
  },

  play: function() {
    // run the animation loop once
    game.animationLoop();

    // start the animation loop interval
    game.animationInterval = setInterval(
      game.animationLoop,
      game.animationTimeout
    );

    game.start();
  },

  sendCommand: function(uids, details) {
    // we could save commands to replay saved games
    game.processCommand(uids, details);
  },

  endLevel: function(success) {
    clearInterval(game.animationInterval);
    game.end();

    if (success) {
      let moreLevels =
        singleplayer.currentLevel < levels.singleplayer.length - 1;

      if (moreLevels) {
        // message
      } else {
        // message
      }
    } else {
      // message
    }
  }
};
