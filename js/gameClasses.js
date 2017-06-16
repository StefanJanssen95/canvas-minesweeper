const F_MINE = -1;
const F_EXPLODED = -2;

const S_OPENED = 0;
const S_CLOSED = 1;
const S_FLAGGED = 2;

const PS_PLAYING = 0;
const PS_DEAD = 1;
const PS_DONE = 2;

const DEBUG = true;

let decimalFractionOfMines = 0.15;

class Field {
    constructor(canvas, value, x, y, size){
        this.value = value;
        this.state = S_CLOSED;
        this.x = x * size;
        this.y = y * size;
        this.size = size;
        this.canvas = canvas;
    }

    draw(){
        if(this.state === S_CLOSED ){
            this.canvas.image('sprClosed', {x: this.x, y: this.y}, {w:this.size, h: this.size});
        }
        if( this.state === S_FLAGGED ){
            this.canvas.image('sprFlag', {x: this.x, y: this.y}, {w:this.size, h: this.size});
        } else if( this.state === S_OPENED ){
            if( this.value === F_MINE ){
                this.canvas.image('sprMine', {x: this.x, y: this.y}, {w:this.size, h: this.size});
            } else if( this.value === F_EXPLODED ){
                this.canvas.image('sprExploded', {x: this.x, y: this.y}, {w:this.size, h: this.size});
            } else {
                this.canvas.image(`sprOpen${this.value}`, {x: this.x, y: this.y}, {w:this.size, h: this.size});
            }
        }
    }
}

class Game {
    constructor(canvas, width, height, restartButton){
        this.tileSize = 40;
        this.width = width;
        this.height = height;

        this.canvas = canvas;
        this.canvas.width = height * this.tileSize;
        this.canvas.height = width * this.tileSize;
        this.restartButton = restartButton;

        Promise.all( this.canvas.loadImages({
                sprClosed:          "./img/ClosedField.svg",
                sprFlag:            "./img/ClosedField_Flagged.svg",
                sprOpen0:           "./img/OpenField_0.svg",
                sprOpen1:           "./img/OpenField_1.svg",
                sprOpen2:           "./img/OpenField_2.svg",
                sprOpen3:           "./img/OpenField_3.svg",
                sprOpen4:           "./img/OpenField_4.svg",
                sprOpen5:           "./img/OpenField_5.svg",
                sprOpen6:           "./img/OpenField_6.svg",
                sprOpen7:           "./img/OpenField_7.svg",
                sprOpen8:           "./img/OpenField_8.svg",
                sprMine:            "./img/Mine.svg",
                sprExploded:        "./img/Mine_Exploded.svg",
            }))
            .then(img => {
                this.startGame();
            })
            .catch(err => {
                if( err.key && err.path ){
                    console.groupCollapsed(err.message);
                    console.error(`${err.key}: ${err.path}`);
                    console.groupEnd();
                } else {
                    console.error(err);
                }
                
            });
        
        canvas.registerClickHandler(this.clickEvent, this, true);
        restartButton.addEventListener('click', this.startGame.bind(this));
    }

    startGame(){
        this.restartButton.innerHTML = "😨";
        this.playState = PS_PLAYING;
        this.numberOfMines = Math.floor(this.width * this.height * decimalFractionOfMines);
        this.placedFlags = 0;
        this.correctPlacedFlags = 0;
        this.field = [];
        for( let x=0; x<this.width; x++){
            this.field[x] = [];
            for( let y=0; y<this.height; y++){
                this.field[x][y] = new Field(this.canvas, 0, y, x, this.tileSize);
            }
        }

        // Place mines on the field
        let placedMines = 0;
        do {
            let pos;
            do{
                pos = this.randomPositionOnField();
            } while ( this.field[pos.x][pos.y].value === F_MINE )
            this.field[pos.x][pos.y].value = F_MINE;
            placedMines++;
        } while ( placedMines < this.numberOfMines )

        // Increase the values of places around the mines
        for( let x=0; x<this.width; x++){
            for( let y=0; y<this.height; y++){
                if( this.field[x][y].value !== F_MINE ){
                    this.field[x][y].value = this.numberOfMinesAround(x, y);
                }
                this.field[x][y].draw();
            }
        }

        if( DEBUG ){ this.logField(); }
    }

    /**
     * @description Returns the number of mines around a field
     * @param {Number} x x position of the field
     * @param {Number} y y position of the field
     * @return {Number}
     */
    numberOfMinesAround(x, y){
        let around = 0;
        if( x > 0 ){
            if( y > 0 ){
                around += this.field[x-1][y-1].value === F_MINE ? 1 : 0;
            }
            if( y < this.height-1 ){
                around += this.field[x-1][y+1].value === F_MINE ? 1 : 0;
            }
            around += this.field[x-1][y].value === F_MINE ? 1 : 0;
        }
        if( x < this.width-1 ){
            if( y > 0 ){
                around += this.field[x+1][y-1].value === F_MINE ? 1 : 0;
            }
            if( y < this.height-1 ){
                around += this.field[x+1][y+1].value === F_MINE ? 1 : 0;
            }
            around += this.field[x+1][y].value === F_MINE ? 1 : 0;
        }
        if( y > 0 ){
            around += this.field[x][y-1].value === F_MINE ? 1 : 0;
        }
        if( y < this.height-1 ){
            around += this.field[x][y+1].value === F_MINE ? 1 : 0;
        }
        return around;
    }

