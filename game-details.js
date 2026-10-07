const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?output=csv";

const playersSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?gid=920055948&output=csv";

const appsScriptURL =
    "https://script.google.com/macros/s/AKfycbwPWuv8SSwwZ6oQuo8_xar1jnP2YJHUrpls0lzk_2f7eSJZJD0HfW1cqdUQEfXVz-VxzA/exec";


// ======================================
// LOAD GAME DETAILS
// ======================================

async function loadGameDetails() {

    const detailsContainer = document.getElementById("game-details");

    const urlParams = new URLSearchParams(window.location.search);
    const gameIndex = parseInt(urlParams.get("id"));

    if (isNaN(gameIndex)) {

        detailsContainer.innerHTML =
            "<p>Game not found.</p>";

        return;

    }


    try {

        const response = await fetch(sheetURL);

        if (!response.ok) {

            throw new Error(
                "Unable to load schedule."
            );

        }


        const csvText = await response.text();

        const games = parseCSV(csvText);

        const game = games.slice(1)[gameIndex];


        if (!game || game.length < 7) {

            detailsContainer.innerHTML =
                "<p>Game not found.</p>";

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


        const fullDate =
            gameDate.toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );


        detailsContainer.innerHTML = `

            <article class="game-card">

                <div class="game-date">

                    <strong>
                        ${gameDate.getDate()}
                    </strong>

                    <span>
                        ${gameDate
                            .toLocaleDateString(
                                "en-US",
                                {
                                    month: "short"
                                }
                            )
                            .toUpperCase()}
                    </span>

                </div>


                <div class="game-info">

                    <h3>
                        ${escapeHTML(gameName)}
                    </h3>


                    <p>
                        📅 ${fullDate}
                    </p>


                    <p>
                        🕐 ${escapeHTML(startTime)}
                        –
                        ${escapeHTML(endTime)}
                    </p>


                    <p>
                        📍 ${escapeHTML(venue)}
                    </p>


                    <p>
                        🏠 ${escapeHTML(address)}
                    </p>


                    <p>
                        🏟️ ${escapeHTML(court)}
                    </p>


                    <div
                        class="players"
                        id="player-list"
                    >
                        👥 Loading players...
                    </div>


                    <button
                        id="join-game-button"
                        onclick="joinGame()"
                    >
                        Join Game
                    </button>

                </div>

            </article>

        `;


        // Load existing players

        const playerList =
            document.getElementById(
                "player-list"
            );


        const players =
            await loadPlayers(gameIndex);


        displayPlayers(players);


    } catch (error) {

        console.error(error);

        detailsContainer.innerHTML =
            "<p>Unable to load game details right now.</p>";

    }

}


// ======================================
// LOAD PLAYERS FROM GOOGLE SHEETS
// ======================================

async function loadPlayers(gameId) {

    try {

        const response =
            await fetch(playersSheetURL);


        if (!response.ok) {

            throw new Error(
                "Unable to load players."
            );

        }


        const csvText =
            await response.text();


        const players =
            parseCSV(csvText);


        const gamePlayers =
            players
                .slice(1)
                .filter(
                    player =>
                        String(player[0]) ===
                        String(gameId)
                )
                .map(
                    player =>
                        player[1]
                )
                .filter(
                    name =>
                        name
                );


        return gamePlayers;


    } catch (error) {

        console.error(error);

        return [];

    }

}


// ======================================
// DISPLAY PLAYERS
// ======================================

function displayPlayers(players) {

    const playerList =
        document.getElementById(
            "player-list"
        );


    if (!playerList) {
        return;
    }


    if (players.length === 0) {

        playerList.innerHTML =
            "👥 No players yet.";

        return;

    }


    playerList.innerHTML = `

        👥 Players (${players.length}):
        <br>

        ${players
            .map(
                (name, index) =>
                    `${index + 1}. ${escapeHTML(name)}`
            )
            .join("<br>")}

    `;

}


// ======================================
// JOIN GAME
// ======================================

async function joinGame() {

    const playerName =
        prompt("Enter your name:");


    if (!playerName) {
        return;
    }


    const cleanName =
        playerName.trim();


    if (!cleanName) {
        return;
    }


    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const gameId =
        urlParams.get("id");


    if (!gameId) {

        alert(
            "Unable to identify this game."
        );

        return;

    }


    // ======================================
    // SHOW PLAYER IMMEDIATELY
    // ======================================

    const playerList =
        document.getElementById(
            "player-list"
        );


    if (playerList) {

        const currentPlayers =
            await getCurrentDisplayedPlayers();


        currentPlayers.push(cleanName);


        displayPlayers(
            currentPlayers
        );

    }


    // Disable button temporarily

    const joinButton =
        document.getElementById(
            "join-game-button"
        );


    if (joinButton) {

        joinButton.disabled = true;

        joinButton.textContent =
            "Joining...";

    }


    // ======================================
    // SAVE TO GOOGLE SHEETS
    // ======================================

    try {

        await fetch(
            appsScriptURL,
            {
                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type": "text/plain"
                },

                body: JSON.stringify({

                    action: "join",

                    gameId: gameId,

                    playerName: cleanName

                })

            }
        );


        alert(
            `Thanks ${cleanName}! You joined the game.`
        );


    } catch (error) {

        console.error(error);

        alert(
            "Unable to save your registration right now."
        );

    }


    // Re-enable button

    if (joinButton) {

        joinButton.disabled = false;

        joinButton.textContent =
            "Join Game";

    }

}


// ======================================
// GET CURRENT DISPLAYED PLAYERS
// ======================================

async function getCurrentDisplayedPlayers() {

    const playerList =
        document.getElementById(
            "player-list"
        );


    if (!playerList) {
        return [];
    }


    // If the player list has already loaded,
    // read the names from the current display.

    const lines =
        playerList.innerText
            .split("\n")
            .map(
                line =>
                    line.trim()
            )
            .filter(
                line =>
                    line
            );


    const names = [];


    lines.forEach(line => {

        const match =
            line.match(
                /^\d+\.\s+(.+)$/
            );


        if (match) {

            names.push(
                match[1]
            );

        }

    });


    return names;

}


// ======================================
// CSV PARSER
// ======================================

function parseCSV(text) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char = text[i];

        const nextChar =
            text[i + 1];


        if (
            char === '"' &&
            insideQuotes &&
            nextChar === '"'
        ) {

            value += '"';

            i++;


        } else if (
            char === '"'
        ) {

            insideQuotes =
                !insideQuotes;


        } else if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(
                value.trim()
            );

            value = "";


        } else if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                nextChar === "\n"
            ) {

                i++;

            }


            row.push(
                value.trim()
            );


            if (
                row.some(
                    cell =>
                        cell !== ""
                )
            ) {

                rows.push(row);

            }


            row = [];

            value = "";


        } else {

            value += char;

        }

    }


    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(
            value.trim()
        );


        if (
            row.some(
                cell =>
                    cell !== ""
            )
        ) {

            rows.push(row);

        }

    }


    return rows;

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================
// BACK BUTTON
// ======================================

function goBack() {

    window.location.href =
        "index.html";

}


// ======================================
// LOAD SELECTED GAME
// ======================================

loadGameDetails();
