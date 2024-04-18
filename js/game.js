/*jslint browser this */
/*global _, player, computer, utils */

(function () {
    "use strict";

    var game = {
        PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
        PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
        PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
        PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
        PHASE_GAME_OVER: "PHASE_GAME_OVER",
        PHASE_WAITING: "waiting",

        currentPhase: "",
        phaseOrder: [],
        playerTurnPhaseIndex: 2,
        waiting: false,
        grid: null,
        miniGrid: null,
        select: null,
        submit: null,
        players: [],

        // lancement du jeu
        init: function () {
            this.grid = document.querySelector('.board .main-grid');
            this.miniGrid = document.querySelector('.mini-grid');
            this.select = document.querySelector('.select');
            this.submit = document.querySelector('.submit');

            this.submit.addEventListener('click', () => {
                var random = Math.floor(Math.random() * 2);

                if(this.select.value === "player" || random === 0) {
                    this.phaseOrder = [
                        this.PHASE_INIT_PLAYER,
                        this.PHASE_INIT_OPPONENT,
                        this.PHASE_PLAY_PLAYER,
                        this.PHASE_PLAY_OPPONENT,
                        this.PHASE_GAME_OVER
                    ];
                } else if (this.select.value === "computer" || random === 1) {
                    this.phaseOrder = [
                        this.PHASE_INIT_OPPONENT,
                        this.PHASE_INIT_PLAYER,
                        this.PHASE_PLAY_OPPONENT,
                        this.PHASE_PLAY_PLAYER,
                        this.PHASE_GAME_OVER
                    ];
                }

                this.playerTurnPhaseIndex = 2;

                this.setupPlayers();
                this.addListeners();
                this.goNextPhase();
            });
        },
        setupPlayers: function () {
            player.setGame(this);
            computer.setGame(this);
            this.players = [player, computer];
            this.players[0].init();
            this.players[1].init();
            this.players[1].placeShipsAutomatically();
        },
        goNextPhase: function () {
            var ci = this.phaseOrder.indexOf(this.currentPhase);
            var self = this;

            if (ci !== this.phaseOrder.length - 1) {
                this.currentPhase = this.phaseOrder[ci + 1];
            } else {
                this.currentPhase = this.phaseOrder[0];
            }

            console.log("Phase actuelle : " + this.currentPhase);

            switch (this.currentPhase) {
                case this.PHASE_GAME_OVER:
                    if (!this.gameIsOver()) {
                        this.currentPhase = this.phaseOrder[this.playerTurnPhaseIndex];
                        // console.log("Phase actuelle2 : " + this.currentPhase);
                        utils.info("A vous de jouer, choisissez une case !");
                    }
                    break;
                case this.PHASE_INIT_PLAYER:
                    utils.info("Placez vos bateaux");
                    break;
                case this.PHASE_INIT_OPPONENT:
                    this.wait();
                    utils.info("En attente de votre adversaire");
                    this.players[1].isShipOk(function () {
                        self.stopWaiting();
                        self.goNextPhase();
                    });
                    break;
                case this.PHASE_PLAY_PLAYER:
                    utils.info("A vous de jouer, choisissez une case !");
                    break;
                case this.PHASE_PLAY_OPPONENT:
                    utils.info("A votre adversaire de jouer...");
                    this.players[1].play();
                    break;
            }
        },
        gameIsOver: function () {
            var player = this.players[0];
            var computer = this.players[1];

            // Vérifier si tous les navires du joueur ont été coulés
            var gameOver = false;

            player.fleet.forEach(function (ship) {
                player.grid.forEach(function (row) {
                    row.forEach(function (cell) {
                        player.tries.forEach(function (row) {
                            row.forEach(function (cell) {
                                if (cell === ship.getId()) {
                                    gameOver = true;
                                }
                            });
                        });
                    });
                });
            });

            computer.fleet.forEach(function (ship) {
                computer.grid.forEach(function (row) {
                    row.forEach(function (cell) {
                        computer.tries.forEach(function (row) {
                            row.forEach(function (cell) {
                                if (cell === ship.getId()) {
                                    gameOver = true;
                                }
                            });
                        });
                    });
                });
            });

            if (gameOver) {
                utils.info("Perdu !");
                return true;
            }

            return gameOver;
        },
        getPhase: function () {
            if (this.waiting) {
                return this.PHASE_WAITING;
            }
            return this.currentPhase;
        },
        // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
        wait: function () {
            this.waiting = true;
        },
        // met fin au mode mode "attente"
        stopWaiting: function () {
            this.waiting = false;
        },
        addListeners: function () {
            // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
            this.grid.addEventListener('mousemove', _.bind(this.handleMouseMove, this));
            this.grid.addEventListener('click', _.bind(this.handleClick, this));
            this.grid.addEventListener('contextmenu', _.bind(this.handleEscape, this));
        },
        handleMouseMove: function (e) {
            if (this.getPhase() === this.PHASE_INIT_PLAYER && e.target.classList.contains('cell')) {
                var ship = this.players[0].fleet[this.players[0].activeShip];

                if (!ship.dom.parentNode) {
                    this.grid.appendChild(ship.dom);
                    ship.dom.style.zIndex = -1;
                }

                var adjustment = 0;
                if (ship.getLife() % 2 === 0 && ship.dom.classList.contains('rot')) {
                    adjustment = utils.CELL_SIZE / 2;
                }

                ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE - (600 + this.players[0].activeShip * 60) + adjustment + "px";
                ship.dom.style.left = "" + (utils.eq(e.target) * utils.CELL_SIZE) - (Math.floor(ship.getLife() / 2) * utils.CELL_SIZE) + adjustment + "px";
            }
        },
        handleEscape: function (e) {
            e.preventDefault();
            if (this.getPhase() === this.PHASE_INIT_PLAYER && e.target.classList.contains('cell')) {
                var ship = this.players[0].fleet[this.players[0].activeShip];
                var direction = ship.getDirection();
                ship.setDirection((direction === "vertical") ? "horizontal" : "vertical");

                ship.dom.classList.toggle("rot");

                var adjustment = 0;
                if (ship.getLife() % 2 === 0) {
                    adjustment = utils.CELL_SIZE / 2;
                }

                ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE - (600 + this.players[0].activeShip * 60) + adjustment + "px";
                ship.dom.style.left = "" + (utils.eq(e.target) * utils.CELL_SIZE) - (Math.floor(ship.getLife() / 2) * utils.CELL_SIZE) + adjustment + "px";
            }
        },
        handleClick: function (e) {
            // self garde une référence vers "this" en cas de changement de scope
            var self = this; 
            // si on a cliqué sur une cellule (délégation d'événement)
            if (e.target.classList.contains('cell')) {
                // si on est dans la phase de placement des bateau
                if (this.getPhase() === this.PHASE_INIT_PLAYER) {
                    // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
                    var x = utils.eq(e.target);
                    var y = utils.eq(e.target.parentNode);
                    var ship = this.players[0].fleet[this.players[0].activeShip];

                    if (ship.getLife() % 2 === 0 && ship.dom.classList.contains('rot')) {
                        y = y + 1;
                    }

                    if (this.players[0].setActiveShipPosition(x, y)) {
                        self.renderMiniMap();
                        // et on passe au bateau suivant (si il n'y en plus la fonction retournera false)
                        if (!this.players[0].activateNextShip()) {
                            this.wait();
                            utils.confirm("Confirmez le placement ?", function () {
                                // si le placement est confirmé
                                self.stopWaiting();
                                self.renderMiniMap();
                                self.players[0].clearPreview();
                                self.goNextPhase();
                            }, function () {
                                self.stopWaiting();
                                // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                                self.players[0].resetShipPlacement();
                            });
                        }
                    }
                    // si on est dans la phase de jeu (du joueur humain)
                } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
                    this.players[0].play(utils.eq(e.target), utils.eq(e.target.parentNode));
                }
            }
        },
        // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
        // pour placer un tir et obtenir de l'adversaire l'information de réusssite ou non du tir
        fire: function (from, col, line, callback) {
            this.wait();
            var self = this;
            var msg = "";
        
            var target = this.players.indexOf(from) === 0 ? this.players[1] : this.players[0];
            var attackerIndex = this.players.indexOf(from);
        
            target.receiveAttack(col, line, function (hasSucceed) {
                var gridToUpdate = attackerIndex === 0 ? self.grid : self.miniGrid;
                var cellSelector = `.row:nth-child(${line + 1}) .cell:nth-child(${col + 1})`;
                var cell = gridToUpdate.querySelector(cellSelector);
        
                if (hasSucceed) {
                    msg = "Touché !";
                    cell.style.backgroundImage = "url('./js/imgs/hit.gif')";
                    cell.style.backgroundSize = "cover";
                    setTimeout(() => {
                        cell.style.backgroundImage = "url('./js/imgs/hit.jpeg')";
                    }, 1000);
                } else {
                    msg = "Manqué...";
                    cell.style.backgroundImage = "url('./js/imgs/miss.gif')";
                    cell.style.backgroundSize = "cover";
                    setTimeout(() => {
                        cell.style.backgroundImage = "url('./js/imgs/miss.png')";
                    }, 1000);
                }
        
                utils.info(msg);
                callback(hasSucceed);
        
                setTimeout(function () {
                    self.stopWaiting();
                    if (!self.gameIsOver()) {
                        self.goNextPhase();
                    }
                }, 1000);
            });
        },
        
        renderMap: function () {
            this.players[0].renderTries(this.grid);
        },
        renderMiniMap: function () {
            this.players[0].grid.forEach((row, y) => {
                row.forEach((cell, x) => {
                    const miniCell = this.miniGrid.querySelector(`.row:nth-child(${y + 1}) .cell:nth-child(${x + 1})`);

                    // Si la cellule contient un bateau
                    if (cell !== 0) {
                        const ship = this.players[0].fleet.find(s => s.getId() === cell);

                        // Mettre en surbrillance la cellule sur la minimap avec la couleur du bateau
                        if (ship && miniCell) {
                            miniCell.style.backgroundColor = ship.getColor();
                        }
                    } else {
                        // Si la cellule ne contient pas de bateau, laisser la couleur par défaut
                        miniCell.style.backgroundColor = 'transparent';
                    }
                });
            });
        }
    };

    // point d'entrée
    document.addEventListener('DOMContentLoaded', function () {
        game.init();

    });

}());