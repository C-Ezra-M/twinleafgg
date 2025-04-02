import { Card } from '../../game';
import { PokemonRetriever } from './pokemon-retriever';
import { PowHandExtension } from './pow-hand-extension';
import { RocketsAdmin } from './rockets-admin';
import { SurpriseTimeMachine } from './surprise-time-machine';

export const setEXTeamRocketReturns: Card[] = [
  new PokemonRetriever(),
  new PowHandExtension(),
  new RocketsAdmin(),
  new SurpriseTimeMachine()
];