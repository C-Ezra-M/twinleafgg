import {
  AttachPokemonToolEffect, TrainerEffect, PlaySupporterEffect,
  PlayItemEffect, PlayStadiumEffect
} from '../effects/play-card-effects';
import { GameError } from '../../game-error';
import { GameMessage, GameLog } from '../../game-message';
import { Effect } from '../effects/effect';
import { State } from '../state/state';
import { StoreLike } from '../store-like';
import { StateUtils } from '../state-utils';
import { CardTag, TrainerType } from '../card/card-types';


export function playTrainerReducer(store: StoreLike, state: State, effect: Effect): State {

  /* Play supporter card */
  if (effect instanceof PlaySupporterEffect) {
    const player = effect.player;
    const playTrainer = new TrainerEffect(effect.player, effect.trainerCard, effect.target);
    state = store.reduceEffect(state, playTrainer);
    store.log(state, GameLog.LOG_PLAYER_PLAYS_SUPPORTER, {
      name: effect.player.name,
      card: effect.trainerCard.name
    });

    player.supporterTurn += 1;

    return state;
  }

  /* Play stadium card */
  if (effect instanceof PlayStadiumEffect) {
    const player = effect.player;
    const opponent = StateUtils.getOpponent(state, player);
    const stadiumCard = StateUtils.getStadiumCard(state);

    // Handle player's existing stadium
    if (player.stadium.cards.length > 0) {
      if (stadiumCard && stadiumCard.tags.includes(CardTag.PRISM_STAR)) {
        player.stadium.moveTo(player.lostzone);
      } else {
        player.stadium.moveTo(player.discard);
      }
    }

    // Handle opponent's existing stadium
    if (opponent.stadium.cards.length > 0) {
      if (stadiumCard && stadiumCard.tags.includes(CardTag.PRISM_STAR)) {
        opponent.stadium.moveTo(opponent.lostzone);
      } else {
        opponent.stadium.moveTo(opponent.discard);
      }
    }

    store.log(state, GameLog.LOG_PLAYER_PLAYS_STADIUM, {
      name: effect.player.name,
      card: effect.trainerCard.name
    });
    player.stadiumUsedTurn = 0;
    player.hand.moveCardTo(effect.trainerCard, player.stadium);
    return state;
  }

  // Play Pokemon Tool card
  if (effect instanceof AttachPokemonToolEffect) {
    const pokemonCard = effect.target.getPokemonCard();
    if (pokemonCard === undefined) {
      throw new GameError(GameMessage.INVALID_TARGET);
    }
    if (effect.target.tool !== undefined) {
      throw new GameError(GameMessage.POKEMON_TOOL_ALREADY_ATTACHED);
    }

    store.log(state, GameLog.LOG_PLAYER_PLAYS_TOOL, {
      name: effect.player.name,
      card: effect.trainerCard.name,
      pokemon: pokemonCard.name
    });
    effect.player.hand.moveCardTo(effect.trainerCard, effect.target);
    effect.target.tool = effect.trainerCard;

    const playTrainer = new TrainerEffect(effect.player, effect.trainerCard, effect.target);
    state = store.reduceEffect(state, playTrainer);

    return state;
  }

  // Play item card
  if (effect instanceof PlayItemEffect) {
    const playTrainer = new TrainerEffect(effect.player, effect.trainerCard, effect.target);
    effect.player.hand.moveCardTo(effect.trainerCard, effect.player.supporter);
    state = store.reduceEffect(state, playTrainer);
    store.log(state, GameLog.LOG_PLAYER_PLAYS_ITEM, {
      name: effect.player.name,
      card: effect.trainerCard.name
    });

    // const player = effect.player;
    // player.supporter.moveCardTo(effect.trainerCard, player.discard);
    return state;
  }

  // Process trainer effect
  if (effect instanceof TrainerEffect) {
    if (effect.player.hand.cards.includes(effect.trainerCard)) {
      // IF DIAMOND/PEARL FORMAT, SUPPORTER WILL STAY ON FIELD UNTIL THE END OF YOUR TURN
      const isSupporter = effect.trainerCard.trainerType === TrainerType.SUPPORTER;
      const target = isSupporter ? effect.player.supporter : effect.player.discard;
      effect.player.hand.moveCardTo(effect.trainerCard, target);
      // effect.
      // effect.player.supporter.moveCardTo(effect.trainerCard, effect.player.discard);
    }
    return state;
  }
  return state;
}
