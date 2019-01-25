import React from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-snapshot';
import './index.css';

function Square(props) {
  return (
    <button disabled={props.disabled} className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Board extends React.Component {  
  renderSquare(i) {
    return ( 
      <Square 
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  renderSquares(col, row) {
    
  }

  render() {
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class PrettyPrintJson extends React.Component {
  render() {
       // data could be a prop for example
       const { items } = this.props;
       console.log(items);
       return (<div><pre>{JSON.stringify(items, null, 2) }</pre></div>);
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      stepNumber: 0,
      recentMoves: [{
        recentMove: 0
      }],
      xIsNext: true,
      error: null,
      isLoaded: false,
      items: []
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();

    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      recentMoves: this.state.recentMoves.concat([{
        recentMove: i,
      }]),
      stepNumber: history.length,
      xIsNext: !this.state.xIsNext
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  componentDidMount() {
    fetch('https://jsonplaceholder.typicode.com/posts')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  render() {
    const { error, isLoaded, items } = this.state;
    console.log(items);
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      const history = this.state.history;
      const current = history[this.state.stepNumber];
      const winner = calculateWinner(current.squares);

      const moves = history.map((step, move) => {
        const isBold = this.state.stepNumber === move;
        const daMove = move ? "(" + 
              (this.state.recentMoves[move].recentMove % 3 + 1) + ", " + 
              (Math.floor(this.state.recentMoves[move].recentMove / 3) + 1) + ")" :
              "";
        const desc = move ?
          'Go to move #' + move :
          'Go to game start';
        return (
          <li key={move} className={isBold ? 'bold' : 'not-bold'}>
            <button onClick={() => this.jumpTo(move)}>{desc}</button> {daMove}
          </li>
        );
      });

      let status;
      if (winner) {
        status = 'Winner: ' + winner;
      } else {
        status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
      }

      return (<div>
        <div className="game">
          <div className="game-board">
            <Board
              squares={current.squares}
              onClick={(i) => this.handleClick(i)}
            />
          </div>
          <div className="game-info">
            <div>{status}</div>
            <ol>{moves}</ol>
          </div>
        </div>
        <div><ol><PrettyPrintJson 
        items={items}
        /></ol></div>
        </div>
      );
    }
  } 
}

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: props.columns,
      data: props.data,
      currentText: "",
      filterColumns: props.filterColumns,
      error: null,
      isLoaded: false,
      pageNum: 0,
      perPage: props.perPage ? props.perPage : 10,
      totalPages: 0
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  filter = () => {
    let currentText = this.state.currentText.toLowerCase();;
    let filterColumns = this.state.filterColumns;
    let data = this.state.data.filter(function (el) {
      return filterColumns.some(function (filterCol) {
        return el[filterCol].toLowerCase().indexOf(currentText) > -1;
      })
    });
    return data;
  }

  createHeader = () => {
    let table = []
    let children = [];
    for (let i = 0; i < this.state.columns.length; i++) {
      children.push(<th className="table-header" width={this.state.columns[i].width} >{this.state.columns[i].header}</th>);
    }
    table.push(<thead><tr>{children}</tr></thead>);
    return table
  }

  createTable = () => {
    let data = this.filter();
    let table = []
    let rows = [];
    let from = this.state.perPage * this.state.pageNum;
    let to = data.length > from + this.state.perPage ? from + this.state.perPage : data.length;
    console.log(from);
    for (let i = from; i < to; i++) {
      let cell = [];
      for (let j = 0; j < this.state.columns.length; j++) {
        let clazz = "bordered-cell " + (i % 2 === 0 ? "even" : "odd");
        cell.push(<td className={clazz}>{data[i][this.state.columns[j].col]}</td>);
      }
      rows.push(<tr>{cell}</tr>);
    }
    table.push(<tbody>{rows}</tbody>);
    return table
  }

  componentDidMount() {
    if (Array.isArray(this.state.data)) {
      return;
    }
    fetch(this.state.data)
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            data: result,
            totalPages: Math.ceil(result.length / this.state.perPage)
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      )
  }

  handleChange(event) {
    this.setState({currentText: event.target.value});
  }

  handleClick(event) {
    console.log(event);
    if (event === "next") {
      this.setState({pageNum: this.state.pageNum + 1});
    } else {
      this.setState({pageNum: this.state.pageNum - 1});
    }
  }

  render() {
    const { error, isLoaded } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <div className="table-view">
          <input type="text" className="filter-field" onChange={this.handleChange}/>
          <div className="table-content">
          <table>
            {this.createHeader()}
            {this.createTable()}
          </table>
          </div>
          <table className="bottom">
            <tbody>
              <tr>
                <td>
            <Square 
              disabled={this.state.pageNum === 0}
              value={"<"}
              onClick={(i) => this.handleClick("prev")}
            /></td><td className="alignCenter">
              {this.state.pageNum + 1} / {this.state.totalPages}
           </td><td className="alignRight">
            <Square 
              disabled={this.state.pageNum * this.state.perPage + this.state.perPage >= this.state.data.length}
              value={">"}
              onClick={(i) => this.handleClick("next")}
            />
            </td>
            </tr>
            </tbody>
          </table>
        </div>
      );
    }
  }
}

// ========================================

render(
  
  <Table 
    perPage = {6}
    filterColumns = {
      ["title","body"]
    }
    columns = {[
      {
        header: "User ID",
        col: "userId",
        width: 50
      },
      {
        header: "ID",
        col: "id",
        width: 50
      },
      {
        header: "Title",
        col: "title",
        width: 300
      },
      {
        header: "Body",
        col: "body",
        width: 400
      }
    ]}
    data = "https://jsonplaceholder.typicode.com/posts"/*{[
      {
        firstName:"Piotr",
        lastName:"Wykowski",
        age:30,
        email:"yolo@bolo.com"
      },
      {
        firstName:"Franek",
        lastName:"Kimono",
        age:57,
        email:"frans@bolo.com"
      },
      {
        firstName:"Przemek",
        lastName:"Kimono",
        age:57,
        email:"przemo@bolo.com"
      }
    ]}*/
  />,
  document.getElementById('root')
);

function calculateWinner(squares) {
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
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}