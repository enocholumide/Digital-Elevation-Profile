import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { Angular2FontAwesomeModule } from 'angular2-font-awesome/angular2-font-awesome';

import { ModalModule } from 'angular2-modal';
import { BootstrapModalModule } from 'angular2-modal/plugins/bootstrap';

import { AppComponent } from './app.component';
import { LeafletmapComponent } from './leafletmap/leafletmap.component';
import { ProfileComponent } from './profile/profile.component';
import { EmitterService } from './shared/emitter.service';


@NgModule({
  declarations: [
    AppComponent,
    LeafletmapComponent,
    ProfileComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    Angular2FontAwesomeModule,
    ModalModule.forRoot(),
    BootstrapModalModule
  ],
  providers: [EmitterService],
  bootstrap: [AppComponent]
})
export class AppModule { }