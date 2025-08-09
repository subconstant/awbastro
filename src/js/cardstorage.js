import { atom } from 'nanostores';

// The atom holds our entire application state.
export const cardStore = atom({
  allCards: [],       // The immutable master list from JSON
  spawnedCards: [],     // Array of card objects currently on screen
});

// --- ACTIONS (The only way to safely modify the store) ---

/**
 * Fetches initial data from the JSON file and sets up the store.
 */
export async function initializeCards(cardData) {
  cardStore.set({
    allCards: cardData.cards,
    spawnedCards: []
  });
  console.log('[Store] Initialized with master list.');
}

/**
 * Spawns a specific number of random cards that are not already spawned.
 */
export function spawnRandomCards(count) {
  const currentState = cardStore.get();

  // Figure out which cards are actually available
  const spawnedNames = currentState.spawnedCards.map(c => c.name);
  const available = currentState.allCards.filter(c => !spawnedNames.includes(c.name));

  if (available.length === 0) {
    console.warn('[Store] No more cards to spawn.');
    return;
  }

  // Shuffle and pick the cards to spawn
  const cardsToSpawn = available.sort(() => 0.5 - Math.random()).slice(0, count);

  // Update the spawned list
  const newSpawned = [...currentState.spawnedCards, ...cardsToSpawn];

  cardStore.set({ ...currentState, spawnedCards: newSpawned });
}

/**
 * Removes a specific card from the spawned list by its name.
 */
export function despawnCard(cardName) {
  const currentState = cardStore.get();
  const cardToDespawn = currentState.spawnedCards.find(c => c.name === cardName);

  if (!cardToDespawn) {
    console.error(`[Store] Could not find spawned card with name: ${cardName}`);
    return;
  }

  // Create the new spawned list by filtering out the card
  const newSpawned = currentState.spawnedCards.filter(c => c.name !== cardName);

  cardStore.set({ ...currentState, spawnedCards: newSpawned });
}