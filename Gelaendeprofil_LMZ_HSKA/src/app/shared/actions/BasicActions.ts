export enum BasicActions
{
  CURRENT_LOCATION,     // request map location based on current IP address
  ADDRESS,              // request map location based on physical address
  GET_MAP_PARAMS,       // request initial map parameters
  LOCATION_ERROR,       // error in requesting current location
  ADDRESS_ERROR,        // error in requesting navigate to specified address
  NONE,                 // no action
  ALL                   // entire application updated (to be implemented as an exercise)
}
