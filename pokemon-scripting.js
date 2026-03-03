/*
    Name: Marcos Rivera
    Class: CIS 4004
    Date: 3/3/2026
    Assignment: Asynchronous JavaScript and Fetch
*/

// DOM.
const pokeInput = document.getElementById("pokeInput");
const findBtn = document.getElementById("findBtn");
const statusEl = document.getElementById("status");

const pokeImage = document.getElementById("pokeImage");
const pokeAudio = document.getElementById("pokeAudio");
const audioNote = document.getElementById("audioNote");

const movesArea = document.getElementById("movesArea");
const addBtn = document.getElementById("addBtn");

const moveSelects = 
[
    document.getElementById("move1"),
    document.getElementById("move2"),
    document.getElementById("move3"),
    document.getElementById("move4")
];

const teamBox = document.getElementById("teamBox");
const clearTeamBtn = document.getElementById("clearTeamBtn");

// Holds Current Pokemon.
let currentPokemon = null;

// Team List.
let team = loadTeamFromStorage();
renderTeam();

// Find Does Fetch or Cache and Updates Screen.
findBtn.addEventListener("click", () =>
{
    const query = pokeInput.value.trim().toLowerCase();

    if (!query)
    {
        setStatus("Please enter a Pokemon name or ID.");
        return;
    }
    fetchAndDisplayPokemon(query);

});

// Enter for Search.
pokeInput.addEventListener("keydown", (e) =>
{
    if (e.key === "Enter") findBtn.click();
});

// Add to Team Stores Moves and Shows in Team.
addBtn.addEventListener("click", () =>
{
    if(!currentPokemon) return;

    // Read Move Choices.
    const chosenMoves = moveSelects.map(sel => sel.value);

    // Builds Team Member Object.
    const member =
    {
        id: currentPokemon.id,
        name: currentPokemon.name,
        sprite: getBestSprite(currentPokemon),
        moves: chosenMoves
    };

    team.push(member);
    saveTeamToStorage();
    renderTeam();
    setStatus(`Added ${capitalize(currentPokemon.name)} to your team!`);
});

// Clear Team.
clearTeamBtn.addEventListener("click", () =>
{
    team = [];
    saveTeamToStorage();
    renderTeam();
    setStatus("Team cleared.");
});

// Async.
async function fetchAndDisplayPokemon(query)
{
    try
    {
        setStatus("Loading...");
        resetDisplay();

        // Get Pokemon Data.
        const data = await getPokemonData(query);

        currentPokemon = data;

        // Display Sprite.
        const spriteUrl = getBestSprite(data);
        if (spriteUrl)
        {
            pokeImage.src = spriteUrl;
            pokeImage.classList.remove("hidden");
        }
        else
        {
            pokeImage.classList.add("hidden");
        }

        // Load Audio.
        loadPokemonAudio(data);

        // Load Moves.
        populateMoveDropdowns(data);

        // Show Moves and Add.
        movesArea.classList.remove("hidden");
        addBtn.classList.remove("hidden");

        setStatus(`Loaded: ${capitalize(data.name)} (#${data.id})`);

    }
    catch (err)
    {
    console.error(err);
    setStatus("Pokemon not found! Try a different name or ID (1-151).");
    }

}

// Caching and Fetch.
async function getPokemonData(query)
{
    // Check Cache Initially.
    const cacheKey = "pokemon_" + query;
    const cached = localStorage.getItem(cacheKey);

    if (cached)
    {
        // Parse Back to Object.
        return JSON.parse(cached);
    }

    // Not Cached, Fetch from PokeAPI.
    const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Pokemon not found");

    const data = await res.json();

    // Store Result.
    localStorage.setItem(cacheKey, JSON.stringify(data));

    return data;
}

// Moves.
function populateMoveDropdowns(pokemonData)
{
    // Extracting Move Names.
    const moves = (pokemonData.moves || [])
        .map(m => m?.move?.name)
        .filter(Boolean);

    const finalMoves = moves.length ? moves : ["(no moves found)"];

    // Fill Dropdowns.
    moveSelects.forEach((sel, index) =>
    {
        sel.innerHTML = "";

        finalMoves.forEach(moveName =>
        {
            const opt = document.createElement("option");
            opt.value = moveName;
            opt.textContent = moveName;
            sel.appendChild(opt);
        });

        // Different Defaults.
        sel.selectedIndex = Math.min(index, finalMoves.length - 1);
  });
}

// Audio.
function loadPokemonAudio(pokemonData)
{
    // Resetting Audio.
    pokeAudio.pause();
    pokeAudio.removeAttribute("src");
    pokeAudio.load();

    // Extensive Cry Checks.
    const cryUrl = pokemonData?.cries?.latest || pokemonData?.cries?.legacy;

    if (cryUrl)
    {
        pokeAudio.src = cryUrl;
        pokeAudio.classList.remove("hidden");
        audioNote.classList.add("hidden");
    }
    else
    {
        pokeAudio.classList.add("hidden");
        audioNote.textContent = "Audio not available for this Pokémon via the API.";
        audioNote.classList.remove("hidden");
    }
}

// Sprites.
function getBestSprite(pokemonData)
{
    // Use Official Work, Use Default as Backup.
    return (
        pokemonData?.sprites?.other?.["official-artwork"]?.front_default ||
        pokemonData?.sprites?.front_default || 
        ""
    );
}

// Team Storage and Rendering.
function saveTeamToStorage()
{
    localStorage.setItem("team_v1", JSON.stringify(team));
}

function loadTeamFromStorage()
{
    const raw = localStorage.getItem("team_v1");
    if (!raw) return [];
    try
    {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    }
    catch
    {
        return [];
    }
}

function renderTeam()
{
    teamBox.innerHTML = "";
    if (team.length === 0) return;

    team.forEach(member =>
    {
        const row = document.createElement("div");
        row.className = "teamRow";

        const img = document.createElement("img");
        img.src = member.sprite;
        img.alt = member.name;

        const details = document.createElement("div");
        const ul = document.createElement("ul");

        member.moves.forEach(m =>
        {
            const li = document.createElement("li");
            li.textContent = m;
            ul.appendChild(li);
        });

        details.appendChild(ul);

        row.appendChild(img);
        row.appendChild(details);
        teamBox.appendChild(row);
    });
}

// UI.
function resetDisplay()
{
    pokeImage.classList.add("hidden");
    pokeImage.removeAttribute("src");
    pokeImage.alt = "";
    
    movesArea.classList.add("hidden");
    addBtn.classList.add("hidden");
    
    pokeAudio.classList.add("hidden");
    audioNote.classList.add("hidden");
}

function setStatus(msg)
{
    statusEl.textContent = msg;
}

function capitalize(str)
{
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);

}

