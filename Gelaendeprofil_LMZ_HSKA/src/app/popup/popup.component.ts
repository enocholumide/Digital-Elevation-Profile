import { Component } from '@angular/core';
import { PopoverModule } from 'ngx-bootstrap/popover';

@Component({
  selector: 'popup',
  template: 'popup.component.html'
})
export class PopUPComponent { 
    
        name = 'Angular';
    
     Initialize() {

      console.log('yayy');

    } 
 }