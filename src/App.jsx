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

// The heart swells in heartbeat-like pulses, each bigger than the last, for
// 8 seconds before it bursts — every other celebration animation is timed
// off this. Matches the "8s" duration hardcoded on .balloon-heart's grow
// animation in App.css.
const STRIKE_TIME = 8;
// After the final swell the heart holds for a beat before it shatters.
// Matches the delay hardcoded on .balloon-pop / .heart-shockwave and
// .confetti-piece / .personal-message.
const EXPLOSION_TIME = STRIKE_TIME + 0.3;
// Fireworks keep firing across the screen for 4 seconds after the explosion.
const FIREWORKS_WINDOW = 4;

// The win-back screen's "Nitangoja" track reveals the kiss ask once
// playback crosses the 1:00 mark.
const KISS_REVEAL_TIME = 60;

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

// The four exhibits pinned to the evidence board in step 2. Fixed (not
// randomized) so the layout doesn't jitter between renders.
const EVIDENCE_ITEMS = [
  { label: 'Exhibit A', tilt: '-3deg', text: 'Her laugh has been linked to a measurable spike in the suspect’s pulse. Reproducible in every trial.' },
  { label: 'Exhibit B', tilt: '2deg', text: 'Suspect observed smiling at his phone for no visible reason. Multiple times a day, every day.' },
  { label: 'Exhibit C', tilt: '-2deg', text: 'Every "just thinking of you" text traces back to one person of interest: Mary.' },
  { label: 'Exhibit D', tilt: '3deg', text: 'Conclusion: prime suspect in the disappearance of my heart — Mary.' },
];

// Story steps that run before the proposal itself: 0 cover, 1 briefing,
// 2 evidence board, 3 verdict, 4 the proposal (existing question/celebration).
function CoverPage({ onOpen }) {
  return (
    <div className="case-page">
      <span className="case-label">File No. 001 &mdash; Confidential</span>
      <h1 className="case-heading">The Case of the Missing Heart</h1>
      <p className="case-byline">Lead Investigator: Carlos</p>
      <button className="case-button" onClick={onOpen}>
        🔍 Open the Case File
      </button>
    </div>
  );
}

function BriefingPage({ onNext }) {
  return (
    <div className="case-page">
      <span className="case-label">Case Briefing</span>
      <h1 className="case-heading">Something Has Gone Missing</h1>
      <p className="case-text">
        {`It started a few months ago — quietly, without a trace.\n\nMy heart went missing.\n\nI've retraced every step and followed every lead. They all point to the same place: wherever Mary is.`}
      </p>
      <button className="case-button" onClick={onNext}>
        Continue Investigation &rarr;
      </button>
    </div>
  );
}

function EvidencePage({ onNext }) {
  return (
    <div className="case-page">
      <span className="case-label">Evidence Board</span>
      <h1 className="case-heading">The Investigation</h1>
      <div className="evidence-board">
        {EVIDENCE_ITEMS.map((item) => (
          <div key={item.label} className="evidence-card" style={{ '--tilt': item.tilt }}>
            <span className="evidence-label">{item.label}</span>
            {item.text}
          </div>
        ))}
      </div>
      <button className="case-button" onClick={onNext}>
        I&apos;ve Reached a Conclusion &rarr;
      </button>
    </div>
  );
}

function VerdictPage({ onNext }) {
  return (
    <div className="case-page">
      <span className="case-stamp">Case Closed</span>
      <h1 className="case-heading">The Verdict</h1>
      <p className="case-text">
        After a thorough investigation, the evidence is undeniable: I am completely, hopelessly in love with you, Mary.
      </p>
      <button className="case-button" onClick={onNext}>
        There&apos;s One More Thing I Need to Ask...
      </button>
    </div>
  );
}

// Steps after the proposal: 5 the rating gauge, 6 the "above 5" ending,
// 7 the "5 or below" win-back screen (loops back to 5 to try again).
function RatingPage({ rating, onRatingChange, onSubmit }) {
  return (
    <div className="case-page">
      <span className="case-label">One More Question</span>
      <h1 className="case-heading">How Am I Doing?</h1>
      <p className="case-text">
        On a scale from 1 to 10 — 10 being the highest, 1 the lowest — how would you rate me so far?
      </p>
      <div className="gauge-wrap">
        <div className="gauge-value">{rating}</div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={rating}
          onChange={(e) => onRatingChange(Number(e.target.value))}
          className="gauge-slider"
          aria-label="Rating from 1 to 10"
        />
        <div className="gauge-scale">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
      <button className="case-button" onClick={onSubmit}>
        OK
      </button>
    </div>
  );
}

