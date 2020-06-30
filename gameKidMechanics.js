/////////////////////// BUILDING BLOCKS///////////////////////////////////////////
class Points {
    constructor(x , y) {
        this.x = x;
        this.y = y;
    }

    addPoints(point){
        return new Points(this.x+point.x, this.y+point.y);
    }

    multiplyPoints(x) {
        return new Points(this.x*x , this.y*x);
    }
}

class Gem{
    constructor(points) {
        this.points=points;
        this.size = new Points(1.6,1.6);
    }

    set size(v){
        this._size = v;
    }
    get size(){
        return this._size;
    }

    get type(){ return "Gem";}

    static create(Points) {
        return new Gem(Points);
    }

    update(){
        return this;
    }

    clashedState(state) {
        let filtered = state.movingBits.filter(a => a != this);
        let status = state.status;
        if (!filtered.some(a => a.type == "Gem")) status = "won";
        return new gameState(state.plan, filtered, status);
      }
}

class Missile {
    constructor(points, speed, oneWay){
        this.points=points;
        this.speed=speed;
        this.oneWay=oneWay;
        this.size = new Points(3,2);
    }

    set points(v){
        this._points = v;
    }
    get points(){
        return this._points;
    }

    set size(v){
        this._size = v;
    }
    get size(){
        return this._size;
    }

    get type() {return "Missile";}

    static create(points,ch){

        if(ch == "V"){
            return new Missile(points,new Points(0,2),points);
        }
        else if (ch == "<") {
            return new Missile(points, new Points(2,0));
        }
    }

    update(timestep,state){
        this.points=this.points.addPoints(this.speed.multiplyPoints(timestep));
        //console.log(mco++);
        if(!state.plan.near(this.points,this.size,"earth"))
            return new Missile(this.points,this.speed,this.oneWay);
        else if(this.oneWay) return new Missile(this.oneWay,this.speed,this.oneWay);
        else return new Missile(this.points,this.speed.multiplyPoints(-1));
    }

    clashedState(state) {
        return new gameState(state.plan, state.movingBits, "Off");
    }
}

class Player{
    constructor(points, speed) {
        this.points = points;
        this.speed= speed;
        this.lives= 3;
        this.size = new Points(1.5,1.5);
    }

    set size(v){
        this._size = v;
    }
    get size(){
        return this._size;
    }

    get type(){
        return "Player";
    }

    static create(points){
        return new Player(points.addPoints(new Points(0,-1)),new Points(0,0));
    }

    update(timestep,state,keys){
        let px=0;
        if(keys.ArrowLeft)
            px-=speedX;
        if(keys.ArrowRight)
            px+=speedX;
        if(keys.Shift && this.speed.y != 0)px+=2*speedX;
    
        let newPoints=this.points;
        let newX=newPoints.addPoints(new Points(px*timestep,0));
        //console.log(++count,newX.x,newX.y);
        if(!state.plan.near(newX,this.size,"earth"))
            newPoints=newX;
    
    
        let speedY= this.speed.y + gravity*timestep;
        let newPointsY=newPoints.addPoints(new Points(0,speedY*timestep));
        if(!state.plan.near(newPointsY,this.size,"earth"))
            newPoints=newPointsY;
        else if(speedY > 0 && keys.ArrowUp){
            speedY=-jump;
        }
        else {
            speedY=0;
        }
    
        return new Player(newPoints,new Points(speedX,speedY));
    };
}

const gameBits={"E":"earth","G":"grass","*":"water","V":Missile,"<":Missile,"$":Player,"O":Gem,".":"Void"};

///////////////////////////////////////////GAME LAYER/////////////////////////

class Plan{
    constructor(Level) {
        this.level=Level.trim().split("\n").map(x=>[...x]);
        this.height=this.level.length;
        this.width=this.level[0].length;
        this.movingBits=[];

        this.level= (()=>{
            let yin= 0, xin= 0;

            for(let y of this.level) {
                xin= 0;

                for(let x of y) {
                    let bitValue= gameBits[x];

                    if(typeof bitValue == "string") this.level[yin][xin]=bitValue;
                    else {
                        this.level[yin][xin]="Void";
                        this.movingBits.push(bitValue.create(new Points(xin,yin),x));
                    }
                    xin++;
                }
                yin++
            }
            return this.level;
        })();

        //console.log(...this.movingBits);
    }

