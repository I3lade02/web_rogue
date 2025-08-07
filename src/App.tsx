import { useState, useEffect } from 'react';
import './index.css';

// Konstanta pro velikost dlaždice v pixelech
const TILE_SIZE = 20;

// Konstanta pro typy dlaždic
const TILE_TYPE = {
  WALL: 1,
  FLOOR: 0,
};

// Vytvoření 2D mapového pole naplněného zdmi
const createMap = (width: number, height: number): number[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(TILE_TYPE.WALL));
};

// Generování náhodné místnosti
const generateRoom = (width: number, height: number, minSize: number, maxSize: number) => {
  const roomWidth = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  const roomHeight = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
  const x = Math.floor(Math.random() * (width - roomWidth - 1)) + 1;
  const y = Math.floor(Math.random() * (height - roomHeight - 1)) + 1;
  return { x, y, width: roomWidth, height: roomHeight };
};

// Kontrola, zda se místnost nepřekrývá s jinou
const doesOverlap = (newRoom: any, existingRooms: any[]) => {
  for (const room of existingRooms) {
    if (
      newRoom.x < room.x + room.width + 1 &&
      newRoom.x + newRoom.width + 1 > room.x &&
      newRoom.y < room.y + room.height + 1 &&
      newRoom.y + newRoom.height + 1 > room.y
    ) {
      return true;
    }
  }
  return false;
};

// Vytvoření chodby mezi dvěma místnostmi
const createCorridor = (map: number[][], roomA: any, roomB: any) => {
  const x1 = Math.floor(roomA.x + roomA.width / 2);
  const y1 = Math.floor(roomA.y + roomA.height / 2);
  const x2 = Math.floor(roomB.x + roomB.width / 2);
  const y2 = Math.floor(roomB.y + roomB.height / 2);

  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    map[y1][x] = TILE_TYPE.FLOOR;
  }
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    map[y][x2] = TILE_TYPE.FLOOR;
  }
};

// Hlavní komponenta hry
function App() {
  const [mapWidth, setMapWidth] = useState(50);
  const [mapHeight, setMapHeight] = useState(50);
  const [roomCount, setRoomCount] = useState(50);
  const [minRoomSize, setMinRoomSize] = useState(5);
  const [maxRoomSize, setMaxRoomSize] = useState(15);

  const [map, setMap] = useState<number[][]>(() => {
    const newMap = createMap(mapWidth, mapHeight);
    const rooms: any[] = [];
    let attempts = 0;

    while (rooms.length < roomCount && attempts < 1000) {
      const newRoom = generateRoom(mapWidth, mapHeight, minRoomSize, maxRoomSize);
      if (!doesOverlap(newRoom, rooms)) {
        rooms.push(newRoom);
        for (let y = newRoom.y; y < newRoom.y + newRoom.height; y++) {
          for (let x = newRoom.x; x < newRoom.x + newRoom.width; x++) {
            newMap[y][x] = TILE_TYPE.FLOOR;
          }
        }
      }
      attempts++;
    }

    for (let i = 0; i < rooms.length - 1; i++) {
      createCorridor(newMap, rooms[i], rooms[i+1]);
    }

    return newMap;
  });

  // Stav hráče
  const [player, setPlayer] = useState({ x: 0, y: 0 });

  // Uložíme si pozici první místnosti
  const startRoom = useState(() => {
    const rooms: any[] = [];
    let attempts = 0;
    while (rooms.length < roomCount && attempts < 1000) {
      const newRoom = generateRoom(mapWidth, mapHeight, minRoomSize, maxRoomSize);
      if (!doesOverlap(newRoom, rooms)) {
        rooms.push(newRoom);
      }
      attempts++;
    }
    return rooms[0];
  });

  // Spustíme efekt, který se provede pouze při prvním načtení komponenty
  useEffect(() => {
    // Najdeme střed první místnosti a nastavíme pozici hráče
    const initialX = Math.floor(startRoom[0].x + startRoom[0].width / 2);
    const initialY = Math.floor(startRoom[0].y + startRoom[0].height / 2);
    setPlayer({ x: initialX, y: initialY });

    // Funkce pro obsluhu stisku kláves
    const handleKeyDown = (event: KeyboardEvent) => {
      let newX = player.x;
      let newY = player.y;

      switch (event.key) {
        case 'ArrowUp':
          newY -= 1;
          break;
        case 'ArrowDown':
          newY += 1;
          break;
        case 'ArrowLeft':
          newX -= 1;
          break;
        case 'ArrowRight':
          newX += 1;
          break;
        default:
          return;
      }

      // Kontrola, jestli je nová pozice platná (není to zeď)
      if (newY >= 0 && newY < mapHeight && newX >= 0 && newX < mapWidth && map[newY][newX] === TILE_TYPE.FLOOR) {
        setPlayer({ x: newX, y: newY });
      }
    };

    // Přidání posluchače událostí na stisk kláves
    window.addEventListener('keydown', handleKeyDown);

    // Odstranění posluchače při unmountu komponenty
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [player, map, mapWidth, mapHeight]);

  return (
    <div className="flex justify-center items-center w-screen h-screen bg-gray-900">
      <div
        className="game-map shadow-2xl"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${mapWidth}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${mapHeight}, ${TILE_SIZE}px)`,
        }}
      >
        {map.flat().map((tile, index) => {
          const x = index % mapWidth;
          const y = Math.floor(index / mapWidth);

          let tileClass = 'bg-gray-700';
          if (tile === TILE_TYPE.FLOOR) {
            tileClass = 'bg-slate-300';
          }

          // Pokud je dlaždice na pozici hráče, změníme její barvu
          if (x === player.x && y === player.y) {
            tileClass = 'bg-red-500';
          }

          return (
            <div
              key={index}
              className={`
                w-[${TILE_SIZE}px] h-[${TILE_SIZE}px]
                ${tileClass}
              `}
            ></div>
          );
        })}
      </div>
    </div>
  );
}

export default App;