/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        init: function() {
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));
            console.log("computer fleet initialisée avec succès.", this.fleet);

            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },
        play: function() {
            var self = this;
            setTimeout(() => {
                var col = Math.floor(Math.random() * 10);
                var row = Math.floor(Math.random() * 10);
                this.game.fire(this, col, row, (hasSucceeded) => {
                    self.tries[row][col] = hasSucceeded;
        
                    var audioFile = hasSucceeded ? './js/sounds/hit.mp3' : './js/sounds/miss.mp3';
                    var audio = new Audio(audioFile);
                    audio.play().catch(e => console.error("Erreur lors de la lecture de l'audio: ", e));
                });
            }, 20);
        },   
        areShipsOk: function (callback) {
            var i = 0;
            var j;

            this.fleet[i].forEach(function (ship, i) {
                j = 0;
                while (j < ship.life) {
                    this.grid[i][j] = ship.getId();
                    j += 1;
                }
            }, this);

            setTimeout(function () {
                callback();
            }, 500);
        },    
        placeShipsAutomatically: function() {
            this.fleet.forEach((ship, index) => {
                this.activeShip = index;
                var placed = false;
        
                while (!placed) {
                    var orientation = Math.random() < 0.5 ? 'vertical' : 'horizontal';
                    ship.setDirection(orientation);
        
                    var maxCol = orientation === 'horizontal' ? 10 - ship.getLife() : 9;
                    var maxRow = orientation === 'vertical' ? 10 - ship.getLife() : 9;
        
                    var col = Math.floor(Math.random() * (maxCol + 1));
                    var row = Math.floor(Math.random() * (maxRow + 1));
        
                    placed = this.setActiveShipPosition(col, row);
                    if (placed) {
                        console.log(`Le navire ${ship.getName()} a été placé à la position (${col}, ${row}) avec orientation ${orientation}.`);
                    } else {
                        console.log(`Impossible de placer ${ship.getName()} à la position (${col}, ${row}) avec orientation ${orientation}.`);
                    }
                }
            });
            // Affichage de la grille pour vérification
            console.log("Grille de l'ordinateur après placement des navires :");
            this.grid.forEach((row) => {
                let rowDisplay = row.map(cell => cell === 0 ? 'O' : 'X').join('');
                console.log(rowDisplay);
            });
        }
        
    });

    global.computer = computer;

}(this));