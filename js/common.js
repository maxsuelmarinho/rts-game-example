/*
(function() {
    var lastTime = 0;
    var vendors = ['ms', ';', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || 
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currentTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currentTime - lastTime));
            var id = window.setTimeout(function() {
                callback(currentTime + timeToCall);
            }, timeToCall);

            lastTime = currentTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
*/

var loader = {
  loaded: true,
  loadedCount: 0, // assets that have been loaded so far
  totalCount: 0, // total number of assets to load

  init: function() {
    // check for sound support
    var mp3Support, oggSupport;
    var audio = document.createElement("audio");
    if (audio.canPlayType) {
      // currently canPlayType() returns: "", "maybe", or "probably"
      mp3Support = "" !== audio.canPlayType("audio/mpeg");
      oggSupport = "" !== audio.canPlayType('audio/ogg; codecs="vorbis"');
    } else {
      // the audio tag is not supported
      mp3Support = false;
      oggSupport = false;
    }

    // check for ogg, then mp3, and finally set soundFileExtn to undefined
    loader.soundFileExtn = oggSupport
      ? ".ogg"
      : mp3Support
      ? ".mp3"
      : undefined;
  },

  loadImage: function(url) {
    this.loaded = false;
    this.totalCount++;

    //$('#loadingscreen').show();
    game.showScreen("loadingscreen");

    var image = new Image();

    //image.onload = loader.itemLoaded;
    image.addEventListener("load", loader.itemLoaded, false);
    image.src = url;

    return image;
  },

  soundFileExtn: ".ogg",

  loadSound: function(url) {
    this.loaded = false;
    this.totalCount++;

    //$('#loadingscreen').show();
    game.showScreen("loadingscreen");

    var audio = new Audio();

    audio.addEventListener("canplaythrough", loader.itemLoaded, false);
    audio.src = url + loader.soundFileExtn;

    return audio;
  },

  itemLoaded: function(ev) {
    // stop listening for event type (load or canplaythrough) for this item now that it has been loaded
    ev.target.removeEventListener(ev.type, loader.itemLoaded, false);

    loader.loadedCount++;

    //$('#loadingmessage').html('Loaded ' + loader.loadedCount + ' of ' + loader.totalCount);
    document.getElementById("loadingmessage").innerHTML =
      "Loaded " + loader.loadedCount + " of " + loader.totalCount;

    if (loader.loadedCount === loader.totalCount) {
      // loader has loaded completely
      // reset and clear the loader
      loader.loaded = true;
      loader.loadedCount = 0;
      loader.totalCount = 0;

      //$('#loadingscreen').hide();
      game.hideScreen("loadingscreen");

      if (loader.onload) {
        loader.onload();
        loader.onload = undefined;
      }
    }
  }
};

// the default load() method used by all our game entities
function loadItem(name) {
  console.log("loadItem", name);
  var item = this.list[name];

  // if the sprite array has already been loaded, then no need to do it again
  if (item.spriteArray) {
    return;
  }

  item.spriteSheet = loader.loadImage(
    "images/" + this.defaults.type + "/" + name + ".png"
  );
  item.spriteArray = [];
  item.spriteCount = 0;

  item.spriteImages.forEach(function(spriteImage) {
    let constructImageCount = spriteImage.count;
    let constructDirectionCount = spriteImage.directions;

    if (constructDirectionCount) {
      // if the spriteImage has directions defined, store sprites for each direction in spriteArray
      for (let i = 0; i < constructDirectionCount; i++) {
        let constructImageName = spriteImage.name + "-" + i;

        item.spriteArray[constructImageName] = {
          name: constructImageName,
          count: constructImageCount,
          offset: item.spriteCount
        };
        item.spriteCount += constructImageCount;
      }
    } else {
      // if the spriteImage has no directions, store just the name and image count in spriteArray
      let constructImageName = spriteImage.name;

      item.spriteArray[constructImageName] = {
        name: constructImageName,
        count: constructImageCount,
        offset: item.spriteCount
      };

      item.spriteCount += constructImageCount;
    }
  });
}

