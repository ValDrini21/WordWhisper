console.log(`
%cWord Whisper
%cCreated by Valdrin Nasufi

%cA speech recognition game that makes learning fun!
`,
    'color: #3b82f6; font-size: 24px; font-weight: bold;',
    'color: #6b7280; font-size: 14px; font-style: italic;',
    'color: #4b5563; font-size: 12px;'
);

let gameState = {
    currentCategory: null,
    remainingItems: [],
    currentItem: null,
    totalItems: 0,
    completedItems: 0,
    userScore: 0,
    isGameActive: false,
    categories: [],
    isSoundPlaying: false,
    currentSoundPath: null,
    skippedItems: [],
    questionStartTime: null,
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
        // console.log('Categories loaded:', data);
        gameState.categories = data.categories;
        displayCategories(data.categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display categories in the game-categories div
function getRotationClass(index) {
    switch (index) {
        case 0: return '-rotate-6 mt-20';  // First card
        case 1: return 'rotate-0';         // Second card
        case 2: return 'rotate-6 mt-20';   // Third card
        default: return 'rotate-0';
    }
}

function displayCategories(categories) {
    const categoriesContainer = document.getElementById('game-categories');
    categoriesContainer.innerHTML = categories.map((category, index) => `
        <div class="category-card ${getRotationClass(index)}" data-category-id="${category.id}">
            <img src="${category.imagePath}" alt="${category.name}" class="w-64 h-64 object-cover rounded" />
            <h3 class="text-lg font-semibold">${category.name}</h3>
            <p class="text-sm text-gray-600">${category.description}</p>
        </div>
    `).join('');

    // Add instruction text
    const instruction = document.createElement('p');
    const instructionText = document.getElementById('game-instruction-text');
    instruction.className = "text-center text-lg font-semibold mt-12";
    instruction.textContent = "Please choose a category by speaking on the mic to continue";
    instructionText.appendChild(instruction);

    // Add skip hint
    const skipHint = document.createElement('p');
    skipHint.className = "text-center text-sm text-gray-500 mt-2";
    skipHint.textContent = "Tip: During the game, you can say 'skip' to skip the current item";
    instructionText.appendChild(skipHint);
}

// Add this function to check for microphone availability
async function checkMicrophoneAvailability() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        return hasMicrophone;
    } catch (error) {
        console.error('Error checking microphone:', error);
        return false;
    }
}

