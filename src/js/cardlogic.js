// --- 1. IMPORTS & SETUP ---
import gsap from "gsap";
import drawSVG from "gsap/DrawSVGPlugin";
import "./cardcomponent.js"; // Your Lit component
import initialCardData from "../cards.json"; // Import the JSON data directly
import cardPatternData from "../patterns.json";

// Import the store and all its actions
import { cardStore, initializeCards, spawnRandomCards, despawnCard } from "./cardstorage.js";


gsap.registerPlugin(drawSVG);

const cardContainer = document.querySelector(".cardcontainer");
const svg = document.getElementById("lines-svg");
const svgNS = "http://www.w3.org/2000/svg";
const defaultCardCount = 4;
const maxCardCount = 6;
var svgAnimDuration = 0.5; // Default animation duration for SVG lines
var gridPositions = [];

function patternPlace() {
  resetSvgAnimation();
  console.log(svgAnimDuration);
  //const pattern = cardPatternData.patterns
  // .find(p => p.requirement === 4);
  //const pattern = getRandom(cardPatternData.patterns);
  const pattern = getRandom(cardPatternData.patterns.filter(p => p.requirement === cardStore.get().spawnedCards.length));
  console.log("Moving cards to pattern:", pattern.points);

  for (let i = 0; i < cardStore.get().spawnedCards.length; i++) {
    const card = cardStore.get().spawnedCards[i];
    const cardElement = document.querySelector('[data-name="' + card.name + '"]');
    const point = document.getElementById('gp' + pattern.points[i]);

    console.log(`Moving card ${card.name} to point ${point.id} at (${getElementCenter(point).x}, ${getElementCenter(point).y})`);

    gsap.to(cardElement, {
      duration: 0.4,
      x: getElementCenter(point).x - cardElement.offsetWidth / 2,
      y: getElementCenter(point).y - cardElement.offsetHeight / 2,
      onComplete: updateLines
    });
  }
}