    near(bit,bitSize,type){
        let xStart= Math.floor(bit.x);
        let xEnd= Math.ceil(bit.x + bitSize.x);
        let yStart= Math.floor(bit.y);
        let yEnd= Math.ceil(bit.y + bitSize.y);
        //let floorYEnd= Math.floor(bitA.y + bitSize.y);
        let premise= false;
    
        if(type == "grass" || type == "earth") premise = true;
        if(xStart < 0 || xEnd > this.level.width || yStart < 0 || yEnd > this.level.height) return true;
    
        let here1="", here2="";
        for(let i=yStart; i<yEnd; i++){
            if( xStart < 0 || xEnd > this.width || i <= 0 || i >= this.height) return true;
    
            if(i == yStart || i == yEnd){
                for(let j=xStart; j<xEnd; j++){
                    here1=this.level[i][j];
                    if(premise) {
                        if(here1 == "earth" || here1== "grass") return true;
                    }
                    else if(here1 == type) return true;
                }
            }
            else {
                here1=this.level[i][xStart];
                here2=this.level[i][xEnd-1];
                if(premise) {
                    if(here1 == "earth" || here1== "grass" || here2=="earth" || here2=="grass") return true;
                }
                else if(here1 == type || here2 == type) return true;
            }
        }
        return false;
    }
}

///////////////////////////////////////// B I T - I N T E R F A C E//////////////////////////////////////
///////////////////////////////////////// S    T     A     T     E//////////////////////////////////////
class gameState{
    constructor(level,bits,status){
        this.plan = level;
        this.movingBits = bits;
        this.status = status;
    }

    get player() {
        return this.movingBits.find(a => a.type == "Player");
    }

    static create(plan){
        let pl=new Plan(plan);
        return new gameState(pl, pl.movingBits, "On");
    }

    
    update(timestep,keys){
        let movingBits=this.movingBits.map(x=>x.update(timestep,this,keys)); //update movbits with new timestep//update player with keys
    
        let newState=new gameState(this.plan,movingBits,this.status); // new state with upated movbits
        if(newState.status != "On") return newState; //if already lost return
    
        //if still on-> check if new position touches water. return with lost status if true
        let currentPlayer=newState.player;
        if(this.plan.near(currentPlayer.points,currentPlayer.size,"Missile") || this.plan.near(currentPlayer.points,currentPlayer.size,"water")) return new gameState(this.plan,movingBits,"Off");
    
        //
        for (let bit of movingBits) {
        if (bit != currentPlayer && lapse(bit, currentPlayer)) {
            newState = bit.clashedState(newState);
        }
        }
        //console.log(...newState.movingBits);
        return newState;
   }
};


///////////////////////////U T I L I T Y //////////////////////////////

function createNode(pNode,attr,...chN){
    let parent=document.createElement(pNode);

    for(let att of Object.keys(attr)){
        parent.setAttribute(att, attr[att]);
    }

    for(let ch of chN) parent.appendChild(ch);

    return parent;
}

////////////////////////////////////////////// D O M LAYER I N T E R F A C E//////////////////////////////////
var drawScale= 25;

function drawBoard(plan) {

    let board = createNode('nav', {class: 'board',style:`width:${plan.width*drawScale}px`});

    plan.level.map(row=>{
        let b_row = createNode('div',{class: 'row', style : `height: ${drawScale}px`});
        row.map(block=>{
            b_row.appendChild(createNode('div',{class: `block ${block}`}));
        });

        board.appendChild(b_row);
    });

    return board;
}

class gameDisplay{
    constructor(parent, level){
        this.gameBoard= createNode("div",{class:"gameBoard"});
        this.gameBoard.appendChild(drawBoard(new Plan(level)));
        this.movBits=null;
        parent.appendChild(this.gameBoard);
    }

    clearBoard(){this.gameBoard.remove();}

    
    changeState(state){
        if(this.movBits != null) this.movBits.remove();
        this.movBits=drawMovingBits(state.movingBits);
        this.gameBoard.appendChild(this.movBits);
        this.gameBoard.className=`gameBoard ${state.status}`;
        this.scrollBoard(state);
    }

    scrollBoard(state){
        let width= this.gameBoard.clientWidth;
        let height=this.gameBoard.clientHeight;
        let theThird= width/3;

        let left= this.gameBoard.scrollLeft;
        let right= left+width;
        let top= this.gameBoard.scrollTop;
        let bottom= top+height;

        let player=state.player;
        let pointPl=player.points.addPoints(player.size.multiplyPoints(0.5)).multiplyPoints(drawScale);
        let posX=pointPl.x;
        let posY=pointPl.y;

        if(posX > right-theThird) this.gameBoard.scrollLeft= posX + theThird - width;
        else if(posX < left+theThird) this.gameBoard.scrollLeft= posX - theThird;
        
        if(posY < theThird) this.gameBoard.scrollTop= posY + theThird- height;
        else if(posY > bottom - theThird) this.gameBoard.scrollTop= posY + theThird - height;
    }