function KissPage() {
  return (
    <div className="case-page">
      <span className="emoji-placeholder" role="img" aria-label="Kiss mark">💋</span>
      <h1 className="case-heading">I&apos;d Love to Kiss You Now</h1>
    </div>
  );
}

function WinBackPage({ showKissReveal, showRateAgain, onPlay, onRetry }) {
  return (
    <div className="case-page">
      <span className="case-label">Challenge Accepted</span>
      <h1 className="case-heading">Let Me Change Your Mind</h1>
      {!showKissReveal ? (
        <>
          <p className="case-text">Listen to this.</p>
          <button className="case-button" onClick={onPlay}>
            ▶ Play
          </button>
        </>
      ) : (
        <>
          <h1 className="case-heading">I&apos;d Love to Kiss You</h1>
          {showRateAgain && (
            <button className="case-button" onClick={onRetry}>
              Rate Me Again
            </button>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  // 0 cover, 1 briefing, 2 evidence, 3 verdict, 4 proposal, 5 rating gauge,
  // 6 "above 5" ending, 7 "5 or below" win-back screen (loops back to 5)
  const [step, setStep] = useState(0);
  const [isAccepted, setIsAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  // Where the "No" button sits inside its dodge zone, as % of the zone's size
  const [noPos, setNoPos] = useState({ top: '50%', left: '68%' });
  const [isMuted, setIsMuted] = useState(false);
  const [rating, setRating] = useState(5);
  const [showKissReveal, setShowKissReveal] = useState(false);
  const [showRateAgain, setShowRateAgain] = useState(false);
  const audioRef = useRef(null);
  const winBackAudioRef = useRef(null);

  useEffect(() => {
    audioRef.current.volume = 0.45;
  }, []);

  // The cover page's button is the visitor's first interaction, so it's a
  // safe place to start audio without hitting the browser's autoplay block.
  const handleOpenCase = () => {
    audioRef.current.play().catch(() => {});
    setStep(1);
  };

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

  // Above 5 goes straight to the finale; 5 or below loops into the
  // win-back screen, which sends her back here to try the gauge again.
  const handleRatingSubmit = () => {
    if (rating > 5) {
      setStep(6);
      return;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setStep(7);
  };

  const handleWinBackPlay = () => {
    winBackAudioRef.current.play().catch(() => {});
  };

  // "Nitangoja" reveals the ask once it crosses the 1:00 mark; the "Rate Me
  // Again" button only shows up once the song has finished playing.
  const handleWinBackTimeUpdate = () => {
    if (winBackAudioRef.current.currentTime >= KISS_REVEAL_TIME) {
      setShowKissReveal(true);
    }
  };

  const handleWinBackEnded = () => {
    setShowRateAgain(true);
  };

  const handleWinBackRetry = () => {
    winBackAudioRef.current.pause();
    winBackAudioRef.current.currentTime = 0;
    setShowKissReveal(false);
    setShowRateAgain(false);
    setStep(5);
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
      <audio
        ref={winBackAudioRef}
        src="/Nitangoja.mp3"
        muted={isMuted}
        onTimeUpdate={handleWinBackTimeUpdate}
        onEnded={handleWinBackEnded}
      />
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
      {step === 4 && isAccepted && (
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
      {step === 0 && <CoverPage onOpen={handleOpenCase} />}
      {step === 1 && <BriefingPage onNext={() => setStep(2)} />}
      {step === 2 && <EvidencePage onNext={() => setStep(3)} />}
      {step === 3 && <VerdictPage onNext={() => setStep(4)} />}
      {step === 4 && (
        isAccepted ? (
          <div className="celebration">
            <div className="burst-stage">
              <div className="balloon-heart" aria-hidden="true">
                <span className="heart-shine" />
              </div>
              <span className="heart-shockwave" aria-hidden="true" />

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
            <button className="case-button want-more-button" onClick={() => setStep(5)}>
              Want More?
            </button>
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
        )
      )}
      {step === 5 && (
        <RatingPage rating={rating} onRatingChange={setRating} onSubmit={handleRatingSubmit} />
      )}
      {step === 6 && <KissPage />}
      {step === 7 && (
        <WinBackPage
          showKissReveal={showKissReveal}
          showRateAgain={showRateAgain}
          onPlay={handleWinBackPlay}
          onRetry={handleWinBackRetry}
        />
      )}
    </div>
  );
}

export default App;