// Add this function to display microphone error message
function displayMicrophoneError(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="text-center text-red-600 font-semibold">
            <p class="text-xl mb-2">You need a microphone to play this game</p>
            <p class="text-sm">Please connect a microphone and refresh the page</p>
        </div>
    `;
}

// Modify the startSpeech function
async function startSpeech() {
    const hasMicrophone = await checkMicrophoneAvailability();

    if (!hasMicrophone) {
        displayMicrophoneError('game-question');
        return;
    }

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

    // console.log("Playing sound:", soundPath);
    // console.log("ShouldStopCurrentSound:", ShouldStopCurrentSound);
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
    // console.log("Playing audios:", playingAudios);

    // Stop all stoppable sounds
    playingAudios.forEach(audio => {
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
        // console.log("Selected category:", category);
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
        // console.log('Category items loaded:', data);

        gameState.remainingItems = data.items.filter(item =>
            item.categoryId === categoryId
        );

        // Set total items count
        gameState.totalItems = gameState.remainingItems.length;
        gameState.completedItems = 0;

        // Show progress bar
        const progressContainer = document.getElementById('progress-container');
        progressContainer.classList.remove('hidden');

        // Update progress bar
        updateProgressBar();

        // console.log('Remaining items:', gameState.remainingItems);
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
    gameState.questionStartTime = Date.now();

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

    updateProgressBar();

    // Remove the displayed item from remaining items
    gameState.remainingItems.splice(randomIndex, 1);
}

// Add function to update progress bar
function updateProgressBar() {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;

    const progress = (gameState.completedItems / gameState.totalItems) * 100;

    // Update progress bar width
    const progressBar = progressContainer.querySelector('.bg-blue-600');
    progressBar.style.width = `${progress}%`;

    // Update text
    const textContainer = progressContainer.querySelector('.flex.justify-between');
    textContainer.innerHTML = `
        <span>${gameState.completedItems} of ${gameState.totalItems} items</span>
        <span>${Math.round(progress)}%</span>
    `;
}

// Check user's answer
function calculateBonusPoints(responseTime) {
    if (responseTime <= 2) return 5;
    if (responseTime <= 5) return 3;
    if (responseTime <= 10) return 1;
    return 0;
}

function checkAnswer(transcript) {
    // console.log("Checking answer:", transcript);
    if (transcript.toLowerCase() === 'skip') {
        gameState.skippedItems.push(gameState.currentItem);
        playSound('sounds/general/skip.wav', false);
        displayNextItem();

        return;
    }

    const isCorrect = gameState.currentItem.alternativePronunciations.some(
        pronunciation => pronunciation.toLowerCase() === transcript
    );

    if (isCorrect) {
        // Calculate response time in seconds
        const responseTime = (Date.now() - gameState.questionStartTime) / 1000;
        const bonusPoints = calculateBonusPoints(responseTime);
        const totalPoints = gameState.currentItem.points + bonusPoints;

        gameState.userScore += totalPoints;
        gameState.completedItems++;

        playSound('sounds/general/ding.wav', false);
        displayNextItem();
    } else {
        playSound('sounds/general/buzzer.mp3', false);
    }
}

// Add this function to handle confetti
function triggerConfetti() {
    const count = 300;
    const defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    // Fire multiple confetti bursts with different configurations
    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}

// Modify endCategory to include confetti
function endCategory() {
    // Stop all sounds when category ends
    stopCurrentSound();

    // Hide progress bar
    const progressContainer = document.getElementById('progress-container');
    progressContainer.classList.add('hidden');


    const questionContainer = document.getElementById('game-question');
    questionContainer.innerHTML = `
        <div class="text-center">
            <h2 class="text-2xl font-bold mb-4">Hooray! You've completed the category!</h2>
            <p class="text-xl mb-4">Your score is: ${gameState.userScore}</p>
            <p class="text-lg">Speak the word 'Play again' to start over</p>
        </div>
    `;

    // Handle skipped items
    const skippedContainer = document.getElementById('skipped-items-container');
    if (gameState.skippedItems.length > 0) {
        skippedContainer.classList.remove('hidden');
        const skippedItemsContent = skippedContainer.querySelector('.flex.flex-wrap');
        skippedItemsContent.innerHTML = gameState.skippedItems.map(item => `
            <div class="bg-white p-4 rounded shadow w-64">
                <div class="h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                        src="${item.imagePath}"
                        alt="${item.categoryId}"
                        class="w-full h-full object-contain"
                    />
                </div>
                <p class="text-lg font-semibold text-center mt-2">${item.alternativePronunciations[0]}</p>
            </div>
        `).join('');
    } else {
        skippedContainer.classList.add('hidden');
    }

    // Trigger confetti
    triggerConfetti();
}

// Add these new functions to handle UI elements
function resetGameElements() {
    // Hide progress bar
    const progressContainer = document.getElementById('progress-container');
    progressContainer.classList.add('hidden');

    // Reset progress bar width
    const progressBar = progressContainer.querySelector('.bg-blue-600');
    progressBar.style.width = '0%';

    // Show categories container
    const categoriesContainer = document.getElementById('game-categories');
    categoriesContainer.style.display = '';

    // Show instruction text
    const instructionText = document.getElementById('game-instruction-text');
    instructionText.style.display = '';

    // Clear question container
    const questionContainer = document.getElementById('game-question');
    questionContainer.innerHTML = '';

    // Hide skipped items container
    const skippedContainer = document.getElementById('skipped-items-container');
    skippedContainer.classList.add('hidden');
}

function resetGameState() {
    gameState.userScore = 0;
    gameState.currentItem = null;
    gameState.remainingItems = [];
    gameState.isGameActive = false;
    gameState.currentCategory = null;
    gameState.totalItems = 0;
    gameState.completedItems = 0;
    gameState.skippedItems = [];
}

// Refactored playAgain function
function playAgain() {
    // Stop all sounds when starting over
    stopCurrentSound();
    playSound('sounds/general/play-again.wav');

    // Reset game state and UI elements
    resetGameState();
    resetGameElements();
}

// Initialize the game
document.addEventListener('DOMContentLoaded', async () => {
    const hasMicrophone = await checkMicrophoneAvailability();

    if (!hasMicrophone) {
        displayMicrophoneError('game-categories');
        return;
    }

    loadCategories();
});

