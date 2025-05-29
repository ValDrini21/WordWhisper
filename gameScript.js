let gameState = {
    currentCategory: null,
    remainingItems: [],
    currentItem: null,
    userScore: 0,
    isGameActive: false,
    categories: [],
    isSoundPlaying: false,
    currentSoundPath: null
};

let currentAudio = null;
let playingAudios = [];

// Speech Recognition Setup
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-US';

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch('gameCategories.json');
        const data = await response.json();
        console.log('Categories loaded:', data);
        gameState.categories = data.categories;
        displayCategories(data.categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display categories in the game-categories div
function displayCategories(categories) {
    const categoriesContainer = document.getElementById('game-categories');
    categoriesContainer.innerHTML = categories.map((category, index) => {
        // Define rotation classes based on index
        let rotationClass = '';
        if (index === 0) rotationClass = '-rotate-6 mt-20';  // First card
        else if (index === 1) rotationClass = 'rotate-0';  // Second card
        else if (index === 2) rotationClass = 'rotate-6 mt-20';  // Third card
        else rotationClass = 'rotate-0';

        return `
        <div class="category-card ${rotationClass}" data-category-id="${category.id}">
            <img src="${category.imagePath}" alt="${category.name}" class="w-64 h-64 object-cover rounded" />
            <h3 class="text-lg font-semibold">${category.name}</h3>
            <p class="text-sm text-gray-600">${category.description}</p>
        </div>
        `;
    }).join('');

    // Add instruction text
    const instruction = document.createElement('p');
    const instructionText = document.getElementById('game-instruction-text');
    instruction.className = "text-center text-lg font-semibold mt-12";
    instruction.textContent = "Please choose a category by speaking on the mic to continue";
    instructionText.appendChild(instruction);
}

function startSpeech() {
    if (!recognition) {
        alert("Speech recognition is not supported in your browser");
        return;
    }

    recognition.start();
    const talkButtonContainer = document.getElementById('talk-button-container');
    talkButtonContainer.classList.add('listening');
    document.querySelector('.sound-wave').style.display = 'flex';
}

// Select category based on speech
function selectCategory(transcript) {
    return gameState.categories.find(cat =>
        cat.name.toLowerCase() === transcript
    );
}

// Play category sound effect
function playSound(soundPath, ShouldStopCurrentSound = true) {
    if (!soundPath) {
        return;
    }

    // If the same sound is already playing, don't play it again
    if (gameState.isSoundPlaying && gameState.currentSoundPath === soundPath) {
        return;
    }

    console.log("Playing sound:", soundPath);
    console.log("ShouldStopCurrentSound:", ShouldStopCurrentSound);
    // Create and play new sound
    currentAudio = new Audio(soundPath);
    currentAudio.ShouldStopCurrentSound = ShouldStopCurrentSound;

    // Update game state
    gameState.isSoundPlaying = true;
    gameState.currentSoundPath = soundPath;

    // Add to our tracking array
    playingAudios.push(currentAudio);

    // Update UI to show pause button
    updateSoundButton(soundPath, true);

    currentAudio.play().catch(error => {
        console.error('Error playing sound:', error);
        gameState.isSoundPlaying = false;
        gameState.currentSoundPath = null;
        updateSoundButton(soundPath, false);
    });

    // Handle sound end
    currentAudio.onended = () => {
        gameState.isSoundPlaying = false;
        gameState.currentSoundPath = null;
        updateSoundButton(soundPath, false);
    };
}

// New function to pause sound
function pauseSound(soundPath) {
    if (currentAudio && gameState.currentSoundPath === soundPath) {
        currentAudio.pause();
        gameState.isSoundPlaying = false;
        updateSoundButton(soundPath, false);
    }
}

// New function to update the sound button UI
function updateSoundButton(soundPath, isPlaying) {
    const button = document.querySelector(`button[data-sound-path="${soundPath}"]`);
    if (button) {
        if (isPlaying) {
            button.innerHTML = 'Pause Sound';
            button.onclick = () => pauseSound(soundPath);
            button.classList.remove('bg-blue-500');
            button.classList.add('bg-yellow-500');
        } else {
            button.innerHTML = 'Play Sound';
            button.onclick = () => playSound(soundPath, true);
            button.classList.remove('bg-yellow-500');
            button.classList.add('bg-blue-500');
        }
    }
}

function stopCurrentSound() {
    console.log("Stopping current sounds");
    console.log("Playing audios:", playingAudios);

    // Stop all stoppable sounds
    playingAudios.forEach(audio => {
        console.log("Audio isStoppable:", audio.ShouldStopCurrentSound);
        if (audio.ShouldStopCurrentSound) {
            audio.pause();
            audio.currentTime = 0;
        }
    });

    // Clear the array completely
    playingAudios = [];

    // Reset sound state
    gameState.isSoundPlaying = false;
    gameState.currentSoundPath = null;
}


recognition.onresult = async (event) => {
    // console.log("Speech recognized:", event.results);
    const transcript = event.results[0][0].transcript.toLowerCase();
    document.getElementById('speech-text').textContent = transcript;

    if (!gameState.isGameActive) {
        // Handle category selection
        const category = selectCategory(transcript);
        console.log("Selected category:", category);
        if (category) {
            gameState.currentCategory = category;
            playSound(category.soundEffect, false);
            await loadCategoryItems(category.id);
        } else {
            playSound('sounds/general/buzzer.mp3');

            const instructionText = document.getElementById('game-instruction-text');
            if (instructionText) {
                instructionText.classList.add('text-red-500', 'animate-pulse');

                // Remove the feedback classes after a short delay
                setTimeout(() => {
                    instructionText.classList.remove('text-red-500', 'animate-pulse');
                }, 2500);
            }
        }
    } else {
        if (gameState.remainingItems.length === 0) {
            if (transcript === 'play again') {
                playAgain();
                return;
            }
        }
        // Handle game answers
        checkAnswer(transcript);
    }
}

// Add this to your recognition event handlers
recognition.onend = () => {
    const talkButtonContainer = document.getElementById('talk-button-container');
    talkButtonContainer.classList.remove('listening');
    document.querySelector('.sound-wave').style.display = 'none';
};

recognition.onerror = (event) => {
    const talkButtonContainer = document.getElementById('talk-button-container');
    talkButtonContainer.classList.remove('listening');
    document.querySelector('.sound-wave').style.display = 'none';
    console.error('Speech recognition error:', event.error);
};

// Load items for selected category
async function loadCategoryItems(categoryId) {
    try {
        const response = await fetch('gameData.json');
        const data = await response.json();
        console.log('Category items loaded:', data);

        gameState.remainingItems = data.items.filter(item =>
            item.categoryId === categoryId
        );

        console.log('Remaining items:', gameState.remainingItems);
        gameState.isGameActive = true;

        // Hide the categories container
        const categoriesContainer = document.getElementById('game-categories');
        const instructionText = document.getElementById('game-instruction-text');
        categoriesContainer.style.display = 'none';
        instructionText.style.display = 'none';

        // Display the first item
        displayNextItem({ stopSound: false });
    } catch (error) {
        console.error('Error loading category items:', error);
    }
}

// Display next random item
function displayNextItem(options = { stopSound: true }) {
    const { stopSound } = options;
    // Only stop sounds that are marked as stoppable
    if (stopSound) {
        stopCurrentSound();
        gameState.isSoundPlaying = false;
        gameState.currentSoundPath = null;
    }

    if (gameState.remainingItems.length === 0) {
        endCategory();
        return;
    }

    const randomIndex = Math.floor(Math.random() * gameState.remainingItems.length);
    const item = gameState.remainingItems[randomIndex];

    // Store the current item before removing it from remaining items
    gameState.currentItem = item;

    // console.log('Displaying item:', item);

    // Update UI
    const questionContainer = document.getElementById('game-question');
    questionContainer.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <img src="${item.imagePath}" alt="${item.categoryId}" class="max-w-md max-h-96 rounded-lg shadow-md" />
            ${item.soundPath ? `
                <button
                    data-sound-path="${item.soundPath}"
                    onclick="playSound('${item.soundPath}', true)"
                    class="bg-blue-500 text-white px-4 py-2 rounded">
                    Play Sound
                </button>
            ` : ''}
            <p class="text-xl font-semibold">Whisper on the mic to tell us what this is?</p>
        </div>
    `;

    // Remove the displayed item from remaining items
    gameState.remainingItems.splice(randomIndex, 1);
}

// Check user's answer
function checkAnswer(transcript) {
    // console.log("Checking answer:", transcript);

    const isCorrect = gameState.currentItem.alternativePronunciations.some(
        pronunciation => pronunciation.toLowerCase() === transcript
    );

    if (isCorrect) {
        playSound('sounds/general/ding.wav', false);
        gameState.userScore += gameState.currentItem.points;
        displayNextItem();
    } else {
        playSound('sounds/general/buzzer.mp3', false);
    }
}

// End category
function endCategory() {
    // Stop all sounds when category ends
    stopCurrentSound();

    const questionContainer = document.getElementById('game-question');
    questionContainer.innerHTML = `
        <div class="text-center">
            <h2 class="text-2xl font-bold mb-4">Hooray! You've completed the category!</h2>
            <p class="text-xl mb-4">Your score is: ${gameState.userScore}</p>
            <p class="text-lg">Speak the word 'Play again' to start over</p>
        </div>
    `;
}

// When game ends and user wants to play again
function playAgain() {
    // Stop all sounds when starting over
    stopCurrentSound();

    playSound('sounds/general/play-again.wav');

    gameState.userScore = 0;
    gameState.currentItem = null;
    gameState.remainingItems = [];
    gameState.isGameActive = false;
    gameState.currentCategory = null;

    const categoriesContainer = document.getElementById('game-categories');
    categoriesContainer.style.display = ''; // Show the categories container again

    const instructionText = document.getElementById('game-instruction-text');
    instructionText.style.display = ''; // Show the instruction text again

    // Clear the question container
    const questionContainer = document.getElementById('game-question');
    questionContainer.innerHTML = '';
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

