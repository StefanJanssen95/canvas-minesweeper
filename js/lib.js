const MB_LEFT = 0;
const MB_MIDDLE = 1;
const MB_RIGHT = 2;

class Canvas {
    get width(){ return this.element.width; }
    set width(width){ this.element.width = width; }

    get height(){  return this.element.height; }
    set height(height){ this.element.height = height; }

    get fillColor(){ return this.ctx.fillStyle; }
    set fillColor(color){ this.ctx.fillStyle = color; }

    get strokeColor(){ return this.ctx.strokeStyle; }
    set strokeColor(color){ this.ctx.strokeStyle = color; }

    get colors() { return {fillStyle: this.fillColor, strokeStyle: this.strokeColor}; }
    set colors(color) {
        if( color.fillColor ){
            this.fillColor = color.fillColor;
        }
        if( color.strokeColor ){
            this.strokeColor = color.strokeColor; 
        }
    }
    /**
     * @param {String} id The id of the canvas element
     * @return {Canvas}  
     */ 
    constructor(id){
        this.clickHandler = null;
        this.element = document.getElementById(id);
        this.images = {};
        if(this.element){
            if(this.element.tagName === "CANVAS" ){
                this.ctx = this.element.getContext('2d');
            } else {
                throw "Element isn't a canvas element. Got: "+this.element.tagName;
            }
            
        } else {
            throw "Element doesn't exist";
        }
    }
    /* EVENT HANDLING */
    registerClickHandler( func, binding, preventContextMenu ){
        this.clickHandler = func.bind(binding);
        this.element.addEventListener('click', this.callClickHandler.bind(this));
        this.element.addEventListener('contextmenu', this.callClickHandler.bind(this));
    }

    callClickHandler(ev){
        let rect = canvas.getBoundingClientRect();
        let x = ev.clientX - rect.left;
        let y = ev.clientY - rect.top;
        let button = ev.button ? ev.button : ev.which-1;
        ev.preventDefault();
        this.clickHandler(x, y, button, ev);
    }

    /* IMAGES */
    /**
     * 
     */
    loadImage(key, path){
        return new Promise( (resolve, reject)=>{
            let img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            }
            img.onerror = () => reject({
                message: "Image not found",
                key: key,
                path: path
            });
            img.src = path;
        });
    }

    loadImages( imageList ){
        let promises = [];
        for( let key in imageList ){
            promises.push(this.loadImage(key, imageList[key]));
        }
        return promises;
    }

    /* DRAW FUNCTIONS */
    /**
     * 
     */
    image( imageKey, position, size){
        if( size ){
            this.ctx.drawImage(this.images[imageKey], position.x, position.y, size.w || size.width, size.h || size.height );
        } else {
            this.ctx.drawImage(this.images[imageKey], position.x, position.y);
        }
    }
    /**
     * 
     */
    rect( location, colors ){
        let x = location.x;
        let y = location.y;
        let w = 1;
        let h = 1;
        if( location.w ){
            w = location.w;
        } else if( location.x2 ){
            w = location.x2 - x;
        }
        if( location.h ){
            h = location.h;
        } else if( location.y2 ){
            h = location.y2 - y;
        }

        let oldColors = this.colors;

        this.ctx.beginPath();
            this.colors = colors;
            this.ctx.rect(x, y, w, h);
            this.ctx.fill();
            this.ctx.stroke();
        this.ctx.closePath();

        this.colors = oldColors;
    }
    /**
     * 
     */
    circle(position, radius, colors ){

        let oldColors = this.colors;

        this.ctx.beginPath();
            this.colors = colors;
            this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        this.ctx.closePath();

        this.colors = oldColors;
    }

    /**
     * 
     */
    text( text, position, font ){
        this.ctx.font = font;
        this.ctx.fillText(text, position.x, position.y );
    }
}

