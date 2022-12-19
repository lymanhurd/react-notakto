import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import { computerMove, isDead, isStart, humanMove, isGameOver } from './logic';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

/**
 * Constants that determine the canvas dimensions for the individual boards
 * Note that each column (and row) has three squares but two lines
 */
const LINE_WIDTH = 3;
const SQUARE_WIDTH = 60;
const SQUARE_WITH_BDY = SQUARE_WIDTH + LINE_WIDTH;
const CANVAS_SIZE = 3 * SQUARE_WIDTH + 2 * LINE_WIDTH;

function StartButton(props) {
  return (<Button variant={props.variant} size="lg" onClick={props.onClick}>
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
    
  return (<canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} {...props}>
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
        stats: {
          computerWins: 0,
          humanWins: 0,
        },
        boards: [
          '---------',
        ],
      };
  }

  componentDidMount() {
    const boardsJson = sessionStorage.getItem("notaktoBoards");
    const savedBoards = JSON.parse(boardsJson);
    const statsJson = sessionStorage.getItem("notaktoStats");
    const savedStats = JSON.parse(statsJson);
    if (savedBoards && savedStats) {
      this.setState({
        boards: savedBoards, 
        stats: savedStats
      });
    }
  }

  componentDidUpdate(prevProps, prevStates) {
    const boardsJson = JSON.stringify(this.state.boards);
    sessionStorage.setItem("notaktoBoards", boardsJson);
    const statsJson = JSON.stringify(this.state.stats);
    sessionStorage.setItem("notaktoStats", statsJson);    
  }

  plusClickHandler() {
    const newBoards = this.state.boards.concat(["---------"]);
    this.setState({
      boards: newBoards,
    });
  }

  minusClickHandler() {
    if (this.state.boards.length > 1) {
      const newBoards = this.state.boards.slice(0, -1);
      this.setState({
        boards: newBoards,
      });
    }
  }

  // Hitting "start" means that the human is passing and letting the computer move first
  startClickHandler() {
    const [newBoards, winning] = computerMove(this.state.boards);
    this.setState({
      boards: newBoards,
      stats: {
        humanWins: this.state.stats.humanWins,
        computerWins: this.state.stats.computerWins,
        winning: winning,        
      }
    });
  }

  // Hitting "quit" means conceding victory to the computer.  The "quit" button will change color
  // to signal when a human win is no lonfger possible!
  quitClickHandler() {
    const newBoards = new Array(this.state.boards.length).fill("---------");
    let computerWins = this.state.stats.computerWins;
    if (!isGameOver(this.state.boards)) {
      computerWins++;
    }
    this.setState({
      boards: newBoards,
      stats: {
        humanWins: this.state.stats.humanWins,
        computerWins: computerWins,
        winning: false,
        gameOver: false,
      }
    });
  }
  
  bdClickHandler(event, idx) {
    const squareNum = Math.floor(event.nativeEvent.offsetX / SQUARE_WITH_BDY) + 3 * (Math.floor(event.nativeEvent.offsetY / SQUARE_WITH_BDY));
    let newBoards = humanMove(this.state.boards, idx, squareNum);
    // click was not legal
    if (newBoards === null) {
      return;
    }
    if (isGameOver(newBoards)) {
      this.setState({
        boards: newBoards,
        stats: {
          humanWins: this.state.stats.humanWins,
          computerWins: 1 + this.state.stats.computerWins,
          gameOver: true,
        }
      });
      return;
    }
    let winning;
    [newBoards, winning] = computerMove(newBoards);
    if (isGameOver(newBoards)) {
      this.setState({
        boards: newBoards,
        stats: {
          humanWins: 1 + this.state.stats.humanWins,
          computerWins: this.state.stats.computerWins,
          gameOver: true,
          winning: winning,
        }
      });
      return;
    }    
    this.setState({
      boards: newBoards,
      stats: {
        humanWins: 1 + this.state.stats.humanWins,
        computerWins: this.state.stats.computerWins,
        gameOver: false,
        winning: winning,
      }      
    });

  }

  render() {
    const alert = this.state.error ?
      <Alert variant="danger">{this.state.error.message}</Alert> : null;
    const boardCanvases = this.state.boards.map((elt, idx) => isDead(this.state.boards[idx]) ? 
        <Board key={idx} contents={elt} className={"boards dead"} />
      :
        <Board key={idx} contents={elt} className={"boards"} onClick={(event) => this.bdClickHandler(event, idx)}/>
      );
    const buttonLabel = this.state.stats.gameOver ? "Play Again" :  "Quit";
    const buttonVariant = (this.state.stats.winning && ! this.state.stats.gameOver) ? "outline-danger" : "outline-primary";
    const buttons = (isStart(this.state.boards) ? 
      <div>
        <StartButton startLabel={"Start"} onClick={() => this.startClickHandler()} variant="outline-primary"/>
        <PlusButton onClick={() => this.plusClickHandler()} />
        <MinusButton onClick={() => this.minusClickHandler()} />
      </div>
      :
      <div>
        <StartButton startLabel={buttonLabel} variant={buttonVariant} onClick={() => this.quitClickHandler()}/>
      </div>);
    return (
        <div>
          {alert}
          <div className="game-board">
            <a href="http://www.hurd-sullivan.com/"><img id="hslogo" src="images/HS.gif" alt="Go to Hurd-Sullivan.com"/></a>
            {buttons}
            <Scores humanWins={this.state.stats.humanWins} computerWins={this.state.stats.computerWins}/>
            <div>
              {boardCanvases}
            </div>
          </div>
          <div id="explanation">
            <ul className="rules">
              <li>Red and Blue take turns playing X's</li>
              <li>A board with three X's in a row (irrespective of color) is dead</li>
              <li>Whoever kills the last board, loses</li>
              <li>Press "Start" to make the computer move first, or click on a square</li>
              <li><a href="./discussion.html">More discussion</a></li>
            </ul>
          </div>
        </div>
    );    
  }
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
  context2D.lineWidth = LINE_WIDTH;
  drawLine(context2D, SQUARE_WIDTH, 0, SQUARE_WIDTH, CANVAS_SIZE - 1);
  drawLine(context2D, 2 * SQUARE_WIDTH + LINE_WIDTH, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1);
  drawLine(context2D, 0, SQUARE_WIDTH, CANVAS_SIZE - 1, SQUARE_WIDTH);
  drawLine(context2D, 0, 2 * SQUARE_WIDTH + LINE_WIDTH, CANVAS_SIZE - 1, 2 * SQUARE_WIDTH + LINE_WIDTH);
}

function drawX(c, moveIdx, clr) {
  const context2D = c.getContext('2d');
  context2D.strokeStyle = clr;
  const col = moveIdx % 3;
  const row = Math.floor((moveIdx % 9) / 3);  
  const x = 7;
  const y = 59 - x;
  drawLine(context2D, x + SQUARE_WITH_BDY * col, x + SQUARE_WITH_BDY * row, y + SQUARE_WITH_BDY * col, y + SQUARE_WITH_BDY * row);
  drawLine(context2D, x + SQUARE_WITH_BDY * col, y + SQUARE_WITH_BDY * row, y + SQUARE_WITH_BDY * col, x + SQUARE_WITH_BDY * row);
}


// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
