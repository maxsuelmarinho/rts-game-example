var sidebar = {
    animate: function() {
        // display the current cash balance value
        $('#cash').html(game.cash[game.team]);

        // enable or disable buttons as appropriate
        this.enableSidebarButtons();
    },

    enableSidebarButtons: function() {
        // Buttons only enabled when appropriate building is selected
        $("#gameinterfacescreen #sidebarbuttons input[type='button']").attr("disabled", true);

        // if no building selected, then no point checking below
        if (game.selectedItems.length == 0) {
            return;
        }

        var baseSelected = false;
        var starportSelected = false;
        for (var i = game.selectedItems.length - 1; i >= 0; i--) {
            var item = game.selectedItems[i];
            // Check if player selected a healthy, inactive building
            // (damaged buildings can't produce)
            if (item.type == "buildings" && item.team == game.team &&
                item.lifeCode == "healthy" && item.action == "stand") {

                if (item.name == "base") {
                    baseSelected = true;
                } else if (item.name == "starport") {
                    starportSelected = true;
                }
            }
        }

        var cashBalance = game.cash[game.team];
        // Enable building buttons if base selected, building has been loaded in requirements,
        // not in deploy building mode and player has enough money
        if (baseSelected && !game.deployBuilding) {
            if (game.currentLevel.requirements.buildings.indexOf('starport') > -1 &&
                cashBalance >= buildings.list["starport"].cost) {
                console.log("enable starport button");
                $("#starportbutton").removeAttr("disabled");
            }

            if (game.currentLevel.requirements.buildings.indexOf('ground-turret') > -1 &&
                cashBalance >= buildings.list["ground-turret"].cost) {
                console.log("enable turret button");
                $("#turretbutton").removeAttr("disabled");
            }
        }

        // Enable unit buttons if starport is selected, unit has been loaded in requirements,
        // and player has enough money
        if (starportSelected) {
            if (game.currentLevel.requirements.vehicles.indexOf('scout-tank') > -1 &&
                cashBalance >= vehicles.list["scout-tank"].cost) {

                $("#scouttankbutton").removeAttr("disabled");
            }

            if (game.currentLevel.requirements.vehicles.indexOf('heavy-tank') > -1 &&
                cashBalance >= vehicles.list["heavy-tank"].cost) {

                $("#heavytankbutton").removeAttr("disabled");
            }

            if (game.currentLevel.requirements.vehicles.indexOf('harvester') > -1 &&
                cashBalance >= vehicles.list["harvester"].cost) {

                $("#harvesterbutton").removeAttr("disabled");
            }

            if (game.currentLevel.requirements.aircraft.indexOf('chopper') > -1 &&
                cashBalance >= aircraft.list["chopper"].cost) {

                $("#chopperbutton").removeAttr("disabled");
            }

            if (game.currentLevel.requirements.aircraft.indexOf('wraith') > -1 &&
                cashBalance >= aircraft.list["wraith"].cost) {

                $("#wraithbutton").removeAttr("disabled");
            }
        }
    },
}