// Define key variables
let rows = document.querySelectorAll('.row');
let currentRow = 0; // max row will be 5 for 6 guesses
let currentTile = 0; // max tile will be 4 for 5 letters
let minTile = 0;
let maxRow = 5;
let maxTile = 4;

let words = [];
let guessableWords = [];
let chosenWord;
let flipping = false;
let gameOver = false;
const keys = document.querySelectorAll('.key');
const closeMenu = document.getElementById('close-button');
const menu = document.getElementById('statistics-container');
const openMenu = document.getElementById('open-menu-button');
const playAgain = document.getElementById('play-again-button');


chooseWord();
setKeys();
setTypeIntoBox();
addEventListeners();

// choose a word
function chooseWord() {
    fetch('words.txt')
    .then(response => response.text())
    .then(data => {
        words = data.split('\n').map(word => word.trim().toUpperCase());
        // Choose word after words are loaded
        chosenWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log('Chosen word:', chosenWord);
    })
    .catch(error => console.error('Error loading word list:', error));

    fetch('guesses.txt').then(r => r.text())
    .then(d => {
        guessableWords = d.split('\n').map(w=>w.trim().toUpperCase()); 
        for(let word of words) {
            guessableWords.push(word);
        }
    })
    .catch(e=>console.log("Error loading word list:", e));
}

// handle typing from the onscreen keyboard
function setKeys() {
    keys.forEach(key => {
        key.addEventListener('click', () => {
            const keyboardEvent = new KeyboardEvent('keydown', {
                key: `${key.dataset.key}`
            });
            document.dispatchEvent(keyboardEvent);
        });
    });   
}

// Handle entering text
function setTypeIntoBox() {
    document.addEventListener('keydown', event => {
        const tiles = rows[currentRow].querySelectorAll('.tile');
        if (gameOver || flipping) {
            return;
        }
        if (/^[a-zA-Z]$/.test(event.key) && currentTile <= maxTile)  {
            tiles[currentTile].textContent = event.key.toUpperCase();
            tiles[currentTile].classList.add('pop');
            currentTile++;
        } else if (event.key === 'Backspace' && currentTile > minTile) {
            currentTile--;
            tiles[currentTile].textContent = '';
            tiles[currentTile].classList.remove('pop');
        } else if (event.key === 'Enter') {
            let guess = '';
            tiles.forEach(tile => { guess += tile.textContent.toUpperCase(); });
            let canMoveToNextRow = guess.length === 5;
            if (!canMoveToNextRow) {
                toaster(rows[currentRow], 'length');
            } else {
                if (checkWordValidity(guess)) {
                    checkGuess(guess, tiles);
                    if (currentRow < maxRow) {
                        currentRow++;
                        currentTile = 0;
                    } else if (currentRow == maxRow && guess != chosenWord) {
                        toaster(null, 'lose');
                    }
                } else {
                    toaster(rows[currentRow], 'word');
                }
            }
        }
    });
}

function addEventListeners() {

    closeMenu.addEventListener('click', hideMenu);
    openMenu.addEventListener('click', showMenu);

    // play again button

    playAgain.addEventListener('click', () => {
        currentRow = 0;
        currentTile = 0;
        hideMenu();
        resetGame();
        chooseWord(); 
    });
}

// create appropriate toasters
function toaster(row, type) {
    const toasterParent = document.getElementById('toaster-container');
    const toaster = document.createElement('div');
    toaster.classList.add('toaster');
    toaster.classList.add('fade');
    toaster.addEventListener('animationend', () => {
        toaster.remove();
    });
    toasterParent.appendChild(toaster);
    switch (type) {
        case 'length':
            toaster.textContent = 'Not enough letters';
            shakeRow(row);
            break;
        case 'word':
            toaster.textContent = 'Not in word list';
            shakeRow(row);
            break;
        case 'win':
            toaster.textContent = 'Great';
            toaster.style.animationDelay = '2.3s';
            break;
        case 'last-guess':
            toaster.textContent = 'Phew';
            toaster.style.animationDelay = '2.3s';
            break;
        case 'lose':
            toaster.classList.remove('toaster');
            toaster.classList.remove('fade');
            setTimeout(() => {
                toaster.textContent = chosenWord;
                toaster.classList.add('toaster');
            }, 1700); 
    }
}

// add appropriate incorrect animations
function shakeRow(row) {
    row.classList.add('shake');
    row.addEventListener('animationend', () => {
        row.classList.remove('shake');
    });
}

// Checking guess
function checkWordValidity(guess) {
    return guessableWords.includes(guess);
}

