import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'side-bar-component',
  templateUrl: 'sidebar.component.html'
})
export class SideBarComponent {
  public isCollapsed = false;
}