/** 
 * Copyright 2016 Jim Armstrong (www.algorithmist.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This is the root application module for the Leaflet application
 *
 * @author Jim Armstrong (www.algorithmist.net)
 * 
 * @version 1.0
 */

// platform imports
import { Component     } from '@angular/core';
import { Directive     } from '@angular/core';
import { NgModule      } from '@angular/core';
import { FormsModule   } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule    } from '@angular/http';

// main application component and supporting components
import { AppComponent     } from './app.component';
import { LeafletMap       } from './LeafletMap.component';
import { LoadingComponent } from './loading/loading.component';
import { MapNavComponent  } from './navigator/navigator.component'; 
import { BasemapsComponent  } from './basemaps/basemaps.component';
 
// the shared model and dispatcher modules
import { SharedModelModule      } from './sharedModel.module';
import { SharedDispatcherModule } from './sharedDispatcher.module';

@NgModule({
  declarations: [
    AppComponent, LeafletMap, LoadingComponent, MapNavComponent, BasemapsComponent
  ],

  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    SharedModelModule.forRoot(),
    SharedDispatcherModule.forRoot()
  ],

  bootstrap: [AppComponent]
})

export class AppModule { }
