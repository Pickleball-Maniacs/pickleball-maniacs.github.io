const sheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?output=csv";

const playersSheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR97VZM4O7V0oOctE2u3wguWJYScpbN4xliRWULVFkSGQRev0uDVwpIEaEA28HXXMLJ8S7zBqWHGgpm/pub?gid=920055948&output=csv";

const appsScriptURL =
    "https://script.google.com/macros/s/AKfycbwPWuv8SSwwZ6oQuo8_xar1jnP2YJHUrpls0lzk_2f7eSJZJD0HfW1cqdUQEfXVz-VxzA/exec";


// ======================================
// LOAD GAMES
// ======================================

async function loadGames() {

    const gamesContainer = document.getElementById("games");

    try {

        const response = await fetch(sheetURL);

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        const playersResponse = await fetch(playersSheetURL);

        const playersCSV = await playersResponse.text();

        const playersRows = parseCSV(playersCSV);


        gamesContainer.innerHTML = "";


        let upcomingGames = 0;


        rows.slice(1).forEach((game, index) => {

            if (game.length < 7) {
                return;
            }


            const date = game[0];
            const startTime = game[1];
            const endTime = game[2];
            const gameName = game[3];
            const venue = game[4];
            const address = game[5];
            const court = game[6];


            // ======================================
            // CHECK IF GAME IS ALREADY FINISHED
            // ======================================

            const endDateTime = parseDateTime(date, endTime);

            if (endDateTime && endDateTime <= new Date()) {
                return;
            }


            upcomingGames++;


            // ======================================
            // COUNT PLAYERS
            // ======================================

            const gameId = index;

            const playerCount = playersRows
                .slice(1)
                .filter(player =>
                    player[0] === String(gameId) &&
                    player[1]
                )
                .length;


            let playerText;

            if (playerCount === 1) {
                playerText = "👥 1 Player";
            } else {
                playerText = `👥 ${playerCount} Players`;
            }


            // ======================================
            // DATE DISPLAY
            // ======================================

            const displayDate = new Date(date);

            let dayNumber = "";
            let monthName = "";


            if (!isNaN(displayDate)) {

                dayNumber = displayDate.getDate();

                monthName = displayDate.toLocaleString(
                    "en-US",
                    {
                        month: "short"
                    }
                );

            }


            // ======================================
            // CREATE GAME CARD
            // ======================================

            const card = document.createElement("article");

            card.className = "game-card";


            card.innerHTML = `

                <div class="game-date">

                    <strong>
                        ${escapeHTML(String(dayNumber))}
                    </strong>

                    <span>
                        ${escapeHTML(monthName)}
                    </span>

                </div>


                <div class="game-info">

                    <h3>
                        ${escapeHTML(gameName)}
                    </h3>


                    <p>
                        🕐 ${escapeHTML(startTime)}
                        - ${escapeHTML(endTime)}
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


                    <div class="players">

                        ${playerText}

                    </div>


                    <button
                        onclick="window.location.href='game.html?id=${gameId}'"
                    >
                        View Game
                    </button>

                </div>

            `;


            gamesContainer.appendChild(card);

        });


        // ======================================
        // NO UPCOMING GAMES
        // ======================================

        if (upcomingGames === 0) {

            gamesContainer.innerHTML = `

                <p>
                    No upcoming games scheduled.
                </p>

            `;

        }


    } catch (error) {

        console.error("Error loading games:", error);

        gamesContainer.innerHTML = `

            <p>
                Unable to load games.
            </p>

        `;

    }

}


// ======================================
// SHOW ADD SCHEDULE FORM
// ======================================

function showScheduleForm() {

    const form = document.getElementById("schedule-form");

    if (!form) {
        return;
    }


    form.style.display = "block";


    form.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ======================================
// HIDE ADD SCHEDULE FORM
// ======================================

function hideScheduleForm() {

    const form = document.getElementById("schedule-form");

    if (!form) {
        return;
    }


    form.style.display = "none";

}


// ======================================
// SUBMIT ADD SCHEDULE
// ======================================

async function submitSchedule(event) {

    event.preventDefault();


    const date =
        document.getElementById("schedule-date").value;

    const startTime =
        document.getElementById("schedule-start").value;

    const endTime =
        document.getElementById("schedule-end").value;

    const gameName =
        document.getElementById("schedule-game-name").value.trim();

    const venue =
        document.getElementById("schedule-venue").value.trim();

    const address =
        document.getElementById("schedule-address").value.trim();

    const court =
        document.getElementById("schedule-court").value.trim();


    // ======================================
    // CHECK TIME
    // ======================================

    if (endTime <= startTime) {

        alert("End time must be later than start time.");

        return;

    }


    // ======================================
    // SEND TO GOOGLE APPS SCRIPT
    // ======================================

    try {

        await fetch(appsScriptURL, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain"
            },

            body: JSON.stringify({

                action: "schedule",

                date: date,

                startTime: startTime,

                endTime: endTime,

                gameName: gameName,

                venue: venue,

                address: address,

                court: court

            })

        });


        alert("✅ Schedule added successfully!");


        // Clear form

        document
            .getElementById("add-schedule-form")
            .reset();


        // Hide form

        hideScheduleForm();


        // Reload games

        loadGames();


    } catch (error) {

        console.error("Error adding schedule:", error);

        alert(
            "❌ Something went wrong while adding the schedule."
        );

    }

}


// ======================================
// PARSE DATE + TIME
// ======================================

function parseDateTime(dateValue, timeValue) {

    const date = new Date(dateValue);

    if (isNaN(date)) {
        return null;
    }


    const timeParts = timeValue
        .toLowerCase()
        .match(/(\d+):(\d+)\s*(am|pm)/);


    if (timeParts) {

        let hours = parseInt(timeParts[1]);

        const minutes = parseInt(timeParts[2]);

        const ampm = timeParts[3];


        if (ampm === "pm" && hours !== 12) {
            hours += 12;
        }


        if (ampm === "am" && hours === 12) {
            hours = 0;
        }


        date.setHours(hours);

        date.setMinutes(minutes);

        date.setSeconds(0);

        date.setMilliseconds(0);


        return date;

    }


    return null;

}


// ======================================
// CSV PARSER
// ======================================

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

            row.push(value);

            value = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (value !== "" || row.length > 0) {

                row.push(value);

                rows.push(row);

            }

            row = [];

            value = "";

        } else {

            value += char;

        }

    }


    if (value !== "" || row.length > 0) {

        row.push(value);

        rows.push(row);

    }


    return rows;

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// START
// ======================================

loadGames();
