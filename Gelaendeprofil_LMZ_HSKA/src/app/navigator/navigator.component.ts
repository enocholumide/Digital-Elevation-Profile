// platform imports
import { Component } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Injectable              } from '@angular/core';

import { LeafletMap } from '../LeafletMap.component';

// base FLUX component & dispatcher
import { FluxComponent } from '../shared/flux.component';
import { FluxDispatcher } from '../shared/FluxDispatcher';

// actions
import { BasicActions } from '../shared/actions/BasicActions';

// rxjs
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

// TSMT Location
import { TSMT$Location } from '../shared/Location';
import { isError } from 'util';

@Component(
{
  selector: 'map-navigator',

  templateUrl: 'navigator.component.html',

  styleUrls: ['navigator.component.css'],
})

/**
 * MapNavCompoennt - allows a text address to be entered as a place to navigate the map or click
 * a button to move the map to a location based
 * on current IP address
 */
  export class MapNavComponent extends FluxComponent
  {_http: any;
     public _address: string;                   // the current address on which to center the map
     public _adresslists: string;

     protected _showNavProgress = false;  // true if navigation progress display is shown
     protected _showLocProgress = false;  // true if show-location display is shown

     protected _navProgressText = '';      // text shown to indicate navigation progress
     protected _locProgressText = '';      // text shown to indicate location progress

     protected _clicked = false;          // protect against multiple submissions





   /**
   * Construct the MAIN APP component
   *
   * @param d: FluxDispatcher Inject FLUX-style dispatcher used by all FluxComponents
   *
   * @return Nothing
   */
   constructor(private _d: FluxDispatcher, http: Http)
   {
     super(_d);
     this._http = http;
     console.log('Hello1 This works perfectly we should find a way to get the js file to work :('); // This works perfectly
   }



   // update the component based on a new state of the global store
   protected __onModelUpdate(data: Object): void
   {
     this._clicked = false;

     switch (data['action'])
     {
       case BasicActions.ADDRESS:
         this._navProgressText = 'Map moved to requested address';
         this._clicked         = false;
       break;

       case BasicActions.CURRENT_LOCATION:
         this._locProgressText = 'Map moved to current IP location';
         this._clicked         = false;
       break;

       case BasicActions.ADDRESS_ERROR:
         this._navProgressText = 'Error geocoding input address. Please enter a valid address.';
         this._clicked         = false;
       break;

       case BasicActions.LOCATION_ERROR:
         this._locProgressText = 'Unable to geocode current IP location';
         this._clicked         = false;
       break;
     }
   }

   protected __onNavigate(): void
   {
     if (!this._clicked)
     {
       this._clicked         = true;
       this._showLocProgress = false;
       this._showNavProgress = true;

       if (this._address && this._address !== '')
       {
         this._navProgressText = 'Geocoding requested address, please wait ...';

         this._dispatcher.dispatchAction(BasicActions.ADDRESS, {address: this._address} );
       }
       else
       {
         this._navProgressText = 'Please enter an address';
         this._clicked         = false;
       }
     }
     else
     {
       this._locProgressText = 'Address fetch in progress, waiting for service return ...';
     }
   }

   protected __onCurrentLocation(): void
   {
      if (!this._clicked)
      {
       this._clicked         = true;
       this._locProgressText = 'Fetching location ... please wait';
       this._showLocProgress = true;
       this._showNavProgress = false;

       this._dispatcher.dispatchAction(BasicActions.CURRENT_LOCATION, null);
      }
      else
      {
       this._locProgressText = 'Location fetch in progress, waiting for service return ...';
      }
   }

}


