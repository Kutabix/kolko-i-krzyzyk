const serverUrl = 'https://socket-tic-tac-toe-server.herokuapp.com';

const getRooms = async () => {
    try {
        const data = await (await fetch(`${serverUrl}/rooms`)).json()
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function displayContent() {
    let { rooms } = await getRooms();
    rooms = rooms.map(({ players }) => (players));
    let content = '';
    let iterator = 1;
    for (const room of rooms) {
        let oneRoom = `<li>${iterator}. `;
        for (const player of room) oneRoom += `${player.username}, `;
        oneRoom += '</li>';
        content += oneRoom; 
        iterator++;
    }
    document.getElementById('players-in-room').innerHTML = content;
}

displayContent();

