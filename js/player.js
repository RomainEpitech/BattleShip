/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
    "use strict";

    var ship = { dom: { parentNode: { removeChild: function () { } } } };

    var player = {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        activeShip: 0,
        shotCount: 0,
        init: function () {
            // créé la flotte
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));
            console.log("player fleet initialisée avec succès.", this.fleet);

            // créé les grilles
            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },
        play: function (col, line) {
            this.game.fire(this, col, line, _.bind(function (hasSucced) {
                this.tries[line][col] = hasSucced;
                    var audioFile = hasSucced ? './js/sounds/hit.mp3' : './js/sounds/miss.mp3';
                    var audio = new Audio(audioFile);

                    if (hasSucced) {
                        this.shotCount = 0;
                    } else {
                        this.shotCount = this.shotCount + 1;
                        console.log(this.shotCount);
                    }
                    audio.play().catch(e => console.error("Erreur lors de la lecture de l'audio: ", e));
            }, this));
        },
        // quand il est attaqué le joueur doit dire si il a un bateaux ou non à l'emplacement choisi par l'adversaire
        receiveAttack: function (col, line, callback) {
            var succeed = false;

            if (this.grid[line][col] !== 0) {
                succeed = true;
                this.grid[line][col] = 0;
            }
            callback.call(undefined, succeed);
        },
        setActiveShipPosition: function(x, y) {
            var ship = this.fleet[this.activeShip];
            var life = ship.getLife();
            var isVertical = ship.direction === 'vertical';
            var gridSize = this.grid.length;
            var offset = Math.floor(life / 2);

            if (isVertical) {
                // Pour le placement vertical, ajustez y au lieu de x
                var startY = y - offset;
                if (startY < 0 || startY + life > gridSize || x < 0 || x >= gridSize) {
                    console.log("Boat out of grid !");
                    return false;
                }
                for (var i = 0; i < life; i++) {
                    if (this.grid[startY + i][x] !== 0) {
                        console.log("Boats are collapsing !");
                        return false;
                    }
                }
                for (var i = 0; i < life; i++) {
                    this.grid[startY + i][x] = ship.getId();
                }
            } else {
                // Placement horizontal, comme précédemment
                var startX = x - offset;
                if (startX < 0 || startX + life > gridSize || y < 0 || y >= gridSize) {
                    console.log("Boat out of grid !");
                    return false;
                }
                for (var i = 0; i < life; i++) {
                    if (this.grid[y][startX + i] !== 0) {
                        console.log("Boats are collapsing !");
                        return false;
                    }
                }
                for (var i = 0; i < life; i++) {
                    this.grid[y][startX + i] = ship.getId();
                }
            }
            
            return true;
        },
        clearPreview: function () {
            this.fleet.forEach(function (ship) {
                if (ship.dom.parentNode) {
                    ship.dom.parentNode.removeChild(ship.dom);
                }
            });
        },
        resetShipPlacement: function () {
            this.clearPreview();

            this.activeShip = 0;
            this.grid = utils.createGrid(10, 10);
        },
        activateNextShip: function () {
            if (this.activeShip < this.fleet.length - 1) {
                this.activeShip += 1;
                return true;
            } else {
                return false;
            }
        },
        renderTries: function (grid) {
            this.tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector('.row:nth-child(' + (rid + 1) + ') .cell:nth-child(' + (col + 1) + ')');

                    if (val === true) {
                        node.style.backgroundColor = '#e60019';
                    } else if (val === false) {
                        node.style.backgroundColor = '#aeaeae';
                    }
                });
            });
        },
        renderShips: function (grid) {
        },        
        setGame: function (gameInstance) {
            this.game = gameInstance;
        },
        isShipOk: function (callback) {
            var allShipsPlacedCorrectly = true;
            var gridSize = this.grid.length;

            this.fleet.forEach(function (ship) {
                var x = ship.x || 0;
                var y = ship.y || 0;
                var life = ship.getLife();

                if (x < 0 || y < 0 || x + life > gridSize || y + life > gridSize) {
                    allShipsPlacedCorrectly = false;
                }
            });

            callback(allShipsPlacedCorrectly);
        }
    };

    global.player = player;

}(this));