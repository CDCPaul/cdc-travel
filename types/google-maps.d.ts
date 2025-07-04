declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps.places {
  class PlaceAutocompleteElement extends HTMLElement {
    constructor(options?: any);
    addEventListener(event: 'gmp-placeselect', handler: (event: any) => void): void;
  }
  
  interface PlacesLibrary {
    PlaceAutocompleteElement: typeof PlaceAutocompleteElement;
  }
}

export {}; 