const root = document.getElementById("root") as HTMLDivElement;
const container = root.querySelector(".container") as HTMLDivElement;
const chess_board = container.querySelector(".chess_board") as HTMLDivElement;

const buildBoard = (boardSize:number, cellSize:string) => {
    chess_board.innerHTML = "";
    for (let row = 0; row < boardSize; row++) {
        let line = document.createElement("div");
        line.classList.add("line");
        line.style.display = "flex";
        line.style.width = "fit-content";
        line.style.gap = "1px";

        for (let col = 0; col < boardSize; col++) {
            let cell = document.createElement("div") as HTMLDivElement;
            cell.style.color = "transparent";
            cell.style.width = cellSize;
            cell.style.height = cellSize;
            cell.style.display = "block";
            cell.style.backgroundColor = (row + col) % 2 === 0 ? "white" : "black";
            cell.textContent = row % 2 === 0 ? "white" : "black";
            line.appendChild(cell);
        }
        chess_board.appendChild(line);
    }
    root.appendChild(container);
};

const crateBoard = (boardSize:number): string[][] => {

    let board: string[][] = [];

    for (let row = 0; row < boardSize; row++) {

        let line:string[] = [];
        for (let col = 0; col < boardSize; col++) {
            let cell:string = (row + col) % 2 === 0 ? "□" : "■";
            line.push(cell)
        }
        board.push(line);
    }
    return board;
};

const printBoard = (board: string[][]) => {

    let output = "";

    for (let i = 0; i < board.length; i++) {
        let line = board[i];
        let lineStr = "";

        for (let i2 = 0; i2 < line.length; i2++) {
            lineStr += line[i2];
            if (i2 < line.length - 1) lineStr += " ";
        }
        output += lineStr;
        if (i < board.length - 1) output += "\n";
    }
    console.log(output);
};


buildBoard(10, "40px");

printBoard(crateBoard(10));


