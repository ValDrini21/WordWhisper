// languageManager.js
export class LanguageManager {
    constructor(recognition, gameState) {
        this.current = 'en-US';
        this.phrases = {};
        this.recognition = recognition;
        this.gameState = gameState;
    }

    async loadLanguagePhrases() {
        try {
            const response = await fetch('langPhrases.json');
            this.phrases = await response.json();
            this.updateCategoryDisplay();
            this.updateInstructions();
        } catch (error) {
            console.error('Error loading language phrases:', error);
        }
    }

    setLanguage(lang) {
        this.current = lang;
        this.recognition.lang = lang;
        this.updateCategoryDisplay();
        this.updateInstructions();
        this.updateHeaderTexts();
    }

    getPhrase(key) {
        return this.phrases[this.current]?.[key] || key;
    }

    updateInstructions() {
        const instructionText = document.getElementById('game-instruction-text');
        if (instructionText) {
            instructionText.innerHTML = `
                <p class="text-center text-lg font-semibold mt-12">${this.getPhrase('chooseCategory')}</p>
                <p class="text-center text-sm text-gray-500 mt-2">${this.getPhrase('skipHint')}</p>
            `;
        }
    }

    updateCategoryDisplay() {
        const categoriesContainer = document.getElementById('game-categories');
        if (categoriesContainer) {
            const categoryCards = categoriesContainer.querySelectorAll('.category-card');
            categoryCards.forEach(card => {
                const categoryId = card.getAttribute('data-category-id');
                const category = this.gameState.categories.find(cat => cat.id === categoryId);
                if (category) {
                    const nameElement = card.querySelector('.category-name');
                    if (nameElement) {
                        nameElement.textContent = category.name[this.current];
                    }

                    const descElement = card.querySelector('.category-description');
                    if (descElement) {
                        descElement.textContent = category.description[this.current];
                    }

                    const imgElement = card.querySelector('img');
                    if (imgElement) {
                        imgElement.alt = category.name[this.current];
                    }
                }
            });
        }
    }

    updateHeaderTexts() {
        const greeting = document.getElementById('greeting');
        const gameTitle = document.getElementById('game-title');
        const skippedItemsTitle = document.getElementById('skipped-items-title');
        const restartButton = document.getElementById('restart-button');

        if (greeting) {
            greeting.innerHTML = `${this.getPhrase('greeting')} <span>👋</span>`;
        }

        if (gameTitle) {
            gameTitle.textContent = this.getPhrase('gameTitle');
        }

        if (skippedItemsTitle) {
            skippedItemsTitle.textContent = this.getPhrase('itemsSkipped');
        }

        if (restartButton) {
            restartButton.textContent = this.getPhrase('restart');
        }
    }

    updateLanguageSelectorVisibility(show) {
        const languageSelection = document.getElementById('language-selection');
        const restartButton = document.getElementById('restart-button');

        if (languageSelection) {
            languageSelection.style.display = show ? 'flex' : 'none';
        }

        if (restartButton) {
            if (show) {
                restartButton.classList.add('hidden');
            } else {
                restartButton.classList.remove('hidden');
            }
        }
    }
}