    /**
     * @description Returns a Object with the fields Number:x and Number:y which is a position in the minefield
     * @return {Object}  
     */ 
    randomPositionOnField(){
        let x = Math.floor(Math.random() * this.width);
        let y = Math.floor(Math.random() * this.height);
        return { x, y };
    }

    clickEvent(x, y, button, ev){
        if( this.playState === PS_PLAYING ){

            let fieldX = Math.floor(x/this.tileSize);
            let fieldY = Math.floor(y/this.tileSize);

            if( DEBUG ){
                let btnName = button === MB_LEFT ? 'left' : button === MB_RIGHT ? 'right' : button === MB_MIDDLE ? 'middle' : `UNKNOWN ID: ${button}`;
                console.groupCollapsed('MOUSE');
                    console.log(`x: ${x}`);
                    console.log(`y: ${y}`);
                    console.log(`button: ${btnName}`);
                console.groupEnd();
                console.groupCollapsed('CLICKED FIELD');
                    console.log(`fieldX: ${fieldX}`);
                    console.log(`fieldY: ${fieldY}`);
                    console.log(`value: ${this.field[fieldY][fieldX].value}`);
                    console.log(`state: ${this.field[fieldY][fieldX].state}`);
                console.groupEnd();
            }

            if( button === MB_LEFT ){
                this.openField(fieldX, fieldY);
            } else if( button === MB_RIGHT ) {
                if( this.field[fieldY][fieldX].state === S_CLOSED ){
                    this.field[fieldY][fieldX].state = S_FLAGGED;
                    this.placedFlags++;

                    if( this.field[fieldY][fieldX].value === F_MINE ){
                        this.correctPlacedFlags++;
                    }
                } else if( this.field[fieldY][fieldX].state === S_FLAGGED ){
                    this.field[fieldY][fieldX].state = S_CLOSED;
                    this.placedFlags--;

                    if( this.field[fieldY][fieldX].value === F_MINE ){
                        this.correctPlacedFlags--;
                    }
                }

                if( DEBUG ){
                    console.groupCollapsed("FLAGS");
                    console.log(`Total Flags: ${this.placedFlags}`);
                    console.log(`Correct Flags: ${this.correctPlacedFlags}`);
                    console.log(`Mines: ${this.numberOfMines}`);
                    console.groupEnd();
                }

                // Check if won
                if( this.correctPlacedFlags === this.numberOfMines && this.correctPlacedFlags === this.placedFlags ){
                    this.playState = PS_DONE;
                    this.endGame();
                }
            }
            
            
            this.field[fieldY][fieldX].draw();
        }
    }

    openField(x, y){
        if( x >= 0 && y >= 0 && x < this.height && y<this.width){
            if( this.field[y][x].state === S_CLOSED ){
                this.field[y][x].state = S_OPENED;
                if( this.field[y][x].value === F_MINE ){
                    this.field[y][x].value = F_EXPLODED;
                    this.playState = PS_DEAD;
                    this.endGame();
                } else if( this.field[y][x].value === 0 ){
                    window.setTimeout(()=>{
                        this.openField(x-1,y-1);
                        this.openField(x,y-1);
                        this.openField(x+1,y-1);

                        this.openField(x-1,y);
                        this.openField(x+1,y);
                        
                        this.openField(x-1,y+1);
                        this.openField(x,y+1);
                        this.openField(x+1,y+1);
                    }, DEBUG?50:50);
                    
                }
                this.field[y][x].draw();
            }
        }
    }

    endGame(){
        console.clear();
        for( let x=0; x<this.width; x++){
                for( let y=0; y<this.height; y++){
                    if( this.field[x][y].state === S_CLOSED && this.field[x][y].value === F_MINE ){
                        this.field[x][y].state = S_OPENED;
                    }
                    this.field[x][y].draw();
                }
            }
        if( this.playState === PS_DONE ){
            this.restartButton.innerHTML = "😀";
            console.log("You flagged all mines.");
        } else if( this.playState === PS_DEAD ){
            this.restartButton.innerHTML = "🍖";
            console.log("You exploded in little pieces.");
        } else {
            this.restartButton.innerHTML = "😕";
            console.log("The game ended without a good reason.");
        }
    }

    /**
     * @description Shows the minefield and settings to make debugging easier
     */ 
    logField(){
        console.log(this.canvas.element);
        console.groupCollapsed('FIELD SETTINGS');
        console.log('width: %i', this.width);
        console.log('height: %i', this.height);
        console.log('numberOfMines: %i', this.numberOfMines);
        console.groupEnd();
        let _field = [];
        for( let x=0; x<this.width; x++){
            _field[x] = [];
            for( let y=0; y<this.height; y++){
                _field[x][y] = this.field[x][y].value;
            }
        }
        console.table(_field);
    }
}