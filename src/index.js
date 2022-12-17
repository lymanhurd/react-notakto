import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Button from 'react-bootstrap/Button';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function StartButton(props) {
  return (<Button variant="outline-primary" size="lg" onClick={props.onClick}>
      {props.startLabel}
      </Button>);
}

function MinusButton(props) {
  return (<Button variant="outline-primary" size="lg" onClick={props.onClick}>
      -
      </Button>);  
}

function PlusButton(props) {
  return (<Button variant="outline-primary" size="lg" onClick={props.onClick}>
      +
      </Button>);
}

function Board(props) { 
  const canvasRef = useRef(null);
    
  useEffect(() => {
    drawBoard(canvasRef.current);
    props.contents.split("").forEach((elt, idx) => {
      if (elt === "X") {
        drawX(canvasRef.current, idx, "red");
      } else if (elt === 'x') {
        drawX(canvasRef.current, idx, "blue");
      }
    });
  }, [props.contents]);
    
  return (<canvas ref={canvasRef} width={186} height={186} {...props}>
            Your browser does not support HTML5.
          </canvas>);
}

function Scores(props) {
  return (
    <div>
      <span className={"scores"}>Human: {props.humanWins} </span>
      <span className={"scores"}>Computer: {props.computerWins}</span>
    </div>);
}

class Game extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        computerWins: 0,
        humanWins: 0,
        numBoards: 1,
        moveNumber: 0,
        winner: "-",
        boards: [
          '---------',
        ],
        dead: [
          false,
        ],
      };
  }

  plusClickHandler() {
    const newBoards = this.state.boards.concat(["---------"]);
    this.setState({
      boards: newBoards,
      dead: new Array(newBoards.length).fill(false),
    });
  }

  minusClickHandler() {
    if (this.state.boards.length > 1) {
      const newBoards = this.state.boards.slice(0, -1);
      this.setState({
        boards: newBoards,
        dead: new Array(newBoards.length).fill(false),
      });
    }
  }

  startClickHandler() {
    const newBoards = new Array(this.state.boards.length).fill("---------");
    const newDead = new Array(this.state.boards.length).fill(false);
    this.setState({
      boards: newBoards,
      dead: newDead,
    });
  }

  quitClickHandler() {
    const newBoards = new Array(this.state.boards.length).fill("---------");
    const newDead = new Array(this.state.boards.length).fill(false);
    const computerWins = this.state.computerWins;
    this.setState({
      boards: newBoards,
      dead: newDead,
      moveNumber: 0,
      computerWins: computerWins + 1,
    });
  }
  
  bdClickHandler(event, idx) {
    const squareNum = Math.floor(event.nativeEvent.offsetX / 63) + 3 * (Math.floor(event.nativeEvent.offsetY / 63));
    this.mkMove(idx, squareNum, this.state.moveNumber % 2 === 0 ? "x" : "X");
  }

  mkMove(idx, square, symbol) {
    const oldBoard = this.state.boards[idx];
    if (oldBoard[square] !== "-") {
      return;
    }
    const moveNumber = this.state.moveNumber + 1;
    const newBoards = this.state.boards.slice();
    newBoards[idx] = oldBoard.substring(0, square) + symbol + oldBoard.substring(square + 1);
    const newDead = this.state.dead.slice();
    if (isDead(newBoards[idx])) {
      newDead[idx] = true;
    }
    // if all the boards are dead, the last person to play loses
    const newLoser = newDead.every(d => d) ? symbol : "-";
    if (newLoser !== "-") {
      console.log(`${symbol} Loses`);
    }
    this.setState({
      boards: newBoards,
      moveNumber: moveNumber,
      dead: newDead,
      loser: newLoser,
    });
  }

  render() {
    const boardCanvases = this.state.boards.map((elt, idx) => this.state.dead[idx] ? 
        <Board key={idx} contents={elt} className={"boards dead"} />
      :
        <Board key={idx} contents={elt} className={"boards"} onClick={(event) => this.bdClickHandler(event, idx)}/>
      );
    const buttons = (this.state.moveNumber === 0 ? 
      <div>
        <StartButton startLabel={"Start"} onClick={() => this.startClickHandler()}/>
        <PlusButton onClick={() => this.plusClickHandler()} />
        <MinusButton onClick={() => this.minusClickHandler()} />
      </div>
      :
      <div>
        <StartButton startLabel={"Quit"} onClick={() => this.quitClickHandler()}/>
      </div>);
    return (
        <div>
          <div className="game-board">
            <a href="http://www.hurd-sullivan.com/"><img id="hslogo" src="images/HS.gif" alt="Go to Hurd-Sullivan.com"/></a>
            {buttons}
            <Scores humanWins={this.state.humanWins} computerWins={this.state.computerWins}/>
            <div>
              {boardCanvases}
            </div>
          </div>
          <div id="explanation">
            <ul className="rules">
              <li>Red and Blue take turns playing X's</li>
              <li>A board with three X's in a row (irrespective of color) is dead</li>
              <li>Whoever kills the last board, loses</li>
              <li>Press "start" to make the computer move first, or click on a square</li>
              <li><a href="./discussion.html">More discussion</a></li>
            </ul>
          </div>
        </div>
    );    
  }
}

function isDead(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if ((board.charAt(a) !== "-") && (board.charAt(b) !== "-") && (board.charAt(c) !== "-")) {
      return true;
    }
  }
  return false;
}  

//Line drawing  ========================================

function drawLine(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawBoard(c) {
  var context2D = c.getContext('2d');
  context2D.strokeStyle = 'black';
  context2D.globalAlpha = 1.0;
  context2D.clearRect(0, 0, c.width, c.height);
  context2D.lineWidth = 3;
  drawLine(context2D, 60, 0, 60, 185);
  drawLine(context2D, 123, 0, 123, 185);
  drawLine(context2D, 0, 60, 185, 60);
  drawLine(context2D, 0, 123, 185, 123);
}

function drawX(c, moveIdx, clr) {
  const context2D = c.getContext('2d');
  // context2D.strokeStyle = ['red', 'blue'][moveNumber % 2];
  context2D.strokeStyle = clr;
  const col = moveIdx % 3;
  const row = Math.floor((moveIdx % 9) / 3);  
  const x = 7;
  const y = 59 - x;
  drawLine(context2D, x + 63 * col, x + 63 * row, y + 63 * col, y + 63 * row);
  drawLine(context2D, x + 63 * col, y + 63 * row, y + 63 * col, x + 63 * row);
}


// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