// Polyfill for a few browsers that still do not support Object.assign
if (typeof Object.assign !== "function") {
  Object.assign = function(target, varArgs) {
    // .length of function is 2
    "use strict";
    if (target === null) {
      // TypeError if undefined or null
      throw new TypeError("Cannot convert undefined or null to object");
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) {
        // skip over if undefined or null
        for (var nextKey in nextSource) {
          // avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }

    return to;
  };
}

// the default add() method used by all our game entities
function addItem(details) {
  var name = details.name;

  // initialize the item with any default properties the item should have
  var item = Object.assign({}, baseItem);
  // assign the item all the default properties for its category type
  Object.assign(item, this.defaults);
  // assign item properties based on the item name
  Object.assign(item, this.list[name]);

  // by default, set the item's life to its maximum hit points
  item.life = item.hitPoints;

  // override item defaults based on details
  Object.assign(item, details);

  return item;
}

// default properties that every item should have
var baseItem = {
  animationIndex: 0,
  direction: 0,

  selected: false,
  selectable: true,

  orders: { type: "stand" },
  action: "stand",

  // default method for animating an item
  animate: function() {
    // check the health of the item
    if (this.life > this.hitPoints * 0.4) {
      // consider item healthy if it has more than 40% life
      this.lifeCode = "healthy";
    } else if (this.life > 0) {
      // consider item damaged if it has less than 40% life
      this.lifeCode = "damaged";
    } else {
      // remove item from the game if it has died (life is 0 or negative)
      this.lifeCode = "dead";
      game.remove(this);

      return;
    }

    // process the current action
    this.processActions();
  },

  // default method for drawing an item
  draw: function() {
    // compute pixel coordinates on canvas for drawing item
    this.drawingX = this.x * game.gridSize - game.offsetX - this.pixelOffsetX;
    this.drawingY = this.y * game.gridSize - game.offsetY - this.pixelOffsetY;

    // adjust based on interpolation factor
    if (this.canMove) {
      this.drawingX +=
        this.lastMovementX * game.drawingInterpolationFactor * game.gridSize;
      this.drawingY +=
        this.lastMovementY * game.drawingInterpolationFactor * game.gridSize;
    }

    if (this.selected) {
      this.drawSelection();
      this.drawLifeBar();
    }

    this.drawSprite();
  },

  // Selection related properties
  selectionBorderColor: "rgba(255,255,0,0.5)",
  selectionFillColor: "rgba(255,215,0,0.2)",
  lifeBarBorderColor: "rgba(0,0,0,0.8)",
  lifeBarHealthyFillColor: "rgba(0,255,0,0.5)",
  lifeBarDamagedFillColor: "rgba(255,0,0,0.5)",

  lifeBarHeight: 5,

  // movement-related properties
  speedAdjustmentFactor: 1 / 64,
  turnSpeedAdjustmentFactor: 1 / 8,

  // finds the angle toward a destination in terms of a direction (0 <= angle < directions)
  findAngle: function(destination) {
    var dy = destination.y - this.y;
    var dx = destination.x - this.x;

    // convert Arctan to value between (0 - directions)
    var angle =
      this.directions / 2 -
      (Math.atan2(dx, dy) * this.directions) / (2 * Math.PI);

    angle = (angle + this.directions) % this.directions;

    return angle;
  },

  // return the smallest difference (between -directions / 2 and +directions / 2) toward newDirection [-4 - +4]
  angleDiff: function(newDirection) {
    let currentDirection = this.direction;
    let directions = this.directions;

    // make both directions between -directions / 2 and +directions / 2
    if (currentDirection >= directions / 2) {
      currentDirection -= directions;
    }

    if (newDirection >= directions / 2) {
      newDirection -= directions;
    }

    var difference = newDirection - currentDirection;

    // ensure difference is also between -directions/2 and +directions/2
    if (difference < -directions / 2) {
      difference += directions;
    }

    if (difference > directions / 2) {
      difference -= directions;
    }

    return difference;
  },

  turnTo: function(newDirection) {
    // calculate differnce between new direction and current direction
    let difference = this.angleDiff(newDirection);

    // calculate maximum amount that aircraft can turn per animation cycle
    let turnAmount = this.turnSpeed * this.turnSpeedAdjustmentFactor;

    if (Math.abs(difference) > turnAmount) {
      // change direction by turn amount
      this.direction += (turnAmount * Math.abs(difference)) / difference;

      // ensure direction doesn't go below 0 or above this.directions
      this.direction = (this.direction + this.directions) % this.directions;

      this.turning = true;
    } else {
      this.direction = newDirection;
      this.turning = false;
    }
  }
};

/*
// finds the angle between two objects in terms of a direction
// where 0 <= angle < directions

// returns the smallest difference
// value ranging between -directions / 2 to +directions / 2
function angleDiff(angle1, angle2, directions) {
    if (angle1 >= directions / 2) {
        angle1 = angle1 - directions;
    }

    if (angle2 >= directions / 2) {
        angle2 = angle2 - directions;
    }

    diff = angle2 - angle1;

    if (diff < -directions / 2) {
        diff += directions;
    }

    if (diff > directions / 2) {
        diff -= directions;
    }

    return diff;
}

// wrap value of direction so that it lies between 0 and directions - 1
function wrapDirection(direction, directions) {
    if (direction < 0) {
        direction += directions;
    }

    if (direction >= directions) {
        direction -= directions;
    }

    return direction;
}
*/
