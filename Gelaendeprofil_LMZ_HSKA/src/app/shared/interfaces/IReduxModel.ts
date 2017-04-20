/**
 * Specify the minimal interface for a REDUX-style model
 *
 * @author Jim Armstrong (www.algorithmist.net)
 *
 * @version 1.0
 */

 // RXJS
 import { Subject } from 'rxjs/Subject';

 export interface IReduxModel
 {
   subscribe( subject: Subject<any> ): void;

   unsubscribe( subject: Subject<any> ): void;

   dispatchAction(action: number, payload: Object): void;
 }
