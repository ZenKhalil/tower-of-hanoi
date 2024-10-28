// Node-klassen, som repræsenterer hvert element i vores stack
class Node {
  /**
   * Opretter en ny node til stacken
   * @param {*} data - Data, der skal gemmes i noden
   * @param {Node|null} next - Referencen til næste node
   */
  constructor(data, next = null) {
    this.data = data;
    this.next = next;
  }
}

// Stack-klassen, som fungerer som en simpel stak
class Stack {
  constructor() {
    this.tail = null; // Henviser til den øverste node i stacken
    this._size = 0; // Holder styr på hvor mange elementer der er
  }

  /**
   * Tilføjer et element til toppen af stacken
   * @param {*} data - Dataen, der skal tilføjes
   * @returns {boolean} - True hvis push lykkes, ellers false
   */
  push(data) {
    const numData = Number(data);
    if (this.isEmpty() || numData < this.peek()) {
      this.tail = new Node(numData, this.tail);
      this._size++;
      return true;
    }
    return false;
  }

  /**
   * Fjerner og returnerer det øverste element fra stacken
   * @returns {*} - Dataen fra den fjernede node, eller null hvis stacken er tom
   */
  pop() {
    if (this.isEmpty()) return null;
    const poppedData = this.tail.data;
    this.tail = this.tail.next;
    this._size--;
    return poppedData;
  }

  /**
   * Ser på det øverste element uden at fjerne det
   * @returns {*} - Dataen fra den øverste node, eller null hvis stacken er tom
   */
  peek() {
    return this.tail ? this.tail.data : null;
  }

  /**
   * Returnerer hvor mange elementer der er i stacken
   * @returns {number} - Størrelsen af stacken
   */
  size() {
    return this._size;
  }

  /**
   * Tjekker om stacken er tom
   * @returns {boolean} - True hvis stacken er tom, ellers false
   */
  isEmpty() {
    return this._size === 0;
  }

  /**
   * Rydder alle elementer fra stacken
   */
  clear() {
    this.tail = null;
    this._size = 0;
  }
}

// Initialisering af Pinde
const pegs = [new Stack(), new Stack(), new Stack()];
const totalDisks = 8;
let moveCount = 0;
let isSolving = false;
let solveTimeout = null;
const solveButton = document.getElementById("solve");

// Initialiser Pinde med Skiver
const initializePegs = () => {
  pegs.forEach((peg) => peg.clear());
  for (let i = totalDisks; i >= 1; i--) pegs[0].push(i);
  moveCount = 0;
  isSolving = false;
  solveButton.textContent = "Løs Spillet";
  render();
};

// Serialisering og Deserialisering af Pinde
const serializePegs = (pegs) =>
  pegs
    .map((peg) => {
      const disks = [];
      let current = peg.tail;
      while (current) {
        disks.push(current.data);
        current = current.next;
      }
      return disks.join(",");
    })
    .join("|");

const deserializePegs = (serialized) =>
  serialized.split("|").map((pegStr) => {
    const stack = new Stack();
    if (pegStr.trim() !== "") {
      const disks = pegStr.split(",").map(Number).reverse();
      disks.forEach((disk) => stack.push(disk));
    }
    return stack;
  });

// Generering af Mulige Træk
const generateMoves = (currentPegs) => {
  const moves = [];
  currentPegs.forEach((fromPeg, from) => {
    if (!fromPeg.isEmpty()) {
      const disk = fromPeg.peek();
      currentPegs.forEach((toPeg, to) => {
        if (from !== to && (toPeg.isEmpty() || disk < toPeg.peek())) {
          moves.push([from, to]);
        }
      });
    }
  });
  return moves;
};

// BFS Algoritme til at finde en sekvens af træk
const findMoveSequence = (startPegs) => {
  const queue = [{ pegs: serializePegs(startPegs), moves: [] }];
  const visited = new Set([serializePegs(startPegs)]);

  while (queue.length) {
    const { pegs: current, moves } = queue.shift();
    const currentPegs = deserializePegs(current);

    if (currentPegs[2].size() === totalDisks) return moves;

    const possibleMoves = generateMoves(currentPegs);
    possibleMoves.forEach(([from, to]) => {
      const newPegs = currentPegs.map((peg) => {
        const newPeg = new Stack();
        const stackElements = [];
        let node = peg.tail;
        while (node) {
          stackElements.push(node.data);
          node = node.next;
        }
        stackElements.reverse().forEach((disk) => newPeg.push(disk));
        return newPeg;
      });

      const disk = newPegs[from].pop();
      if (newPegs[to].push(disk)) {
        const serialized = serializePegs(newPegs);
        if (!visited.has(serialized)) {
          visited.add(serialized);
          queue.push({ pegs: serialized, moves: [...moves, [from, to]] });
        }
      }
    });
  }
  return null;
};

