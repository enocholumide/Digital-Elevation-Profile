import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

@Injectable()
export class EmitterService {
  private case = new Subject<any>(); case$ = this.case.asObservable();
  private caseRiverandPeak = new Subject<any>(); caseRiverandPeak$ = this.caseRiverandPeak.asObservable();  
  publishData(data:any) { this.case.next(data) }
  publishRiverAndPeaks(data:Array<any>) { this.caseRiverandPeak.next(data) }
}
