import { useEffect, useRef, useState } from 'react';
import './App.css';

// Fixed set of floating hearts: each gets a random horizontal spot, size,
// speed, and start delay so they don't all drift up in a single-file line.
const FLOATING_HEARTS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: Math.random() * 16 + 14,
  duration: Math.random() * 6 + 8,
  delay: Math.random() * 10,
}));

// The heart balloons up for 6 seconds before the arrow strikes it — every
// other celebration animation is timed off this. Matches the "6s" duration
// hardcoded on .balloon-heart's grow animation in App.css.
const STRIKE_TIME = 6;
// After impact the arrow holds, pierced through the heart, for a beat before
// both shatter together. Matches the delay hardcoded on .balloon-pop /
// .cupid-arrow's shatter animation and .confetti-piece / .personal-message.
const EXPLOSION_TIME = STRIKE_TIME + 0.3;
// Fireworks keep firing across the screen for 4 seconds after the explosion.
const FIREWORKS_WINDOW = 4;

// Confetti bursts outward from the heart, then falls and fades.
const CONFETTI_COLORS = ['#f5cd7e', '#ff9ad5', '#c9b6ff', '#fffbe8'];
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 160 + 90;
  return {
    id: i,
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance,
    rotation: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.15,
  };
});

// Big firework bursts scattered across the whole screen, staggered across
// FIREWORKS_WINDOW so they keep firing continuously rather than all at once.
// Colors are brighter/more saturated than the confetti palette so each burst
// actually reads as a firework rather than a faint dust cluster.
const FIREWORK_COLORS = ['#ffd76a', '#ff5da2', '#b98bff', '#ffffff'];
const FIREWORK_BURSTS = Array.from({ length: 14 }, (_, b) => {
  const particleCount = 16;
  const color = FIREWORK_COLORS[b % FIREWORK_COLORS.length];
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = Math.random() * 130 + 170;
    return { tx: Math.cos(angle) * distance, ty: Math.sin(angle) * distance };
  });
  return {
    id: b,
    left: 8 + Math.random() * 84,
    top: 8 + Math.random() * 70,
    color,
    delay: EXPLOSION_TIME + Math.random() * FIREWORKS_WINDOW,
    particles,
  };
});

function App() {
  const [isAccepted, setIsAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  // Where the "No" button sits inside its dodge zone, as % of the zone's size
  const [noPos, setNoPos] = useState({ top: '50%', left: '68%' });
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Browsers block audio with sound from autoplaying until the visitor has
  // interacted with the page. Try to play immediately; if that's blocked,
  // fall back to starting on the very first click/tap anywhere.
  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = 0.45;
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();

    const startOnInteraction = () => {
      tryPlay();
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };
    document.addEventListener('click', startOnInteraction);
    document.addEventListener('touchstart', startOnInteraction);
    return () => {
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };
  }, []);

  // Native `loop` restarts the song instantly. Instead, wait 5s of silence
  // after it ends before playing it again from the top.
  const handleSongEnded = () => {
    setTimeout(() => {
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }, 5000);
  };

  // This function runs when "Yes" is clicked
  const handleYesClick = () => {
    setIsAccepted(true);
  };

  // Jumps the "No" button to a random spot within its dodge zone. Left is
  // kept clear of the Yes button's fixed spot (top: 50%, left: 20%) so the
  // two never overlap.
  const moveNoButton = () => {
    const newTop = Math.random() * 75 + 10; // 10%-85%
    const newLeft = Math.random() * 45 + 45; // 45%-90%, well clear of Yes
    setNoPos({ top: `${newTop}%`, left: `${newLeft}%` });
  };

  // This function runs when "No" is clicked
  const handleNoClick = () => {
    setNoCount(noCount + 1);
    moveNoButton();
  };

  // Logic to make the "Yes" button grow every time "No" is clicked, capped
  // so it can't outgrow its dodge zone after many clicks
  const yesButtonSize = Math.min(noCount * 20 + 16, 110);

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
      <audio ref={audioRef} src="/feel-the-love.mp3" muted={isMuted} onEnded={handleSongEnded} />
      <button
        className="music-toggle"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? '🔇' : '🎵'}
      </button>
      <div className="hearts-layer" aria-hidden="true">
        {FLOATING_HEARTS.map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            style={{
              left: `${heart.left}%`,
              fontSize: `${heart.size}px`,
              animationDuration: `${heart.duration}s`,
              animationDelay: `${heart.delay}s`,
            }}
          >
            💗
          </span>
        ))}
      </div>
      {isAccepted && (
        <div className="fireworks-layer" aria-hidden="true">
          {FIREWORK_BURSTS.map((burst) => (
            <div
              key={burst.id}
              className="firework-burst"
              style={{ left: `${burst.left}%`, top: `${burst.top}%` }}
            >
              <span
                className="firework-flash"
                style={{ backgroundColor: burst.color, animationDelay: `${burst.delay}s` }}
              />
              {burst.particles.map((particle, i) => (
                <span
                  key={i}
                  className="firework-particle"
                  style={{
                    '--tx': `${particle.tx}px`,
                    '--ty': `${particle.ty}px`,
                    backgroundColor: burst.color,
                    color: burst.color,
                    animationDelay: `${burst.delay}s`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      {isAccepted ? (
        <div className="celebration">
          <div className="burst-stage">
            <span className="balloon-heart" aria-hidden="true">❤️</span>
            <div className="cupid-arrow" aria-hidden="true" />

            <div className="confetti-layer" aria-hidden="true">
              {CONFETTI_PIECES.map((piece) => (
                <span
                  key={piece.id}
                  className="confetti-piece"
                  style={{
                    '--tx': `${piece.tx}px`,
                    '--ty': `${piece.ty}px`,
                    '--rot': `${piece.rotation}deg`,
                    backgroundColor: piece.color,
                    animationDelay: `${EXPLOSION_TIME + piece.delay}s`,
                  }}
                />
              ))}
            </div>
          </div>

          <h1 className="personal-message">
            Having such a beautiful soul as you in my life is a blessing from God,
            I appreciate and adore you.
          </h1>
          <p className="signature">— Carlos</p>
        </div>
      ) : (
        <div className="question-ui">
          <span className="emoji-placeholder" role="img" aria-label="Cute Bear">🐻</span>
          <h1>Mary, will you be my girlfriend?</h1>
          <div className="button-group">
            <button
              className="yes-button"
              style={{ fontSize: `${yesButtonSize}px` }}
              onClick={handleYesClick}
            >
              Yes
            </button>
            <button
              className="no-button"
              style={{ top: noPos.top, left: noPos.left }}
              onClick={handleNoClick}
              onMouseEnter={moveNoButton}
            >
              {getNoButtonText()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
