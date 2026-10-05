const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?output=csv";

async function loadGames() {
    const gamesContainer = document.getElementById("games");

    try {
        const response = await fetch(sheetURL);

        if (!response.ok) {
            throw new Error("Unable to load schedule.");
        }

        const csvText = await response.text();
        const games = parseCSV(csvText);

        gamesContainer.innerHTML = "";

        games.slice(1).forEach((game, index) => {
            if (game.length < 7 || !game[0]) {
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

            // Create the game's ending date/time
            const gameEnd = parseDateTime(date, endTime);

            // Hide games that have already finished
            if (gameEnd && gameEnd <= new Date()) {
                return;
            }

            const gameDate = new Date(date);

            const day = gameDate.getDate();

            const month = gameDate.toLocaleDateString("en-US", {
                month: "short"
            }).toUpperCase();

            const fullDate = gameDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });

            const card = document.createElement("article");

            card.className = "game-card";

            card.innerHTML = `
                <div class="game-date">
                    <strong>${day}</strong>
                    <span>${month}</span>
                </div>

                <div class="game-info">

                    <h3>${escapeHTML(gameName)}</h3>

                    <p>📅 ${fullDate}</p>
                    <p>🕐 ${escapeHTML(startTime)} – ${escapeHTML(endTime)}</p>
                    <p>📍 ${escapeHTML(venue)}</p>
                    <p>🏠 ${escapeHTML(address)}</p>
                    <p>🏟️ ${escapeHTML(court)}</p>

                    <div class="players">
                        👥 Player list coming soon
                    </div>

                    <button onclick="viewGame(${index})">
                        View Game
                    </button>

                </div>
            `;

            gamesContainer.appendChild(card);
        });

        if (gamesContainer.innerHTML === "") {
            gamesContainer.innerHTML = "<p>No upcoming games found.</p>";
        }

    } catch (error) {
        console.error(error);

        gamesContainer.innerHTML =
            "<p>Unable to load games right now. Please try again later.</p>";
    }
}


// Convert Google Sheet date + time into a JavaScript Date
function parseDateTime(dateString, timeString) {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return null;
    }

    const time = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

    if (!time) {
        return null;
    }

    let hours = parseInt(time[1]);
    const minutes = parseInt(time[2]);
    const period = time[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
        hours += 12;
    }

    if (period === "AM" && hours === 12) {
        hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);

    return date;
}


// Simple CSV parser that supports commas inside fields
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
        } else if ((char === "\n" || char === "\r") && !insideQuotes) {

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


// Prevent HTML from being inserted directly into the page
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Temporary button for the next phase
function viewGame(index) {
    alert("Game details will be available soon!");
}


// Load games when the page opens
loadGames();