// Udførelse af Træk med Animation
const executeMoves = async (moves) => {
  while (moves.length && isSolving) {
    const [from, to] = moves.shift();
    await new Promise((resolve) => setTimeout(resolve, 300)); // Animation delay

    if (pegs[from].isEmpty()) break;

    const disk = pegs[from].pop();
    if (pegs[to].push(disk)) {
      moveCount++;
      render();
    } else {
      pegs[from].push(disk);
      break;
    }
  }

  if (!isSolving) return;

  if (pegs[2].size() === totalDisks) {
    alert(`Spillet er løst automatisk på ${moveCount} træk.`);
  }

  isSolving = false;
  solveButton.textContent = "Løs Spillet";
};

// Løs Spillet Funktion med Toggle
const solve = () => {
  if (!isSolving) {
    isSolving = true;
    solveButton.textContent = "Stop Løsning";
    const moves = findMoveSequence(pegs);
    if (moves) {
      executeMoves(moves);
    } else {
      alert("Ingen løsning fundet fra den aktuelle tilstand!");
      isSolving = false;
      solveButton.textContent = "Løs Spillet";
    }
  } else {
    isSolving = false;
    solveButton.textContent = "Løs Spillet";
  }
};

// Render Funktion til At Opdatere UI
const render = () => {
  pegs.forEach((peg, i) => {
    const pegElement = document.getElementById(`peg-${i}`);
    pegElement.innerHTML = '<div class="base"></div>';
    const disks = [];
    let current = peg.tail;
    while (current) {
      disks.push(current.data);
      current = current.next;
    }
    disks.reverse().forEach((disk, index) => {
      const diskElement = document.createElement("div");
      diskElement.className = "disk";
      Object.assign(diskElement.style, {
        width: `${disk * 20 + 40}px`,
        backgroundColor: `hsl(${disk * 30}, 70%, 50%)`,
        bottom: `${10 + index * 22}px`,
      });
      diskElement.draggable = true;
      diskElement.textContent = disk;
      diskElement.addEventListener("dragstart", dragStart);
      pegElement.appendChild(diskElement);
    });
  });
  document.getElementById("move-count").innerText = moveCount;
  checkWin();
};

// Drag-and-Drop Funktionalitet
let sourcePegIndex = null;

const allowDrop = (ev) => ev.preventDefault();

const dragStart = (ev) => {
  if (isSolving) return;
  const disk = parseInt(ev.target.textContent);
  const pegIndex = parseInt(ev.target.parentElement.getAttribute("data-peg"));
  if (disk !== pegs[pegIndex].peek()) {
    ev.preventDefault();
    return;
  }
  sourcePegIndex = pegIndex;
  ev.dataTransfer.setData("text/plain", ev.target.id);
};

const dropHandler = (ev) => {
  ev.preventDefault();
  if (isSolving || sourcePegIndex === null) return;
  const targetPegIndex = parseInt(ev.currentTarget.getAttribute("data-peg"));
  if (sourcePegIndex === targetPegIndex) {
    sourcePegIndex = null;
    return;
  }
  const disk = pegs[sourcePegIndex].pop();
  if (pegs[targetPegIndex].push(disk)) {
    moveCount++;
  } else {
    pegs[sourcePegIndex].push(disk);
    alert("Ulovligt træk!");
  }
  sourcePegIndex = null;
  render();
};

// Klik-baseret Flytning
let selectedPeg = null;

const handlePegClick = (pegIndex) => {
  if (isSolving) return;
  if (selectedPeg === null) {
    if (!pegs[pegIndex].isEmpty()) {
      selectedPeg = pegIndex;
      highlightPeg(pegIndex);
    }
  } else {
    if (selectedPeg === pegIndex) {
      selectedPeg = null;
      unhighlightPeg();
      return;
    }
    const disk = pegs[selectedPeg].pop();
    if (pegs[pegIndex].push(disk)) {
      moveCount++;
    } else {
      pegs[selectedPeg].push(disk);
      alert("Ulovligt træk!");
    }
    selectedPeg = null;
    unhighlightPeg();
    render();
  }
};

const highlightPeg = (pegIndex) => {
  [0, 1, 2].forEach((i) => {
    document
      .getElementById(`peg-${i}`)
      .classList.toggle("selected", i === pegIndex);
  });
};

const unhighlightPeg = () => {
  [0, 1, 2].forEach((i) => {
    document.getElementById(`peg-${i}`).classList.remove("selected");
  });
};

// Check for Win Condition
const checkWin = () => {
  if (pegs[2].size() === totalDisks) {
    alert(`Tillykke! Du har løst spillet på ${moveCount} træk.`);
    isSolving = false;
    solveButton.textContent = "Løs Spillet";
  }
};

// Reset Spillet
const resetGame = () => initializePegs();

// Event Lyttere
const attachEventListeners = () => {
  [0, 1, 2].forEach((i) => {
    const pegElement = document.getElementById(`peg-${i}`);
    pegElement.addEventListener("click", () => handlePegClick(i));
    pegElement.addEventListener("drop", dropHandler);
    pegElement.addEventListener("dragover", allowDrop);
  });
  document.getElementById("reset").addEventListener("click", resetGame);
  solveButton.addEventListener("click", solve);
};

// Initialisering
initializePegs();
attachEventListeners();
