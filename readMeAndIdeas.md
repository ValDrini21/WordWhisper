# Read Me file

# Ideas

- Create a game for kids using Speech recognition web speech Api feature
- Game name "Word Whisper"
- Features:
  - A button which user would click to talk
  - A text box area in which user would see his speech converted into text
  - If user does not have a mic device please return a message 'You need a mic to play this game'
  - Story: In the beginning of the game just take the name of the user and do not do anything till user confirms his name, after we get the user name display it on the screen and ask user if this is his correct name, to confirm it
  - Store the name of the user and display it on a box
  - Display a text "Please click 'Talk' button and say 'Start game' to start the game"
  - Create a dir images with some sub dir's like: animals, numbers, cartoons
  - Download some pictures for each category
  - When game starts display a text "Please choose one category in which you want to play" and listen for mic
  - Respond to the user if they say the wrong category with: 'Please choose one of the categories by speaking the category name correctly"
  - When user has chosen one category then in random way display a picture with a text box "what is the name of this: {categoryName}"
  - Create a json file, inside a json object with categories and data about these categories like: categoryName, imagePath, alternativePronunciations, level and points
  - If user answers correctly collect his points in a points variable
  - Give the option 'skip' to the user, check if he says the word skip and if yes move on
  - In the end give the result to the user and display a text box 'Do you want to play again'
  - If user says yes to the above question start the game from the beginning
  - Check if we can add Albanian Language into the game
  - Add a progress bar as user moves on with the questions
  - Game sounds when user gets a category item name correctly like 'Ding' or incorrectly like 'buzz'
  - Sound effects based on the category selected by user

---

Tasks

- remove same words, use toLower to compare the result - done
- Do something (display animation, like pulse or wave) when listening class is added to talk-button-container div - done
- Play Sound only play one instance of sound - done
- If we move to another category stop the sound immediately - done
- Play Sound, add the option to pause sound - done
- Display progress bar - done
- Display confetti on the end of the category - done
- Skip feature - done
- Add points based on the speed of the answer by user, like if user guesses right under 2s give him +5 points, if under 5s +3, under 10s +1 else no extra points - done
