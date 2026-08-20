import { useState } from 'react';
import './App.css';

function App() {
  const [isAccepted, setIsAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);

  // This function runs when "Yes" is clicked
  const handleYesClick = () => {
    setIsAccepted(true);
  };

  // This function runs when "No" is clicked
  const handleNoClick = () => {
    setNoCount(noCount + 1);
  };

  // Logic to make the "Yes" button grow every time "No" is clicked
  const yesButtonSize = noCount * 20 + 16;

  // Messages that change as they keep saying "No"
  const getNoButtonText = () => {
    const phrases = [
      "No",
      "Are you sure?",
      "Really sure?",
      "Think again!",
      "Last chance!",
      "Surely not?",
      "You might regret this!",
      "Give it another chance!",
      "Are you absolutely sure?",
      "This could be a mistake!",
      "Have a heart!",
      "Don't be so cold!",
      "Change of heart?",
      "Is that your final answer?",
      "You're breaking my heart ;("
    ];
    return phrases[Math.min(noCount, phrases.length - 1)];
  };

  return (
    <div className="proposal-container">
      {isAccepted ? (
        <div className="celebration">
          <img src="https://tenor.com" alt="Hearts" />
          <h1>Yay!!! I love you! ❤️</h1>
        </div>
      ) : (
        <div className="question-ui">
          <img src="https://tenor.com" alt="Cute Bear" />
          <h1>Will you be my girlfriend?</h1>
          <div className="button-group">
            <button 
              className="yes-button" 
              style={{ fontSize: `${yesButtonSize}px` }} 
              onClick={handleYesClick}
            >
              Yes
            </button>
            <button className="no-button" onClick={handleNoClick}>
              {getNoButtonText()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
