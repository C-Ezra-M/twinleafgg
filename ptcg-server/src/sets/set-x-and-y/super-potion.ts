import { TrainerCard } from '../../game/store/card/trainer-card';
import { TrainerType, SuperType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';
import { ChoosePokemonPrompt } from '../../game/store/prompts/choose-pokemon-prompt';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
import {
  PlayerType, SlotType, CardTarget, GameError, GameMessage,
  PokemonCardList, Card, ChooseCardsPrompt, EnergyCard
} from '../../game';
import { HealEffect } from '../../game/store/effects/game-effects';

function* playCard(next: Function, store: StoreLike, state: State, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;

  const blocked: CardTarget[] = [];
  let hasPokemonWithDamage: boolean = false;
  player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (cardList, card, target) => {
    if (cardList.damage === 0 || !cardList.cards.some(c => c instanceof EnergyCard)) {
      blocked.push(target);
    } else {
      hasPokemonWithDamage = true;
    }
  });

  if (hasPokemonWithDamage === false) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // Do not discard the card yet
  effect.preventDefault = true;

  let targets: PokemonCardList[] = [];
  yield store.prompt(state, new ChoosePokemonPrompt(
    player.id,
    GameMessage.CHOOSE_POKEMON_TO_HEAL,
    PlayerType.BOTTOM_PLAYER,
    [SlotType.ACTIVE, SlotType.BENCH],
    { allowCancel: true, blocked }
  ), results => {
    targets = results || [];
    next();
  });

  if (targets.length === 0) {
    return state;
  }

  const target = targets[0];
  let cards: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player,
    GameMessage.CHOOSE_CARD_TO_DISCARD,
    target,
    { superType: SuperType.ENERGY },
    { min: 1, max: 1, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  if (cards.length === 0) {
    return state;
  }

  target.moveCardsTo(cards, player.discard);

  // Heal Pokemon
  const healEffect = new HealEffect(player, target, 60);
  store.reduceEffect(state, healEffect);
  player.supporter.moveCardTo(effect.trainerCard, player.discard);
  return state;
}

export class SuperPotion extends TrainerCard {

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'XY';

  public name: string = 'Super Potion';

  public fullName: string = 'Super Potion XY';

  public cardImage: string = 'assets/cardback.png';

  public setNumber: string = '128';

  public text: string =
    'Heal 60 damage from 1 of your Pokemon. If you do, discard an Energy ' +
    'attached to that Pokemon.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, effect);
      return generator.next().value;
    }
    return state;
  }

}
