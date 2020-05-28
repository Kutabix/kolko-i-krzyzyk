const serverUrl = 'https://socket-tic-tac-toe-server.herokuapp.com';
const clientUrl = 'https://kutabix.github.io/kolko-i-krzyzyk';

let socket = io(serverUrl);

const isf5 = () => window.performance.navigation.type === 1;

if (isf5()) {
    socket.emit('disconnect');
    window.location.href = clientUrl;
    throw new Error('stop');
}

const leaveBtn = document.querySelector('#leave').addEventListener('click', () => {
    socket.emit('disconnect');
    window.location.href = clientUrl;
});

const qsData = Qs.parse(location.search, { ignoreQueryPrefix: true });

if (!qsData.username && !qsData.room) {
    socket.emit('disconnect');
    window.location.href = clientUrl;
}

const username = qsData.username || 'noname';
document.getElementById('r-info').innerHTML = `Jesteś aktualnie w pokoju nr ${qsData.room.toString().split('room')[1]}`;

socket.on('err', () => window.location.href = clientUrl);

socket.emit('join-room', { room: parseInt(qsData.room.split('room')[1]), username });

socket.on('update-users-list', players => {
    let updatedContent = '';
    for (const player of players) updatedContent += `<li>-${player}</li>`;
    document.getElementById('players-on-server-list').innerHTML = updatedContent;
});
// ----------------------------------------------
const boxes = document.querySelectorAll('.box');
boxes.forEach(box => box.addEventListener('click', main));

let turn = 0;
let yourTurn = true;

const board = [
    ['', '', ''],   // 0 1 2 
    ['', '', ''],   // 3 4 5
    ['', '', '']    // 6 7 8
];

const translateFields = [
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2]
];

const combinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function returnBoardField(n) {
    const [r, c] = translateFields[parseInt(n)]
    return board[r][c];
}

function main(e) {
    if (e.target.innerHTML !== '') return;
    if (!yourTurn) return document.getElementById('turn-info').innerHTML = 'To nie twoja kolej';
    const currentPlayer = turn % 2 === 0 ? 'X' : 'O';
    socket.emit('move', { field: e.target.id.toString(), player: currentPlayer });
}

function win() {
    for (const combination of combinations) {
        let f = returnBoardField(combination[0]);
        if (!f) continue;
        let isWinningCombination = true;
        for(const comb of combination) {
            if(returnBoardField(comb) !== f) {
                isWinningCombination = false;
                break;
            }
        }
        if (isWinningCombination) return { isWin: true, combination }
    }
    return { isWin: false, combination: null } 
}

winner = null;

socket.on('player-won', ({ combination, username }) => {
    if (winner) return;
    winner = username;
    combination.forEach(comb => document.getElementById(comb.toString()).style.color = 'red');
    boxes.forEach(box => {
        box.removeEventListener('click', main);
        box.style.cursor = 'default';
    });

    let counter = 5;
    document.getElementById('disconnect-message-win').style.display = 'block';
    document.getElementById('winner').innerHTML = username;
    setInterval(() => {
        counter--;
        document.getElementById('disconnect-counter-win').innerHTML = counter;
        if (counter === 0) {
            socket.emit('disconnect');
            window.location.href = clientUrl;
            return null;
        }
    }, 1000);
});

socket.on('no-win', () => {
    let counter = 5;
    document.getElementById('disconnect-message-no-win').style.display = 'block';
    setInterval(() => {
        counter--;
        document.getElementById('disconnect-counter-no-win').innerHTML = counter;
        if (counter === 0) {
            socket.emit('disconnect');
            window.location.href = clientUrl;
            return null;
        }
    }, 1000);
})

function isBoardFilled() {
    for(i=0; i<3; i++) {
        for(j=0; j<3; j++) {
            if (board[i][j] === '') return false;
        }
    }
    return true;
}

socket.on('move-event', ({ field, player }) => {
    document.getElementById(field).innerHTML = player;
    document.getElementById(field).style.cursor = 'default';
    const [row, column] = translateFields[parseInt(field)];
    board[row][column] = player;
    const { isWin, combination = null } = win();
    if (isBoardFilled() && !isWin) return socket.emit('no-winner');
    if (isWin) socket.emit('win', { combination });
    turn++;
    yourTurn = true;
});
socket.on('block', () => yourTurn = false);
socket.on('hide-message', () => document.getElementById('turn-info').innerHTML = '');
socket.on('one-player-message', () => document.getElementById('err-info').innerHTML = 'Jesteś sam w pokoju...');

// ------------------------------------------------

socket.on('hide-message', () => document.getElementById('err-info').innerHTML = '');

//chat related things
const submit = document.getElementById('submit-send');
submit.addEventListener('click', evt => {
    evt.preventDefault();
    const message = document.getElementById('send').value;
    socket.emit('chat-message', message);
    document.getElementById('send').value = '';
})

socket.on('msg', ({ username, message, date }) => {
    const messageContent = `<div class="message"><p id="sender">${username}</p><p id="msg">${message}</p><p id="date">${date}</p></div>`;
    document.getElementById('chat-container').innerHTML += messageContent;
});
// ----

socket.on('disconnect-room', () => {
    let counter = 5;
    document.getElementById('disconnect-message').style.display = 'block';
    setInterval(() => {
        counter--;
        document.getElementById('disconnect-counter').innerHTML = counter;
        if (counter === 0) {
            socket.emit('disconnect');
            window.location.href = clientUrl;
            return null;
        }
    }, 1000);
});
