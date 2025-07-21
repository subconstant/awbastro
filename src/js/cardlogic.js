/* Import */
import gsap from "gsap";
import drawSVG from "gsap/DrawSVGPlugin";
gsap.registerPlugin(drawSVG);

import "./cardcomponent.js";

import cardData from "../cards.json";

const cardDataNamed = (function(){
  let namesList = [];
  cardData.cards.forEach((card) => {
    namesList.push(card.name);
  });
  return namesList;
})();


var sessionCards = document.querySelectorAll("arcana-card");
var sessionCardsNamed = [];
var unusedCards = [];

const svg = document.getElementById("lines-svg");
const svgNS = "http://www.w3.org/2000/svg";
var svgAnimDuration = 0.5;

const defaultCardCount = 4;

function refreshAll(){
  refreshCardList();
  cardRefresh();
  updateLines();
}

async function refreshCardList(){
  sessionCards = document.querySelectorAll("arcana-card");
  document.querySelector(".debug_cs_content").innerHTML = "";
  for (const card of sessionCards) {
    await card.updateComplete;
    sessionCardsNamed.push(card.getAttribute('data-name'));
    document.querySelector(".debug_cs_content").innerHTML += card.getAttribute('data-name') + "<br/>";
  }
}

function filterDeck(){
  console.log(cardDataNamed);
  console.log(sessionCardsNamed);
  cardDataNamed.forEach((card) => {
    if (sessionCardsNamed.includes(card)){
      unusedCards.push(card);
    }
  });
  console.log('Filter function test');
  console.log(unusedCards);
}

/* SVG line updates */
function updateLines() {
  svg.innerHTML = "";
  if (sessionCards.length < 2) {return}

  for (let i = 0; i < sessionCards.length; i++) {
    for (let j = i + 1; j < sessionCards.length; j++) {
      const box1 = sessionCards[i];
      const box2 = sessionCards[j];

      const rect1 = box1.getBoundingClientRect();
      const rect2 = box2.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      const x1 = rect1.left + rect1.width / 2 - svgRect.left;
      const y1 = rect1.top + rect1.height / 2 - svgRect.top;
      const x2 = rect2.left + rect2.width / 2 - svgRect.left;
      const y2 = rect2.top + rect2.height / 2 - svgRect.top;

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);

      line.setAttribute("stroke", "#555");
      line.setAttribute("stroke-width", "1.5");
      line.classList.add("connecting-line");
      svg.appendChild(line);
    }
  }

  gsap.from(".connecting-line", {
    duration: svgAnimDuration,
    drawSVG: "0%",
    ease: "power1.inOut",
    stagger: 0.05,
    afterCallback: () => {
      svgAnimDuration = 0;
    },
  });
}

/* Random init cards */
function loadCards(){
  let cardDeck = cardData.cards;

  for (let i = 0; i < defaultCardCount; i++) {
    let cardSelect = cardDeck[Math.floor(Math.random() * cardDeck.length)];
    cardDeck = cardDeck.filter(item => item !== cardSelect);
    constructCard(cardSelect.img, cardSelect.name, cardSelect.sign);
  }
  
  customElements.whenDefined('arcana-card').then(() => {
    refreshAll();
  });

}

function cardPosition(){
  sessionCards.forEach((card) => {
    gsap.to(card, { x: Math.floor(Math.random() * (window.innerWidth - 400)) + 100 + "px" })
    gsap.to(card, { y: Math.floor(Math.random() * (window.innerHeight - 400)) + 20 + "px"  })
  });

  setTimeout(function(){
    updateLines();
  }, 400);
}

function cardRefresh(){
  svgAnimDuration = 0.5;
  cardPosition();
}

function cardRemove(me){
  gsap.to(me, {
    duration: 0.3,
    opacity: 0,
    scale: 0.5,
    onComplete: function() {
      me.remove();
      updateLines();
    }
  });
}

function newCardTest() {
  constructCard('/src/img/img (1).jpg', 'test card', 't');
  refreshAll();
}

function constructCard(src,name,sign) {
  let newCard = document.createElement('arcana-card');
  newCard.imgSrc = src;
  newCard.sign = sign;
  newCard.name = name;
  newCard.cardDataName = name;
  document.querySelector(".cardcontainer").appendChild(newCard);
  newCard.addEventListener('card-drag', updateLines);
}

document.querySelector("#refresher").addEventListener("click", cardRefresh);
document.querySelector("#new-card").addEventListener("click", newCardTest);

//to fix:
sessionCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    cardRemove(e.currentTarget);
  });
});

loadCards();

filterDeck();

window.addEventListener("resize", updateLines);

