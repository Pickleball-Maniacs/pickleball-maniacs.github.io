const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?output=csv";
const playersSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?gid=920055948&output=csv";


async function loadGameDetails() {

    const detailsContainer = document.getElementById("game-details");

    const urlParams = new URLSearchParams(window.location.search);
    const gameIndex = parseInt(urlParams.get("id"));

    if (isNaN(gameIndex)) {
        detailsContainer.innerHTML = "<p>Game not found.</p>";
        return;
    }


    try {

        const response = await fetch(sheetURL);

        if (!response.ok) {
            throw new Error("Unable to load schedule.");
        }

        const csvText = await response.text();
        const games = parseCSV(csvText);

        const game = games.slice(1)[gameIndex];


        if (!game || game.length < 7) {
            detailsContainer.innerHTML = "<p>Game not found.</p>";
            return;
        }


        const [
            date,
            startTime,
            endTime,
            gameName,
            venue,
            address,
            court
        ] = game;


        const gameDate = new Date(date);


        const fullDate = gameDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });


        detailsContainer.innerHTML = `

            <article class="game-card">

                <div class="game-date">

                    <strong>${gameDate.getDate()}</strong>

                    <span>
                        ${gameDate.toLocaleDateString("en-US", {
                            month: "short"
                        }).toUpperCase()}
                    </span>

                </div>


                <div class="game-info">

                    <h3>${escapeHTML(gameName)}</h3>

                    <p>📅 ${fullDate}</p>

                    <p>
                        🕐 ${escapeHTML(startTime)}
                        – ${escapeHTML(endTime)}
                    </p>

                    <p>📍 ${escapeHTML(venue)}</p>

                    <p>🏠 ${escapeHTML(address)}</p>

                    <p>🏟️ ${escapeHTML(court)}</p>


                    <div class="players" id="player-list">
    👥 Loading players...
</div>


                    <button onclick="joinGame()">
                        Join Game
                    </button>

                </div>

            </article>

        `;


    } catch (error) {

        console.error(error);

        detailsContainer.innerHTML =
            "<p>Unable to load game details right now.</p>";

    }

}

async function loadPlayers(gameId) {

    try {

        const response = await fetch(playersSheetURL);

        if (!response.ok) {
            throw new Error("Unable to load players.");
        }

        const csvText = await response.text();

        const players = parseCSV(csvText);

        const gamePlayers = players
            .slice(1)
            .filter(player => String(player[0]) === String(gameId))
            .map(player => player[1])
            .filter(name => name);

        return gamePlayers;

    } catch (error) {

        console.error(error);

        return [];

    }

}


// CSV parser
function parseCSV(text) {

    const rows = [];

    let row = [];
    let value = "";

    let insideQuotes = false;


    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const nextChar = text[i + 1];


        if (char === '"' && insideQuotes && nextChar === '"') {

            value += '"';
            i++;

        } else if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === "," && !insideQuotes) {

            row.push(value.trim());
            value = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && nextChar === "\n") {
                i++;
            }


            row.push(value.trim());


            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }


            row = [];
            value = "";

        } else {

            value += char;

        }

    }


    if (value !== "" || row.length > 0) {

        row.push(value.trim());


        if (row.some(cell => cell !== "")) {
            rows.push(row);
        }

    }


    return rows;
}


// Prevent HTML injection
function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// Temporary Join Game button
async function joinGame() {

    const playerName = prompt("Enter your name:");

    if (!playerName) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get("id");

    try {

        await fetch(
            "https://script.google.com/macros/s/AKfycbxYU0E7_glbCWqq_JEvK3GwsuFmblbUPzGSQMTDC1n3b-IrBg41y3WweCLguUNAj0Hmag/exec",
            {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: JSON.stringify({
                    gameId: gameId,
                    playerName: playerName.trim()
                })
            }
        );

        alert(`Thanks ${playerName}! You joined the game.`);

        loadGameDetails();

    } catch (error) {

        console.error(error);

        alert("Unable to join the game right now.");

    }

}


// Back button
function goBack() {

    window.location.href = "index.html";

}


// Load the selected game
loadGameDetails();