function checkGuess(guess, tiles) {
    let guessArray = Array.from(guess);
    let chosenWordArray = Array.from(chosenWord);
    let won = false;

    if (guess == chosenWord) {
        won = true;
    }

    let letterClrs = new Array(guessArray.length).fill('grey'); // Initialize to grey

    // First pass: check for exact matches (green)
    for (let i = 0; i < guessArray.length; i++) {
        if (guessArray[i] === chosenWordArray[i]) {
            letterClrs[i] = 'green';
            chosenWordArray[i] = null; // Mark as matched
            guessArray[i] = null; // Mark as matched
        }
    }

    // Second pass: check for partial matches (yellow)
    for (let i = 0; i < guessArray.length; i++) {
        if (guessArray[i] !== null && chosenWordArray.includes(guessArray[i])) {
            letterClrs[i] = 'yellow';
            chosenWordArray[chosenWordArray.indexOf(guessArray[i])] = null; // Mark as matched
        }
    }

    // Mark out rest of the letters in gray
    

    flipTiles(tiles, letterClrs, won, guess);
}

function flipTiles(tiles, letterClrs, won, guessArray) {
    flipping = true;
    let counter = 0;

    function flipFunc() {
        tiles[counter].classList.add('flipAnim');
        tiles[counter].classList.add(letterClrs[counter]);
        counter++;
        if (counter > 4) {
            clearInterval(flipper);
            flipping = false;
            for (let i = 0; i < letterClrs.length; i++) {
                let keyInQuestion = document.querySelector(`[data-key="${guessArray[i].toUpperCase()}"]`);
                if (letterClrs[i] == 'green') {
                    keyInQuestion.style.backgroundColor = "var(--green)";
                } else if (letterClrs[i] == 'yellow') {
                    keyInQuestion.style.backgroundColor = "var(--yellow)";
                } else if (letterClrs[i] == 'grey') {
                    keyInQuestion.style.backgroundColor = "var(--dark-grey)";
                }
            }
            if (won) {
                winGame(tiles);
            }
        }
    }

    flipFunc(); // Call immediately

    let flipper = setInterval(flipFunc, 300);
}

function winGame(tiles) {
    gameOver = true;
    let numGuesses = currentRow+1;
    localStorage.setItem('recent_game_guesses', numGuesses);
    trackData();
    let flipper;
    
    if (currentRow == 5) {
        toaster(null, 'last-guess');
    } else {
        toaster(null, 'win');
    }
    
    let counter = 0;

    function flipFunc() {
        tiles[counter].classList.add('correct');
        counter++;
        if (counter > 4) {
            clearInterval(flipper);
            showMenu();
        }
    }

    setTimeout(() => {
        flipper = setInterval(flipFunc, 100)
    }, 350);
}

// stats animations:

function hideMenu() {
    menu.classList.remove('fadeUp');
    menu.classList.add('fadeDown');
}
    
function showMenu() {
    if (!gameOver) {
        document.querySelector('#buttons-container').style.display = 'none';
    } else {
        document.querySelector('#buttons-container').style.display = 'flex';
    }
    menu.classList.remove('fadeDown');
    menu.classList.add('fadeUp');
}

function resetGame() {
    const tiles = document.querySelectorAll('.tile');
    gameOver = false;
    tiles.forEach(tile => {
        tile.style.backgroundColor = 'var(--black)';
        tile.textContent = '';
        tile.classList.remove('pop', 'flipAnim', 'green', 'yellow', 'grey', 'correct');
    });
    keys.forEach(key => {
        key.style.backgroundColor = 'var(--key-bg)';
    });
}

function trackData() {

    // get most recent guess
    const mostRecentGuesses = localStorage.getItem('recent_game_guesses');
    
    // get the chart to track guess distribution
    
    if (!localStorage.getItem('guess_distribution')) {
        localStorage.setItem('guess_distribution', new Array(6).fill(0));
    }

    let guessDistribution = JSON.parse(localStorage.getItem('guess_distribution'));

    let totalGuesses = 0;
    guessDistribution.forEach(g => {
        totalGuesses += g;
    });


    //update the chart to match the most recent guess
    guessDistribution[mostRecentGuesses]++;
    console.log(guessDistribution)

    // update bar length
    const bars = document.querySelectorAll('.bar');
    const barLength = document.querySelector('.guess-container').offsetWidth;
    bars.forEach((bar, index) => {
        const setBarWidth = ((barLength / totalGuesses) * guessDistribution[index]) + bar.offsetWidth;
        bar.style.width = setBarWidth;
    });
}
