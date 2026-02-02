import { useParams } from "react-router-dom";
import Header from "../components/Header";
import SideNav from "../components/SideNav";
import GameContainer from "../components/game-page-components/GameContainer";


const Game = () => {
  const { gameId } = useParams();

  return (
    <div className="app-container">
      <SideNav /> {/* Render the SideNav */}
      <div className="main-container">
        <Header />
        <GameContainer gameId={gameId} />
      </div>
    </div>
  );
};

export default Game;
