import { Chessboard } from 'react-chessboard';
import { useChessGame } from '../hooks/useChessGame';
import GameOverModal from './game-page-components/GameOverModal';

export default function ChessBoardComponent() {
  const {
    game,
    onDrop,
    onSquareClick,
    onSquareRightClick,
    optionSquares,
    rightClickedSquares,
    resetGame,
    resignGame,
    undoMove,
    lastLog,
    whiteTime,
    blackTime,
    gameOver,
    gameResult
  } = useChessGame();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.boardWrapper}>
          <div style={styles.profileItem}>
            <div style={styles.avatar}>OP</div>
            <div>
              <strong>Opponent</strong>
              <div style={styles.subtext}>Rating: 1200</div>
              <div style={styles.clock}>{Math.floor(blackTime / 60)}:{(blackTime % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>

          <div style={styles.board}>
            <Chessboard
              id="ClickToMoveBoard"
              key={game.fen()}
              animationDuration={200}
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onSquareRightClick={onSquareRightClick}
              customDarkSquareStyle={{ backgroundColor: '#779556' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
              customSquareStyles={{
                ...optionSquares,
                ...rightClickedSquares,
              }}
            />
          </div>

          <div style={styles.profileItem}>
            <div style={styles.avatar}>ME</div>
            <div>
              <strong>You</strong>
              <div style={styles.subtext}>Rating: 1200</div>
              <div style={styles.clock}>{Math.floor(whiteTime / 60)}:{(whiteTime % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.historyHeader}>Move History</div>
          <div style={styles.moveList}>
            {game.history().map((move, index) => (
              <div key={index} style={styles.moveItem}>
                <span style={styles.moveNumber}>{index % 2 === 0 ? `${Math.floor(index / 2) + 1}.` : ''}</span>
                {move}
              </div>
            ))}
          </div>
          <div style={styles.controls}>
            <button style={{ ...styles.controlBtn, background: '#d9534f' }} onClick={resignGame}>Resign</button>
            <button style={{ ...styles.controlBtn, background: '#f0ad4e' }} onClick={undoMove}>Undo</button>
            <button style={styles.resetBtn} onClick={resetGame}>
              New Game
            </button>
          </div>
        </div>
      </div>
      <GameOverModal show={gameOver} message={gameResult} onNewGame={resetGame} />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#302e2b',
    color: '#fff',
    minHeight: '100vh',
    width: '100vw',
    overflow: 'auto',
    fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    maxWidth: '1200px',
    width: '95%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '20px 0',
  },
  boardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    maxWidth: '600px',
  },
  board: {
    width: '100%',
    flexGrow: 1,
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
  },
  profileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    width: '100%',
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '5px',
    background: '#7fa650',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.2em',
  },
  subtext: {
    fontSize: '0.9em',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600', // Matching user reference
  },
  sidebar: {
    height: '100%',
    width: '350px',
    minWidth: '300px',
    background: '#262421',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  },
  historyHeader: {
    padding: '15px',
    background: '#211f1c',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1.1em',
    borderBottom: '1px solid #3a3835',
  },
  moveList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  moveItem: {
    width: '50%',
    padding: '5px 10px',
    fontSize: '1em',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  moveNumber: {
    color: '#666',
    marginRight: '10px',
    minWidth: '20px',
    textAlign: 'right',
  },
  controls: {
    padding: '20px',
    borderTop: '1px solid #3a3835',
    background: '#211f1c',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
  },
  resetBtn: {
    width: '100%',
    padding: '15px',
    background: '#81b64c',
    border: 'none',
    color: 'white',
    fontSize: '1.1em',
    fontWeight: 'bold',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  controlBtn: {
    width: '48%',
    padding: '10px',
    border: 'none',
    color: 'white',
    fontSize: '1em',
    fontWeight: 'bold',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '10px',
    marginRight: '4%',
  },
  clock: {
    background: '#000',
    color: '#0f0',
    padding: '2px 5px',
    borderRadius: '3px',
    fontFamily: 'monospace',
    marginTop: '5px'
  }
};