// helper functions
function getElementCenter(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return { x: centerX, y: centerY };
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


function computeGrid(){
  gridPositions = [];
  document.querySelectorAll(".posgrid > div").forEach((el) => {
    el.innerHTML = el.id + ": " + Math.floor(getElementCenter(el).x) + ", " + Math.floor(getElementCenter(el).y);
    gridPositions.push({ x: Math.floor(getElementCenter(el).x), y: Math.floor(getElementCenter(el).y) });
  });
}

function waitFor(element) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations, observer) => {
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

// --- 2. PURE UI FUNCTIONS ---
// These functions only affect the view. They don't manage state.

function resetSvgAnimation() {
  svgAnimDuration = 0.5; // Reset animation duration for new animations
}

/**
 * Draws SVG lines between all elements currently in the card container.
 */
function updateLines() {
  svg.innerHTML = "";
  const spawnedElements = cardContainer.children;
  if (spawnedElements.length < 2) return;

  const svgRect = svg.getBoundingClientRect();

  for (let i = 0; i < spawnedElements.length; i++) {
    for (let j = i + 1; j < spawnedElements.length; j++) {
      const center1 = getElementCenter(spawnedElements[i]);
      const center2 = getElementCenter(spawnedElements[j]);

      // Make the coordinates relative to the SVG canvas
      const x1 = center1.x - svgRect.left;
      const y1 = center1.y - svgRect.top;
      const x2 = center2.x - svgRect.left;
      const y2 = center2.y - svgRect.top;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#555"); line.setAttribute("stroke-width", "2");
      line.classList.add("connecting-line");
      svg.appendChild(line);
    }
  }

  gsap.from(".connecting-line", {
    duration: svgAnimDuration,
    drawSVG: "0%",
    ease: "power1.inOut",
    stagger: 0.05,
    onComplete: () => {
      svgAnimDuration = 0;
    }
  });
}

/**
 * Randomly positions all cards currently in the container.
 */
function repositionAllCards() {
  resetSvgAnimation();

  const spawnedElements = Array.from(cardContainer.children);

  spawnedElements.forEach((card) => {
    let randomPosition = getRandom(gridPositions);
    console.log(`[UI] Repositioning card ${card.dataset.name} to ${randomPosition.x}, ${randomPosition.y}`);
    gsap.to(card, {
      duration: 0.4,
      x: randomPosition.x - card.offsetWidth / 2,
      y: randomPosition.y - card.offsetHeight / 2
    });
  });

  // Update lines after the animation completes
  setTimeout(updateLines, 400);
}

// --- 3. THE RENDERER (The heart of the new system) ---
// This listens for any change to the store and syncs the UI.
cardStore.listen(currentState => {
  console.log('[UI] Store changed, re-rendering spawned cards...');
  resetSvgAnimation(); 

  // This is a more advanced sync than innerHTML = '' to allow for animations.
  const spawnedNames = currentState.spawnedCards.map(c => c.name);
  const existingElements = Array.from(cardContainer.children);

  // REMOVE cards that are no longer in the state
  existingElements.forEach(el => {
    if (!spawnedNames.includes(el.dataset.name)) {
      gsap.to(el, {
        duration: svgAnimDuration,
        opacity: 0,
        scale: 0.5,
        onComplete: () => {
          el.remove();
          updateLines(); // Update lines after a card is removed
        }
      });
    }
  });

  // ADD cards that are in the state but not in the DOM
  spawnedNames.forEach(name => {
    if (!cardContainer.querySelector(`[data-name="${name}"]`)) {
      const cardData = currentState.allCards.find(c => c.name === name);
      if (cardData) {
        const newCard = document.createElement('arcana-card');
        newCard.dataset.name = cardData.name; // CRITICAL: Stamp the ID
        newCard.imgSrc = cardData.img;
        newCard.sign = cardData.sign;
        newCard.name = cardData.name;
        cardContainer.appendChild(newCard);
      }
    }
  });

   //document.querySelector(".debug_cs_content").innerHTML = spawnedNames;

  // Lines need to be updated after any potential additions.
  // setTimeout gives the DOM a moment to update.
  //setTimeout(updateLines, 50);
});

// --- 4. EVENT LISTENERS ---
// Event listeners ONLY call store actions or pure UI functions.

document.querySelector("#refresher").addEventListener("click", repositionAllCards);

document.querySelector("#debug-button").addEventListener("click", patternPlace);

document.querySelector("#new-card").addEventListener("click", () => {
  if (cardStore.get().spawnedCards.length >= maxCardCount) {
    const deletedCard = getRandom(cardStore.get().spawnedCards);
    despawnCard(deletedCard.name);
  }
  spawnRandomCards(1);
  setTimeout(() => {
    patternPlace();
  }, 100);
});

// Use event delegation for removing cards
cardContainer.addEventListener("click", (e) => {
  // Find the parent arcana-card element
  const cardElement = e.target.closest('arcana-card');
  if (cardElement) {
    const cardName = cardElement.dataset.name;
    console.log(`[UI] User clicked to remove card: ${cardName}`);
    despawnCard(cardName);
    if (cardContainer.children.length <= defaultCardCount) {
      spawnRandomCards(1);
    }

    //repositionAllCards();
    setTimeout(patternPlace, 100);
    //patternPlace();
  }
});

// Listen for GSAP drag events from any card
cardContainer.addEventListener('card-drag', updateLines);
window.addEventListener("resize", updateLines);
window.addEventListener("resize", computeGrid);

// --- 5. INITIALIZATION ---
// Kick everything off.
async function main() {
  await initializeCards(initialCardData);
  console.log('[UI] Initializing with default cards.');
  resetSvgAnimation();
  computeGrid();
  spawnRandomCards(defaultCardCount);

  Array.from(cardContainer.children).forEach(card => {
    card.getBoundingClientRect();
  });

  setTimeout(() => {
    patternPlace();
  }, 500);

  updateLines();
  //repositionAllCards();
}

window.addEventListener('DOMContentLoaded', () => {
  main();
});

console.log('[UI] Grid positions initialized:', gridPositions);