    refresh(run){
        let lives=run;
         this.gameBoard.querySelector(".Life").remove();
         let lifeBar=createNode("div",{class:`Life`, style:`position:fixed;`});
         
         while(lives-->0)
             lifeBar.appendChild(createNode("div",{class:"bar",style:`width:25px; height:10px;`}));
        
         this.gameBoard.appendChild(lifeBar);
         
         //checkpoint system is needed...
          let bitDiv=this.gameBoard.querySelector(".Player");
          bitDiv.style.left = bitDiv.pageX-2 * drawScale+"px";
        //   console.log(bitDiv);
        //   this.gameBoard.querySelector(".Actorr").appendChild(bitDiv);
        
        };
}

function drawMovingBits(bits){
    return createNode("div",{},...bits.map(bit=>{
        let bitDiv=createNode("div",{class:`Actors ${bit.type}`});
        bitDiv.style.height=`${bit.size.y*drawScale}px`;
        bitDiv.style.width=`${bit.size.x*drawScale}px`;
        bitDiv.style.top=`${bit.points.y*drawScale}px`;
        bitDiv.style.left=`${bit.points.x*drawScale}px`;

        if(bit.type == "Player" )
        {
            if(document.querySelector(".Life"))document.querySelector(".Life").remove();
            let lifeBar=createNode("div",{class:`Life`, style:`position:fixed;`})
            for(let l=0; l<bit.lives;l++)
            {
                lifeBar.appendChild(createNode("div",{class:"bar",style:`width:25px; height:10px;`}));
            }

            let board=document.querySelector(".gameBoard");
            board.appendChild(lifeBar);
        }
        return bitDiv;
    }));
}
////////////////////////////////////// M O T I O N - M E C H A N I C S /////////////////////////////////////



function lapse(bit1,bit2) {
    let mezX= bit1.size.x < bit2.size.x ? bit1.size.x : bit2.size.x;
    let mezY= bit1.size.y < bit2.size.y ? bit1.size.y : bit2.size.y;

    let diffX= (bit1.points.x - bit2.points.x) < 0 ? -1*(bit1.points.x - bit2.points.x):(bit1.points.x - bit2.points.x);
    let diffY= (bit1.points.y - bit2.points.y) < 0 ? -1*(bit1.points.y - bit2.points.y):(bit1.points.y - bit2.points.y);
    if(diffX <= mezX && diffY <=mezY) return true;

    return false;
}

//////////////////////////////////////////////MOVING BITS UPDATE//////////////////////////////
var mco=0;

var count=0;
const speedX= 7, gravity= 30, jump= 17;

///////////////////////////////////////INPUT KEYS/////////////////////////////////////////////////

function recordKeys(keys){
    let inout= Object.create(null);

    function record(event){
        if (keys.includes(event.key)) {
            inout[event.key] = event.type == "keydown";
            event.preventDefault();
        }
    }
    window.addEventListener("keydown",record);
    window.addEventListener("keyup",record);

    return inout;
}

var inputKeys= recordKeys(["ArrowUp","ArrowLeft","ArrowRight","Shift"]);

/////////////////////////////////// SHOWTIME //////////////////////////////////////////////////

function runAnimation(frameFunc) {
    let lastTime = null;
    function frame(time) {
      if (lastTime != null) {
        let timeStep = Math.min(time - lastTime, 100) / 1000;
        if (frameFunc(timeStep) === false) return;
      }
      lastTime = time;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

function runLevel(level) {
    let display = new gameDisplay(document.body, level);
    let state = gameState.create(level);
    let runn=3;
    let ending = 1;
    let nu=-300;
    return new Promise(resolve => {
        runAnimation(time => {
            state = state.update(time, inputKeys);
            display.changeState(state);
            if (state.status == "On") {
                return true;
            }
            else if(runn > 0 && state.status=="Off"){
                state.status="On";
                nu+=time;
                if(nu > 0) {
                    runn--;
                    display.refresh(runn);
                    nu=-300;
                }
                display.refresh(runn);
                return true;
                
            }
            else if (ending > 0) {
                ending -= time;
                return true;
            } else {
                display.clearBoard();
                resolve(state.status);
                runn=3;
                return false;
            }
        });
    });
}

async function runGame(plans) {
    for (let level = 0; level < plans.length;) {
        let status = await runLevel(plans[level]);

        console.log(status);
        if (status == "won") level++;
    }
    console.log("You've won!");
}
