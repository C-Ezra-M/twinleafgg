"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GravityMountain = void 0;
const game_error_1 = require("../../game/game-error");
const game_message_1 = require("../../game/game-message");
const trainer_card_1 = require("../../game/store/card/trainer-card");
const card_types_1 = require("../../game/store/card/card-types");
const check_effects_1 = require("../../game/store/effects/check-effects");
const state_utils_1 = require("../../game/store/state-utils");
const game_effects_1 = require("../../game/store/effects/game-effects");
const game_1 = require("../../game");
class GravityMountain extends trainer_card_1.TrainerCard {
    constructor() {
        super(...arguments);
        this.trainerType = card_types_1.TrainerType.STADIUM;
        this.regulationMark = 'H';
        this.set = 'SSP';
        this.cardImage = 'assets/cardback.png';
        this.setNumber = '177';
        this.name = 'Gravity Mountain';
        this.fullName = 'Gravity Mountain SV8';
        this.text = 'The maximum HP of all Stage 2 Pokémon in play is reduced by 30.';
    }
    reduceEffect(store, state, effect) {
        if (effect instanceof check_effects_1.CheckHpEffect && state_utils_1.StateUtils.getStadiumCard(state) === this) {
            const checkStage2 = (cardList) => {
                const pokemonCard = cardList.getPokemonCard();
                if ((pokemonCard === null || pokemonCard === void 0 ? void 0 : pokemonCard.stage) === card_types_1.Stage.STAGE_2) {
                    effect.hp -= 30;
                }
            };
            effect.player.forEachPokemon(game_1.PlayerType.BOTTOM_PLAYER, checkStage2);
            state_utils_1.StateUtils.getOpponent(state, effect.player).forEachPokemon(game_1.PlayerType.TOP_PLAYER, checkStage2);
        }
        if (effect instanceof game_effects_1.UseStadiumEffect && state_utils_1.StateUtils.getStadiumCard(state) === this) {
            throw new game_error_1.GameError(game_message_1.GameMessage.CANNOT_USE_STADIUM);
        }
        return state;
    }
}
exports.GravityMountain = GravityMountain;
