import { Injectable } from '@angular/core';
import {Map} from "leaflet";

@Injectable()
export class MapService {
  public map: Map;
  constructor() { }

}
