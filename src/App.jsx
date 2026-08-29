import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import ScratchCard from './ScratchCard';
import './App.css';

// The quote she scratches off right after saying yes.
const POST_PROPOSAL_QUOTE = 'Having such a beautiful soul as you in my life is a blessing from God, I appreciate and adore you.';

// Fixed set of floating hearts: each gets a random horizontal spot, size,
// speed, and start delay so they don't all drift up in a single-file line.
const FLOATING_HEARTS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: Math.random() * 16 + 14,
  duration: Math.random() * 6 + 8,
  delay: Math.random() * 10,
}));

// Shared ambient hearts layer. The app-level one behind it is invisible
// during the photo scene (an opaque full-screen layer stacks above it), so
// the photo scene renders its own copy to keep the mood consistent there too.
function FloatingHearts() {
  return (
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
  );
}

// The four exhibits pinned to the evidence board in step 2. Fixed (not
// randomized) so the layout doesn't jitter between renders.
const EVIDENCE_ITEMS = [
  { label: 'Exhibit A', tilt: '-3deg', text: 'Her laugh has been linked to a measurable spike in the suspect’s pulse. Reproducible in every trial.' },
  { label: 'Exhibit B', tilt: '2deg', text: 'Suspect observed smiling at his phone for no visible reason. Multiple times a day, every day.' },
  { label: 'Exhibit C', tilt: '-2deg', text: 'Every "just thinking of you" text traces back to one person of interest: Mary.' },
  { label: 'Exhibit D', tilt: '3deg', text: 'Conclusion: prime suspect in the disappearance of my heart — Mary.' },
];

// Story steps: 0 cover, 1 briefing, 2 evidence board, 3 verdict,
// 4 the proposal (photo scene), 5 scratch-off quote reveal.
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

// A keepsake scratch-off card shown right after she says yes. Scratching
// away ~80% of the silver layer auto-fades the canvas and calls onRevealed,
// which advances to the closing page.
function ScratchScene({ onRevealed }) {
  return (
    <div className="scratch-scene">
      <span className="case-label">One Last Surprise</span>
      <h1 className="case-heading">Scratch Away the Silver</h1>
      <ScratchCard quote={POST_PROPOSAL_QUOTE} label="Scratch here ✨" onRevealed={onRevealed} />
    </div>
  );
}

// The proposal itself: a photo backdrop with the dodging/growing Yes-No
// pair. Hovering (desktop) or tapping (mobile) "No" teleports it to a
// random spot in the viewport and grows "Yes"; clicking "Yes" fires
// canvas-confetti and the personal voice message (onCelebrate), then hands
// off to onYes (the scratch-off quote reveal) once the confetti has landed.
function PhotoProposalScene({ onCelebrate, onYes }) {
  const [dodgeCount, setDodgeCount] = useState(0);
  const [noPos, setNoPos] = useState({ top: '55%', left: '65%' });

  const dodgeNoButton = () => {
    setDodgeCount((count) => count + 1);
    setNoPos({
      top: `${Math.random() * 78 + 8}%`,
      left: `${Math.random() * 78 + 8}%`,
    });
  };

  const handleYesClick = () => {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    confetti({ particleCount: 70, spread: 60, scalar: 0.75, origin: { y: 0.45 } });
    onCelebrate();
    setTimeout(onYes, 500);
  };

  // Every failed dodge grows Yes a bit more, up to filling most of the screen.
  const yesScale = Math.min(1 + dodgeCount * 0.22, 3.6);

  return (
    <div className="photo-scene">
      <div className="photo-scene__bg" />
      <div className="photo-scene__overlay" />
      <FloatingHearts />
      <div className="photo-scene__content">
        <h1 className="photo-scene__question">Will you officially be my girlfriend?</h1>
        <div className="photo-scene__buttons">
          <button
            className="photo-scene__yes"
            style={{ transform: `scale(${yesScale})` }}
            onClick={handleYesClick}
          >
            YES
          </button>
          <button
            className="photo-scene__no"
            style={{ top: noPos.top, left: noPos.left }}
            onMouseEnter={dodgeNoButton}
            onClick={dodgeNoButton}
            onTouchStart={dodgeNoButton}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}

// The closing page, shown right after the scratch-off quote reveal.
function KissPage() {
  return (
    <div className="case-page">
      <span className="emoji-placeholder" role="img" aria-label="Kiss mark">💋</span>
      <h1 className="case-heading">I&apos;d Love to Kiss You Now</h1>
    </div>
  );
}

function App() {
  // 0 cover, 1 briefing, 2 evidence, 3 verdict, 4 proposal (photo scene),
  // 5 scratch-off quote reveal, 6 closing page
  const [step, setStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const voiceAudioRef = useRef(null);

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

  // Ducks the background music for the personal voice message the instant
  // she says yes, so the two never play over each other.
  const handleProposalCelebrate = () => {
    audioRef.current.pause();
    voiceAudioRef.current.currentTime = 0;
    voiceAudioRef.current.play().catch(() => {});
  };

  // Once the voice message finishes, pick the background music back up
  // right where it left off.
  const handleVoiceEnded = () => {
    audioRef.current.play().catch(() => {});
  };

  return (
    <div className="proposal-container">
      <audio ref={audioRef} src="/feel-the-love.mp3" muted={isMuted} onEnded={handleSongEnded} />
      <audio ref={voiceAudioRef} src="/my-voice.mp3" muted={isMuted} onEnded={handleVoiceEnded} />
      <button
        className="music-toggle"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? '🔇' : '🎵'}
      </button>
      <FloatingHearts />
      {step === 0 && <CoverPage onOpen={handleOpenCase} />}
      {step === 1 && <BriefingPage onNext={() => setStep(2)} />}
      {step === 2 && <EvidencePage onNext={() => setStep(3)} />}
      {step === 3 && <VerdictPage onNext={() => setStep(4)} />}
      {step === 4 && (
        <PhotoProposalScene onCelebrate={handleProposalCelebrate} onYes={() => setStep(5)} />
      )}
      {step === 5 && <ScratchScene onRevealed={() => setStep(6)} />}
      {step === 6 && <KissPage />}
    </div>
  );
}

export default App;
